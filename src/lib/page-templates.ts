import type { PageData } from './schema'
import { PRODUCT_DETAIL_TEMPLATE_ID, PRODUCT_LIST_SLUG } from './template-contract'

function clonePage(source: PageData): PageData {
  return JSON.parse(JSON.stringify(source)) as PageData
}

export function isProductDetailSource(page: PageData | null | undefined) {
  if (!page) {
    return false
  }

  return page.pageType === 'product-detail'
}

export function listPublishedProductPages(pages: PageData[]) {
  return pages.filter((page) => page.pageType === 'product-detail' && page.id !== PRODUCT_DETAIL_TEMPLATE_ID)
}

export function createProductPageDraft(source: PageData, pages: PageData[], seed = Date.now()) {
  let currentSeed = seed
  let nextId = `product-${currentSeed}`
  let nextSlug = `${PRODUCT_LIST_SLUG}/${nextId}`

  while (pages.some((page) => page.id === nextId || page.slug === nextSlug)) {
    currentSeed += 1
    nextId = `product-${currentSeed}`
    nextSlug = `${PRODUCT_LIST_SLUG}/${nextId}`
  }

  const draft = clonePage(source)
  draft.id = nextId
  draft.pageType = 'product-detail'
  draft.slug = nextSlug
  draft.title = '产品名称'
  draft.seo = {
    title: '产品名称',
    description: '用于填写单个产品或方案的概述、卖点和目标场景。',
  }

  return draft
}
