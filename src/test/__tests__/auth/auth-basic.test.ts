import { describe, it, expect } from 'vitest'
import { testUtils } from '@/test/test-utils'

describe('Auth Basic Tests', () => {
  it('should have mock auth context', () => {
    expect(testUtils.mockUser).toBeDefined()
    expect(testUtils.mockUser.email).toBe('test@vortexcore.app')
    expect(testUtils.mockUser.id).toBe('test-user-id')
  })

  it('should have mock supabase client', () => {
    expect(testUtils.mockSupabase).toBeDefined()
    expect(testUtils.mockSupabase.auth).toBeDefined()
    expect(testUtils.mockSupabase.from).toBeDefined()
  })

  it('should provide wait helper', async () => {
    const startTime = Date.now()
    await testUtils.waitFor(50)
    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThanOrEqual(45)
  })

  it('should provide matchMedia mock', () => {
    testUtils.mockMatchMedia(true)
    
    if (typeof window !== 'undefined') {
      expect(typeof window.matchMedia).toBe('function')
      
      const mediaQuery = window.matchMedia('(max-width: 768px)')
      expect(mediaQuery.matches).toBe(true)
    } else {
      // In node environment, just verify the function exists
      expect(testUtils.mockMatchMedia).toBeDefined()
    }
  })
})