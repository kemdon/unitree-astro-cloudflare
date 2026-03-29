import type { PageData } from './schema'
import { CORE_TEMPLATE_PAGE_IDS } from './template-contract'

export const PAGE_DISPLAY_ORDER = [...CORE_TEMPLATE_PAGE_IDS] as const

function getRank(id: string) {
  const index = PAGE_DISPLAY_ORDER.indexOf(id as (typeof PAGE_DISPLAY_ORDER)[number])
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export function comparePagesForDisplay(a: PageData, b: PageData) {
  const rankDiff = getRank(a.id) - getRank(b.id)
  if (rankDiff !== 0) {
    return rankDiff
  }

  const slugDiff = a.slug.localeCompare(b.slug)
  if (slugDiff !== 0) {
    return slugDiff
  }

  return a.id.localeCompare(b.id)
}
