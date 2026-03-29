import { describe, expect, it } from 'vitest'
import { createProductPageDraft, isProductDetailSource, listPublishedProductPages } from '../src/lib/page-templates'
import type { PageData } from '../src/lib/schema'

function createPage(id: string, slug: string, pageType: PageData['pageType'] = 'standard'): PageData {
  return {
    id,
    pageType,
    slug,
    title: id,
    seo: {
      title: id,
      description: slug,
    },
    blocks: [
      {
        type: 'hero',
        props: {
          title: '标题',
          description: '描述',
        },
      },
    ],
  }
}

describe('page templates', () => {
  it('recognizes product detail template pages as product detail sources', () => {
    expect(isProductDetailSource(createPage('product-detail', '/products/product-detail', 'product-detail'))).toBe(true)
    expect(isProductDetailSource(createPage('product-123', '/products/123', 'product-detail'))).toBe(true)
    expect(isProductDetailSource(createPage('products', '/products', 'product-list'))).toBe(false)
    expect(isProductDetailSource(createPage('about', '/about'))).toBe(false)
  })

  it('creates a unique product page draft from a detail template', () => {
    const source = createPage('product-detail', '/products/product-detail', 'product-detail')
    const pages = [source, createPage('product-1000', '/products/product-1000', 'product-detail')]

    const draft = createProductPageDraft(source, pages, 1000)

    expect(draft.id).toBe('product-1001')
    expect(draft.pageType).toBe('product-detail')
    expect(draft.slug).toBe('/products/product-1001')
    expect(draft.title).toBe('产品名称')
    expect(draft.blocks).toEqual(source.blocks)
    expect(draft).not.toBe(source)
  })

  it('lists only real product detail pages and excludes the template source page', () => {
    const pages = [
      createPage('product-detail', '/products/product-detail', 'product-detail'),
      createPage('product-1000', '/products/product-1000', 'product-detail'),
      createPage('about', '/about'),
    ]

    expect(listPublishedProductPages(pages).map((page) => page.id)).toEqual(['product-1000'])
  })
})
