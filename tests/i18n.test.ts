import { describe, expect, it } from 'vitest'
import { withLocaleParam } from '../src/lib/i18n'

describe('withLocaleParam', () => {
  it('preserves internal paths', () => {
    expect(withLocaleParam('/about')).toBe('/about')
    expect(withLocaleParam('/about?tab=team')).toBe('/about?tab=team')
  })

  it('preserves external links', () => {
    expect(withLocaleParam('https://example.com/about')).toBe('https://example.com/about')
    expect(withLocaleParam('mailto:hello@example.com')).toBe('mailto:hello@example.com')
    expect(withLocaleParam('#section')).toBe('#section')
  })
})
