import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageData, SiteConfig } from '../src/lib/schema'

vi.mock('@/lib/storage', () => ({
  loadSite: vi.fn(),
  listPages: vi.fn(),
  saveSite: vi.fn(),
}))

import { PUT } from '../src/pages/api/site'
import { listPages, saveSite } from '@/lib/storage'

function createPage(id: string, slug: string): PageData {
  return {
    id,
    pageType:
      id === 'products' ? 'product-list' : id === 'product-detail' || slug.startsWith('/products/') ? 'product-detail' : 'standard',
    slug,
    title: id,
    seo: {
      title: id,
      description: slug,
    },
    blocks: [],
  }
}

function createSite(): SiteConfig {
  return {
    siteName: '公司名称',
    brand: {
      primary: '#8a4b2a',
      logoText: '公司名称',
    },
    contact: {},
    seo: {
      defaultTitle: '公司官网',
      defaultDescription: '默认描述',
    },
    navigation: [
      {
        label: '首页',
        href: '/',
      },
    ],
  }
}

describe('site api contract validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(saveSite).mockImplementation(async (_env, value) => value as SiteConfig)
  })

  it('PUT /api/site returns 409 when an internal navigation link points to a missing page', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/')])
    const site = createSite()
    site.navigation.push({
      label: '案例',
      href: '/cases',
    })

    const response = await PUT({
      request: new Request('http://localhost/api/site', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(site),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Navigation link "/cases" does not match any page slug',
    })
    expect(saveSite).not.toHaveBeenCalled()
  })

  it('PUT /api/site allows valid internal links and external links', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])
    const site = createSite()
    site.navigation = [
      ...site.navigation,
      {
        label: '关于我们',
        href: '/about',
      },
      {
        label: '外部链接',
        href: 'https://example.com',
      },
    ]

    const response = await PUT({
      request: new Request('http://localhost/api/site', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(site),
      }),
    } as any)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: site,
    })
    expect(saveSite).toHaveBeenCalledTimes(1)
  })
})
