import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jest-dom is imported above and will automatically extend expect

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
if (typeof global !== 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })
}

// Mock fetch for API testing
if (typeof global !== 'undefined') {
  global.fetch = vi.fn()
}

// Mock scrollIntoView
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}

// Mock environment variables for testing
if (process.env.NODE_ENV === 'test') {
  process.env.VITE_SUPABASE_URL = 'https://test-supabase-url.supabase.co'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_fixture'
}

// Test timeout is configured in vitest.config.ts

// Setup global test utilities
beforeAll(() => {
  console.log('🧪 Test environment initialized')
})

afterAll(() => {
  console.log('🧪 Test environment cleaned up')
})

// Import test utilities from the dedicated file
export { testUtils } from './test-utils'