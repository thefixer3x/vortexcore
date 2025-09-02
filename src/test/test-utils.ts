import { vi } from 'vitest'

// Export common test functions
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
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithPassword: vi.fn(),
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
  },

  // Mock matchMedia
  mockMatchMedia: (matches: boolean = false) => {
    // This will be called after jsdom is initialized
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  }
}

// Mock functions that might not be available in all vitest versions
export const mockModule = (modulePath: string, mockImplementation: any) => {
  // For now, we'll use a simple approach without vi.mock
  // This can be enhanced later when we figure out the mocking strategy
  return mockImplementation
}

// Export the test wrapper
export { TestWrapper } from './test-wrapper'