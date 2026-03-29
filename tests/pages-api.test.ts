import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageData } from '../src/lib/schema'

vi.mock('@/lib/storage', () => ({
  listPages: vi.fn(),
  savePage: vi.fn(),
  loadPage: vi.fn(),
  deletePage: vi.fn(),
}))

import { POST } from '../src/pages/api/pages'
import { DELETE, PUT } from '../src/pages/api/pages/[id]'
import { listPages, savePage } from '@/lib/storage'

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

describe('pages api conflict handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/pages returns 409 when page id already exists', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])

    const response = await POST({
      request: new Request('http://localhost/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPage('about', '/company')),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Page id "about" already exists',
    })
    expect(savePage).not.toHaveBeenCalled()
  })

  it('POST /api/pages returns 409 when page slug already exists', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])

    const response = await POST({
      request: new Request('http://localhost/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPage('company', '/about')),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Page slug "/about" already exists',
    })
    expect(savePage).not.toHaveBeenCalled()
  })

  it('PUT /api/pages/:id returns 409 when payload id does not match route id', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])

    const response = await PUT({
      params: { id: 'about' },
      request: new Request('http://localhost/api/pages/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPage('company', '/company')),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Page id in payload must match route id',
    })
    expect(savePage).not.toHaveBeenCalled()
  })

  it('PUT /api/pages/:id returns 409 when slug conflicts with another page', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])

    const response = await PUT({
      params: { id: 'about' },
      request: new Request('http://localhost/api/pages/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPage('about', '/')),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Page slug "/" already exists',
    })
    expect(savePage).not.toHaveBeenCalled()
  })

  it('PUT /api/pages/:id returns 409 when a template page changes its reserved slug', async () => {
    vi.mocked(listPages).mockResolvedValue([createPage('home', '/'), createPage('about', '/about')])

    const response = await PUT({
      params: { id: 'about' },
      request: new Request('http://localhost/api/pages/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPage('about', '/company')),
      }),
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Template page "about" must keep slug "/about"',
    })
    expect(savePage).not.toHaveBeenCalled()
  })

  it('DELETE /api/pages/:id returns 409 when deleting a core template page', async () => {
    const response = await DELETE({
      params: { id: 'home' },
    } as any)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Template page "home" cannot be deleted',
    })
  })
})
