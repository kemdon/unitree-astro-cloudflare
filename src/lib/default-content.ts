import { comparePagesForDisplay } from './page-order'
import { assertUniquePageCollection } from './page-rules'
import { PageSchema, SiteSchema, type PageData, type SiteConfig } from './schema'

import siteContent from '../../content/site.json'
import aboutPage from '../../content/pages/about.json'
import contactPage from '../../content/pages/contact.json'
import homePage from '../../content/pages/home.json'
import productDetailPage from '../../content/pages/product-detail.json'
import productsPage from '../../content/pages/products.json'
import b2Page from '../../content/pages/b2.json'
import b2wPage from '../../content/pages/b2-w.json'
import g1Page from '../../content/pages/g1.json'
import h1Page from '../../content/pages/h1.json'
import r1Page from '../../content/pages/r1.json'

const defaultPagesInput = [aboutPage, contactPage, homePage, productDetailPage, productsPage, b2Page, b2wPage, g1Page, h1Page, r1Page]

export function getDefaultSiteContent(): SiteConfig {
  return SiteSchema.parse(siteContent)
}

export function getDefaultPagesContent(): PageData[] {
  const pages = defaultPagesInput.map((entry) => PageSchema.parse(entry))
  assertUniquePageCollection(pages)
  return [...pages].sort(comparePagesForDisplay)
}

export function getDefaultPageById(id: string) {
  return getDefaultPagesContent().find((page) => page.id === id) ?? null
}
