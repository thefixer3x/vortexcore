import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
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

// Mock matchMedia
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

// Mock fetch for API testing
global.fetch = vi.fn()

// Mock environment variables for testing
process.env.VITE_SUPABASE_URL = 'https://test-supabase-url.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// Increase timeout for async tests
vi.setConfig({ testTimeout: 10000 })

// Setup global test utilities
beforeAll(() => {
  console.log('🧪 Test environment initialized')
})

afterAll(() => {
  console.log('🧪 Test environment cleaned up')
})

// Export test utilities
export const testUtils = {
  // Mock user for testing
  mockUser: {
    id: 'test-user-id',
    email: 'test@vortexcore.app',
    user_metadata: {
      name: 'Test User'
    }
  },
  
  // Mock Supabase client
  mockSupabase: {
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
  
  // Helper to wait for async operations
  waitFor: async (ms: number = 100) => {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}