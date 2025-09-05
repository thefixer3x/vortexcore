import { vi } from 'vitest'

// Mock LogRocket
export const mockLogRocket = {
  track: vi.fn(),
  identify: vi.fn(),
  captureException: vi.fn(),
}

// Mock toast hook
export const mockToast = {
  toast: vi.fn(),
}

// Mock location hook
export const mockLocation = {
  country: 'US',
  city: 'Test City',
}

export const resetExternalMocks = () => {
  mockLogRocket.track.mockClear?.()
  mockLogRocket.identify.mockClear?.()
  mockLogRocket.captureException.mockClear?.()
  mockToast.toast.mockClear?.()
}