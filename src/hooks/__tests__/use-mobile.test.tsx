import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testUtils } from '../../test/test-utils'

describe('useIsMobile', () => {
  beforeEach(() => {
    // Mock matchMedia for mobile detection
    testUtils.mockMatchMedia(true)
  })

  it('detects mobile viewport', () => {
    const hook = renderHook(() => useIsMobile())
    expect(hook.result.current).toBe(true)
  })
})
