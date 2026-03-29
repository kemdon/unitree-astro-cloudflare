import type { CloudflareEnv } from './cloudflare-env'
import { listPages, loadPage as loadPageById, loadSite as loadSiteConfig } from './storage'
import type { PageData } from './schema'

export async function loadSite(env?: CloudflareEnv) {
  return loadSiteConfig(env)
}

export async function loadPage(env: CloudflareEnv | undefined, id: string) {
  return loadPageById(env, id)
}

export async function loadPageBySlug(env: CloudflareEnv | undefined, slugPath: string) {
  const pages = await listPages(env)
  return pages.find((page: PageData) => page.slug === slugPath) ?? null
}

export async function loadNavigationPages(env?: CloudflareEnv) {
  return listPages(env)
}
