import type { NavItem, PageData, PageType, SiteConfig } from './schema'

const EXTERNAL_LINK_PATTERN = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:|\/\/|#)/

type CoreTemplatePage = {
  id: string
  slug: string
  pageType: PageType
  navItem?: NavItem
}

export class TemplateContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateContractError'
  }
}

export const CORE_TEMPLATE_PAGES = [
  {
    id: 'home',
    slug: '/',
    pageType: 'standard',
    navItem: {
      label: '首页',
      href: '/',
    },
  },
  {
    id: 'products',
    slug: '/products',
    pageType: 'product-list',
    navItem: {
      label: '产品中心',
      href: '/products',
    },
  },
  {
    id: 'about',
    slug: '/about',
    pageType: 'standard',
    navItem: {
      label: '关于我们',
      href: '/about',
    },
  },
  {
    id: 'contact',
    slug: '/contact',
    pageType: 'standard',
    navItem: {
      label: '联系我们',
      href: '/contact',
    },
  },
  {
    id: 'product-detail',
    slug: '/go2',
    pageType: 'product-detail',
  },
] as const satisfies readonly CoreTemplatePage[]

export const PRODUCT_LIST_PAGE_ID = 'products'
export const PRODUCT_DETAIL_TEMPLATE_ID = 'product-detail'
export const PRODUCT_LIST_SLUG = '/products'
export const CORE_TEMPLATE_PAGE_IDS = CORE_TEMPLATE_PAGES.map((page) => page.id)
export const DEFAULT_TEMPLATE_NAVIGATION = CORE_TEMPLATE_PAGES.flatMap((page) =>
  'navItem' in page && page.navItem
    ? [
        {
          label: page.navItem.label,
          href: page.navItem.href,
        },
      ]
    : [],
)

const coreTemplatePageMap = new Map<string, CoreTemplatePage>(CORE_TEMPLATE_PAGES.map((page) => [page.id, page]))

function normalizeInternalPath(pathname: string) {
  const url = new URL(pathname, 'http://local.placeholder')
  return url.pathname.replace(/\/+$/, '') || '/'
}

export function restoreDefaultNavigation() {
  return DEFAULT_TEMPLATE_NAVIGATION.map((item) => ({
    label: item.label,
    href: item.href,
  }))
}

export function isCoreTemplatePageId(id: string) {
  return coreTemplatePageMap.has(id)
}

export function isCoreTemplatePage(page: PageData | null | undefined) {
  return Boolean(page && isCoreTemplatePageId(page.id))
}

export function assertTemplatePageContract(page: PageData) {
  const template = coreTemplatePageMap.get(page.id)
  if (!template) {
    return
  }

  if (page.slug !== template.slug) {
    throw new TemplateContractError(`Template page "${page.id}" must keep slug "${template.slug}"`)
  }

  if (page.pageType !== template.pageType) {
    throw new TemplateContractError(`Template page "${page.id}" must keep pageType "${template.pageType}"`)
  }
}

export function assertTemplatePageCanDelete(pageId: string) {
  if (isCoreTemplatePageId(pageId)) {
    throw new TemplateContractError(`Template page "${pageId}" cannot be deleted`)
  }
}

export function isInternalNavigationHref(href: string) {
  return !EXTERNAL_LINK_PATTERN.test(href)
}

export function assertSiteNavigationContract(site: SiteConfig, pages: PageData[]) {
  const knownSlugs = new Set(pages.map((page) => normalizeInternalPath(page.slug)))

  for (const item of site.navigation) {
    if (!item.href.trim()) {
      throw new TemplateContractError('Navigation link cannot be empty')
    }

    if (!isInternalNavigationHref(item.href)) {
      continue
    }

    const normalizedPath = normalizeInternalPath(item.href)
    if (!knownSlugs.has(normalizedPath)) {
      throw new TemplateContractError(`Navigation link "${item.href}" does not match any page slug`)
    }
  }
}
