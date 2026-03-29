import { comparePagesForDisplay } from './page-order'
import { assertUniquePageCollection } from './page-rules'
import { PageSchema, SiteSchema, type PageData, type SiteConfig } from './schema'

import siteContent from '../../content/site.json'
const pageModules = import.meta.glob('../../content/pages/*.json', { eager: true })

function getDefaultPagesInput() {
  return Object.entries(pageModules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([, module]) => {
      const payload = module as { default?: unknown }
      return payload.default ?? payload
    })
}

export function getDefaultSiteContent(): SiteConfig {
  return SiteSchema.parse(siteContent)
}

export function getDefaultPagesContent(): PageData[] {
  const pages = getDefaultPagesInput().map((entry) => PageSchema.parse(entry))
  assertUniquePageCollection(pages)
  return [...pages].sort(comparePagesForDisplay)
}

export function getDefaultPageById(id: string) {
  return getDefaultPagesContent().find((page) => page.id === id) ?? null
}
