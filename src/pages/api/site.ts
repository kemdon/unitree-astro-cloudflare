import type { APIRoute } from 'astro'
import { SiteSchema } from '@/lib/schema'
import { loadSite, listPages, saveSite } from '@/lib/storage'
import { assertSiteNavigationContract, TemplateContractError } from '@/lib/template-contract'

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = locals?.env
  const site = await loadSite(runtimeEnv)
  return Response.json(site)
}

export const PUT: APIRoute = async ({ request, locals }) => {
  const payload = await request.json()
  const parsed = SiteSchema.safeParse(payload)
  const runtimeEnv = locals?.env

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: 'Invalid site payload',
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  try {
    assertSiteNavigationContract(parsed.data, await listPages(runtimeEnv))
  } catch (error) {
    if (error instanceof TemplateContractError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 })
    }

    throw error
  }

  const saved = await saveSite(runtimeEnv, parsed.data)
  return Response.json({ ok: true, data: saved })
}
