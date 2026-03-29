import { describe, expect, it } from 'vitest'
import { comparePagesForDisplay } from '../src/lib/page-order'
import type { PageData } from '../src/lib/schema'

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

describe('page order', () => {
  it('sorts template pages in the expected display order', () => {
    const pages = [
      createPage('contact', '/contact'),
      createPage('product-detail', '/products/product-detail'),
      createPage('home', '/'),
      createPage('about', '/about'),
      createPage('products', '/products'),
    ]

    const sorted = [...pages].sort(comparePagesForDisplay)

    expect(sorted.map((page) => page.id)).toEqual(['home', 'products', 'about', 'contact', 'product-detail'])
  })

  it('places unknown pages after template pages', () => {
    const pages = [
      createPage('custom-b', '/custom-b'),
      createPage('about', '/about'),
      createPage('custom-a', '/custom-a'),
    ]

    const sorted = [...pages].sort(comparePagesForDisplay)

    expect(sorted.map((page) => page.id)).toEqual(['about', 'custom-a', 'custom-b'])
  })
})
