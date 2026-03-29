import { describe, expect, it } from 'vitest'
import { listPages, loadPage, loadSite } from '../src/lib/storage'
import type { CloudflareEnv, D1PreparedStatementLike } from '../src/lib/cloudflare-env'

function createEnvReturning(rows: { site?: string | null; pages?: Array<string | null> }): CloudflareEnv {
  return {
    DB: {
      prepare(query: string) {
        const statement: D1PreparedStatementLike = {
          bind(..._values: unknown[]) {
            return statement
          },
          async first<T = Record<string, unknown>>() {
            if (query.includes('site_config')) {
              return (rows.site == null ? null : ({ data: rows.site } as T))
            }

            const firstPage = rows.pages?.[0]
            return (firstPage == null ? null : ({ data: firstPage } as T))
          },
          async all<T = Record<string, unknown>>() {
            return {
              results: (rows.pages ?? []).flatMap((entry) => (entry == null ? [] : [({ data: entry } as T)])),
            }
          },
          async run() {
            return {}
          },
        }

        return statement
      },
    },
    MEDIA_BUCKET: {
      async get() {
        return null
      },
      async put() {
        return null
      },
      async delete() {},
      async list() {
        return {
          objects: [],
          truncated: false,
        }
      },
    },
  }
}

describe('storage fallback content', () => {
  it('loadSite falls back to bundled content when Cloudflare env is unavailable', async () => {
    const site = await loadSite()

    expect(site.siteName).toBe('宇树科技 Unitree Robotics')
    expect(site.navigation).toHaveLength(5)
  })

  it('listPages falls back to bundled content when Cloudflare env is unavailable', async () => {
    const pages = await listPages()

    expect(pages.length).toBeGreaterThan(0)
    expect(pages.some((page) => page.id === 'home' && page.slug === '/')).toBe(true)
  })

  it('loadPage resolves a bundled page when Cloudflare env is unavailable', async () => {
    const page = await loadPage(undefined, 'home')

    expect(page.id).toBe('home')
    expect(page.slug).toBe('/')
  })

  it('loadSite falls back when D1 contains malformed JSON', async () => {
    const site = await loadSite(createEnvReturning({ site: '{invalid-json' }))

    expect(site.siteName).toBe('宇树科技 Unitree Robotics')
  })

  it('loadSite falls back when D1 contains legacy schema data', async () => {
    const legacySite = JSON.stringify({
      siteName: { zh: '公司名称', en: 'Company' },
      brand: {
        primary: '#8a4b2a',
        logoText: { zh: '公司名称', en: 'Company' },
      },
      contact: {},
      seo: {
        defaultTitle: { zh: '公司官网', en: 'Site' },
        defaultDescription: { zh: '默认描述', en: 'Default description' },
      },
      navigation: [
        {
          label: { zh: '首页', en: 'Home' },
          href: '/',
        },
      ],
    })

    const site = await loadSite(createEnvReturning({ site: legacySite }))

    expect(site.siteName).toBe('宇树科技 Unitree Robotics')
  })
})
