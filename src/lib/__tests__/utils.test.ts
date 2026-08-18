import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, 'baz')).toBe('foo baz')
  })
})
