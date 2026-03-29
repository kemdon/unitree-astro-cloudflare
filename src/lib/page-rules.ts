import type { PageData } from './schema'

export class PageConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PageConflictError'
  }
}

export function assertUniquePageCollection(pages: PageData[]) {
  const idSet = new Set<string>()
  const slugSet = new Set<string>()

  for (const page of pages) {
    if (idSet.has(page.id)) {
      throw new PageConflictError(`Duplicate page id "${page.id}" found in content pages`)
    }

    if (slugSet.has(page.slug)) {
      throw new PageConflictError(`Duplicate page slug "${page.slug}" found in content pages`)
    }

    idSet.add(page.id)
    slugSet.add(page.slug)
  }
}

export function assertPageCanCreate(pages: PageData[], candidate: PageData) {
  if (pages.some((page) => page.id === candidate.id)) {
    throw new PageConflictError(`Page id "${candidate.id}" already exists`)
  }

  if (pages.some((page) => page.slug === candidate.slug)) {
    throw new PageConflictError(`Page slug "${candidate.slug}" already exists`)
  }
}

export function assertPageCanUpdate(pages: PageData[], routeId: string, candidate: PageData) {
  if (candidate.id !== routeId) {
    throw new PageConflictError('Page id in payload must match route id')
  }

  if (pages.some((page) => page.slug === candidate.slug && page.id !== routeId)) {
    throw new PageConflictError(`Page slug "${candidate.slug}" already exists`)
  }
}
