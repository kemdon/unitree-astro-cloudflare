const EXTERNAL_LINK_PATTERN = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:|\/\/|#)/

export function getLocalizedValue(value: string | undefined | null) {
  return value ?? ''
}

export function withLocaleParam(pathname: string) {
  return pathname
}

export function isExternalLink(pathname: string) {
  return EXTERNAL_LINK_PATTERN.test(pathname)
}
