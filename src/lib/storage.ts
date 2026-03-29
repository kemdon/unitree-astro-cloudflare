import { comparePagesForDisplay } from './page-order'
import { PageConflictError, assertUniquePageCollection } from './page-rules'
import { getDefaultPageById, getDefaultPagesContent, getDefaultSiteContent } from './default-content'
import { PageSchema, SiteSchema, type PageData, type SiteConfig } from './schema'
import type { CloudflareEnv } from './cloudflare-env'
import { ZodError } from 'zod'

const SITE_KEY = 'default'

type SiteRow = {
  data: string
}

type PageRow = {
  data: string
}

function stringifyRecord(value: unknown) {
  return JSON.stringify(value)
}

function parseStoredJson<T>(source: string) {
  return JSON.parse(source) as T
}

function toStorageErrorMessage(name: 'site' | 'pages') {
  return `Missing ${name} content in D1. Apply migrations and run the seed script before starting the app.`
}

function requireEnv(env?: CloudflareEnv) {
  if (!env) {
    throw new Error('Cloudflare bindings are unavailable. Ensure the request is running through the Cloudflare middleware.')
  }

  return env
}

function isUniqueConstraintError(error: unknown, table: string, column: string) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('UNIQUE constraint failed') && message.includes(`${table}.${column}`)
}

function shouldFallbackToBundledContent(error: unknown) {
  if (error instanceof SyntaxError || error instanceof ZodError) {
    return true
  }

  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes('Cloudflare bindings are unavailable') ||
    message.includes('Missing site content in D1') ||
    message.includes('Missing pages content in D1') ||
    message.includes('no such table')
  )
}

export async function loadSite(env?: CloudflareEnv) {
  try {
    const runtimeEnv = requireEnv(env)
    const row = await runtimeEnv.DB.prepare('SELECT data FROM site_config WHERE site_key = ?1').bind(SITE_KEY).first<SiteRow>()

    if (!row?.data) {
      throw new Error(toStorageErrorMessage('site'))
    }

    return SiteSchema.parse(parseStoredJson<SiteConfig>(row.data))
  } catch (error) {
    if (shouldFallbackToBundledContent(error)) {
      return getDefaultSiteContent()
    }

    throw error
  }
}

export async function saveSite(env: CloudflareEnv | undefined, data: SiteConfig) {
  const runtimeEnv = requireEnv(env)
  const parsed = SiteSchema.parse(data)
  const updatedAt = new Date().toISOString()

  await runtimeEnv.DB.prepare(
    `
      INSERT INTO site_config (site_key, data, updated_at)
      VALUES (?1, ?2, ?3)
      ON CONFLICT(site_key) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `,
  )
    .bind(SITE_KEY, stringifyRecord(parsed), updatedAt)
    .run()

  return parsed
}

export async function listPages(env?: CloudflareEnv) {
  try {
    const runtimeEnv = requireEnv(env)
    const { results = [] } = await runtimeEnv.DB.prepare('SELECT data FROM pages').all<PageRow>()
    const pages = results.map((entry) => PageSchema.parse(parseStoredJson<PageData>(entry.data)))

    if (pages.length === 0) {
      throw new Error(toStorageErrorMessage('pages'))
    }

    assertUniquePageCollection(pages)
    return pages.sort(comparePagesForDisplay)
  } catch (error) {
    if (shouldFallbackToBundledContent(error)) {
      return getDefaultPagesContent()
    }

    throw error
  }
}

export async function loadPage(env: CloudflareEnv | undefined, id: string) {
  try {
    const runtimeEnv = requireEnv(env)
    const row = await runtimeEnv.DB.prepare('SELECT data FROM pages WHERE id = ?1').bind(id).first<PageRow>()

    if (!row?.data) {
      throw new Error(`Page "${id}" not found`)
    }

    return PageSchema.parse(parseStoredJson<PageData>(row.data))
  } catch (error) {
    if (shouldFallbackToBundledContent(error)) {
      const page = getDefaultPageById(id)
      if (page) {
        return page
      }
    }

    throw error
  }
}

export async function savePage(env: CloudflareEnv | undefined, id: string, data: PageData) {
  const runtimeEnv = requireEnv(env)
  const parsed = PageSchema.parse(data)
  const updatedAt = new Date().toISOString()

  try {
    await runtimeEnv.DB.prepare(
      `
        INSERT INTO pages (id, slug, page_type, data, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          page_type = excluded.page_type,
          data = excluded.data,
          updated_at = excluded.updated_at
      `,
    )
      .bind(id, parsed.slug, parsed.pageType, stringifyRecord(parsed), updatedAt)
      .run()
  } catch (error) {
    if (isUniqueConstraintError(error, 'pages', 'slug')) {
      throw new PageConflictError(`Page slug "${parsed.slug}" already exists`)
    }

    throw error
  }

  return parsed
}

export async function deletePage(env: CloudflareEnv | undefined, id: string) {
  const runtimeEnv = requireEnv(env)
  const existing = await runtimeEnv.DB.prepare('SELECT id FROM pages WHERE id = ?1').bind(id).first<{ id: string }>()
  if (!existing?.id) {
    throw new Error(`Page "${id}" not found`)
  }

  await runtimeEnv.DB.prepare('DELETE FROM pages WHERE id = ?1').bind(id).run()
}
