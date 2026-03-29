import type { APIRoute } from 'astro'
import { assertPageCanUpdate, PageConflictError } from '@/lib/page-rules'
import { PageSchema } from '@/lib/schema'
import { deletePage, listPages, loadPage, savePage } from '@/lib/storage'
import { assertTemplatePageCanDelete, assertTemplatePageContract, TemplateContractError } from '@/lib/template-contract'

export const GET: APIRoute = async ({ params, locals }) => {
  if (!params.id) {
    return Response.json({ ok: false, error: 'Missing page id' }, { status: 400 })
  }

  try {
    const page = await loadPage(locals?.env, params.id)
    return Response.json(page)
  } catch {
    return Response.json({ ok: false, error: 'Page not found' }, { status: 404 })
  }
}

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!params.id) {
    return Response.json({ ok: false, error: 'Missing page id' }, { status: 400 })
  }

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
    assertPageCanUpdate(await listPages(runtimeEnv), params.id, parsed.data)
    assertTemplatePageContract(parsed.data)
  } catch (error) {
    if (error instanceof PageConflictError || error instanceof TemplateContractError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 })
    }

    throw error
  }

  const saved = await savePage(runtimeEnv, params.id, parsed.data)
  return Response.json({ ok: true, data: saved })
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!params.id) {
    return Response.json({ ok: false, error: 'Missing page id' }, { status: 400 })
  }

  try {
    assertTemplatePageCanDelete(params.id)
    await deletePage(locals?.env, params.id)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof TemplateContractError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 })
    }

    return Response.json({ ok: false, error: 'Page not found' }, { status: 404 })
  }
}
