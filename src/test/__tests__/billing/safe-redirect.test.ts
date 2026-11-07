import { describe, it, expect } from 'vitest'
import { safeRedirect } from '../../../lib/safeRedirect'

describe('safeRedirect', () => {
  it('keeps same-origin paths', () => {
    expect(safeRedirect('/settings?plan=pro')).toBe('/settings?plan=pro')
  })
  it('falls back for anything that could leave the site', () => {
    for (const bad of [null, undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'settings']) {
      expect(safeRedirect(bad)).toBe('/dashboard')
    }
  })
})
