import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testUtils } from '../../test/test-utils'

describe('useIsMobile', () => {
  beforeEach(() => {
    // Mock matchMedia for mobile detection
    testUtils.mockMatchMedia(true)

    // Mock window.innerWidth to be mobile size
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375, // Mobile width
      })
    }
  })

  it('detects mobile viewport', () => {
    const hook = renderHook(() => useIsMobile())
    expect(hook.result.current).toBe(true)
  })
})

describe('useIsMobile - extended coverage (Vitest + Testing Library)', () => {
  // Framework note: Using Vitest (describe/it/expect/vi) and @testing-library/react renderHook

  const setViewport = (width: number) => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
    }
  }

  const installMatchMedia = (initialMatches: boolean) => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = []
    const mql: MediaQueryList & {
      addEventListener: (type: 'change', listener: (e: MediaQueryListEvent) => void) => void
      removeEventListener: (type: 'change', listener: (e: MediaQueryListEvent) => void) => void
      dispatchEvent: (evt: Event) => boolean
      addListener: (listener: (e: MediaQueryListEvent) => void) => void
      removeListener: (listener: (e: MediaQueryListEvent) => void) => void
    } = {
      matches: initialMatches,
      media: '(max-width: 768px)',
      onchange: null,
      addEventListener: vi.fn((type: 'change', cb: (e: MediaQueryListEvent) => void) => {
        if (type === 'change') {
          listeners.push(cb)
        }
      }),
      removeEventListener: vi.fn((type: 'change', cb: (e: MediaQueryListEvent) => void) => {
        if (type === 'change') {
          const idx = listeners.indexOf(cb)
          if (idx >= 0) listeners.splice(idx, 1)
        }
      }),
      dispatchEvent: vi.fn((evt: Event) => true),
      // Legacy API fallbacks used by some hooks
      addListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => listeners.push(cb)),
      removeListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => {
        const idx = listeners.indexOf(cb)
        if (idx >= 0) listeners.splice(idx, 1)
      }),
    }

    const trigger = (matches: boolean) => {
      mql.matches = matches
      const evt = { matches } as MediaQueryListEvent
      listeners.forEach((cb) => cb(evt))
      if (typeof mql.onchange === 'function') {
        mql.onchange(evt)
      }
    }

    // Install global matchMedia mock
    // @ts-expect-error - define mock
    window.matchMedia = vi.fn().mockImplementation((query: string) => mql)

    return { mql, trigger, listeners }
  }

  beforeEach(() => {
    // default mobile setup for baseline
    testUtils.mockMatchMedia(true)
    setViewport(375)
    vi.restoreAllMocks()
  })

  it('returns false for desktop viewport (non-mobile)', () => {
    // Arrange
    testUtils.mockMatchMedia(false)
    setViewport(1280)

    // Act
    const { result } = renderHook(() => useIsMobile())

    // Assert
    expect(result.current).toBe(false)
  })

  it('updates from mobile -> desktop on window resize event', () => {
    testUtils.mockMatchMedia(true)
    setViewport(600)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    // Flip to desktop
    setViewport(1200)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(false)
  })

  it('updates from desktop -> mobile on window resize event', () => {
    testUtils.mockMatchMedia(false)
    setViewport(1200)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    setViewport(480)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  it('responds to matchMedia change events when supported', () => {
    // Install rich matchMedia mock with change listeners
    const { trigger, mql } = installMatchMedia(true)
    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    act(() => {
      trigger(false)
    })
    expect(result.current).toBe(false)

    act(() => {
      trigger(true)
    })
    expect(result.current).toBe(true)

    // Ensure listeners are cleaned on unmount
    const removeEventListenerSpy = vi.spyOn(mql, 'removeEventListener')
    unmount()
    // At least one cleanup call for 'change'
    expect(removeEventListenerSpy).toHaveBeenCalled()
  })

  it('falls back gracefully when window.matchMedia is undefined', () => {
    // @ts-expect-error force undefined
    delete (globalThis as unknown)['window']

    setViewport(1024)
    const desktop = renderHook(() => useIsMobile())
    expect(desktop.result.current).toBe(false)

    desktop.unmount()

    setViewport(500)
    const mobile = renderHook(() => useIsMobile())
    expect(mobile.result.current).toBe(true)
  })

  it('cleans up window resize listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useIsMobile())

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function), expect.anything())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function), expect.anything())
  })

  it('does not throw in SSR-like environment (no window)', async () => {
    // Temporarily remove global window and dynamically import hook to simulate SSR import/run
    const realWindow = globalThis.window
    // @ts-expect-error - simulate SSR
    delete (globalThis as unknown)['window']

    let ssrError: unknown = null
    try {
      const { useIsMobile: useIsMobileSSR } = await import('../use-mobile')
      // @ts-expect-error - restore a minimal window for renderHook
      globalThis['window'] = realWindow ?? { innerWidth: 1024 }
      const { result } = renderHook(() => useIsMobileSSR())
      expect(typeof result.current).toBe('boolean')
    } catch (e) {
      ssrError = e
    } finally {
      // @ts-expect-error - restore original window
      globalThis['window'] = realWindow
    }

    expect(ssrError).toBeNull()
  })

  it('uses legacy addListener/removeListener if addEventListener is unavailable', () => {
    // Provide only legacy API
    const listeners: Array<(e: MediaQueryListEvent) => void> = []
    const legacyMql = {
      matches: true,
      media: '(max-width: 768px)',
      addListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => listeners.push(cb)),
      removeListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => {
        const i = listeners.indexOf(cb)
        if (i >= 0) listeners.splice(i, 1)
      }),
    } as MediaQueryList
    // @ts-expect-error - mock
    window.matchMedia = vi.fn().mockReturnValue(legacyMql)

    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    // Flip via legacy callback
    act(() => {
      legacyMql.matches = false
      listeners.forEach((cb) => cb({ matches: false } as MediaQueryListEvent))
    })
    expect(result.current).toBe(false)

    unmount()
    expect(legacyMql.removeListener).toHaveBeenCalled()
  })
})