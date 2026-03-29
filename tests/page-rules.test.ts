import { describe, expect, it } from 'vitest'
import {
  assertPageCanCreate,
  assertPageCanUpdate,
  assertUniquePageCollection,
  PageConflictError,
} from '../src/lib/page-rules'
import type { PageData } from '../src/lib/schema'

function createPage(id: string, slug: string): PageData {
  return {
    id,
    pageType: 'standard',
    slug,
    title: id,
    seo: {
      title: id,
      description: slug,
    },
    blocks: [],
  }
}

describe('page rules', () => {
  it('rejects duplicate ids in existing page collection', () => {
    expect(() => assertUniquePageCollection([createPage('home', '/'), createPage('home', '/about')])).toThrow(
      PageConflictError,
    )
  })

  it('rejects duplicate slugs in existing page collection', () => {
    expect(() =>
      assertUniquePageCollection([createPage('home', '/'), createPage('about', '/')]),
    ).toThrow(PageConflictError)
  })

  it('rejects creating a page with duplicate id or slug', () => {
    const pages = [createPage('home', '/'), createPage('about', '/about')]

    expect(() => assertPageCanCreate(pages, createPage('about', '/company'))).toThrow(PageConflictError)
    expect(() => assertPageCanCreate(pages, createPage('company', '/about'))).toThrow(PageConflictError)
  })

  it('rejects changing route id during update and rejects duplicate slug', () => {
    const pages = [createPage('home', '/'), createPage('about', '/about')]

    expect(() => assertPageCanUpdate(pages, 'about', createPage('company', '/company'))).toThrow(PageConflictError)
    expect(() => assertPageCanUpdate(pages, 'about', createPage('about', '/'))).toThrow(PageConflictError)
  })

  it('allows updating current page without changing to a conflicting slug', () => {
    const pages = [createPage('home', '/'), createPage('about', '/about')]

    expect(() => assertPageCanUpdate(pages, 'about', createPage('about', '/about-us'))).not.toThrow()
  })
})
