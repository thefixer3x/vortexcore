import React from 'react'
import { vi } from 'vitest'

// Mock auth context values
export const mockAuthContext = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  identifyUser: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}

// Mock AuthContext Provider
export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  )
}

// Reset all mocks
export const resetAuthMocks = () => {
  Object.values(mockAuthContext).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear?.()
    }
  })
}