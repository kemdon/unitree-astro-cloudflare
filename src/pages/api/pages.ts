import type { APIRoute } from 'astro'
import { assertPageCanCreate, PageConflictError } from '@/lib/page-rules'
import { PageSchema } from '@/lib/schema'
import { listPages, savePage } from '@/lib/storage'
import { assertTemplatePageContract, TemplateContractError } from '@/lib/template-contract'

export const GET: APIRoute = async ({ locals }) => {
  const pages = await listPages(locals?.env)
  return Response.json(pages)
}

export const POST: APIRoute = async ({ request, locals }) => {
  const payload = await request.json()
  const parsed = PageSchema.safeParse(payload)
  const runtimeEnv = locals?.env

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: 'Invalid page payload',
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  try {
    assertPageCanCreate(await listPages(runtimeEnv), parsed.data)
    assertTemplatePageContract(parsed.data)
  } catch (error) {
    if (error instanceof PageConflictError || error instanceof TemplateContractError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 })
    }

    throw error
  }

  const saved = await savePage(runtimeEnv, parsed.data.id, parsed.data)
  return Response.json({ ok: true, data: saved }, { status: 201 })
}
