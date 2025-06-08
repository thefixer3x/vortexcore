import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'
import { vi } from 'vitest'

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('detects mobile viewport', () => {
    const hook = renderHook(() => useIsMobile())
    expect(hook.result.current).toBe(true)
  })
})
