import { describe, it, expect } from 'vitest'
import {
  fromMinorUnits,
  parseTopupRequest,
  paymentIntentMatches,
  toMinorUnits,
  TOPUP_LIMITS,
} from '../../../../supabase/functions/_shared/wallet-topup'

const KEY = 'topup-0123456789abcdef'

describe('wallet top-up amounts', () => {
  it('converts major to minor units without float drift', () => {
    expect(toMinorUnits(25.5, 'USD')).toBe(2550)
    expect(toMinorUnits(0.1 + 0.2, 'USD')).toBe(30)
    expect(toMinorUnits(1500, 'NGN')).toBe(150000)
    expect(toMinorUnits(500, 'JPY')).toBe(500)
  })

  it('rejects sub-minor-unit amounts', () => {
    expect(toMinorUnits(1.005, 'USD')).toBeNull()
    expect(toMinorUnits(Number.NaN, 'USD')).toBeNull()
  })

  it('formats minor units as an exact decimal string for the ledger', () => {
    expect(fromMinorUnits(2550, 'USD')).toBe('25.50')
    expect(fromMinorUnits(5, 'USD')).toBe('0.05')
    expect(fromMinorUnits(150000, 'NGN')).toBe('1500.00')
    expect(fromMinorUnits(500, 'JPY')).toBe('500')
    expect(() => fromMinorUnits(1.5, 'USD')).toThrow()
  })
})

describe('parseTopupRequest', () => {
  const good = { amount: 25.5, currency: 'usd', payment_method_id: 'pm_123', idempotency_key: KEY }

  it('accepts a valid request and normalises the currency', () => {
    expect(parseTopupRequest(good)).toEqual({
      ok: true,
      value: { amountMinor: 2550, currency: 'USD', paymentMethodId: 'pm_123', idempotencyKey: KEY },
    })
  })

  it.each([
    ['missing body', null],
    ['unsupported currency', { ...good, currency: 'BTC' }],
    ['zero amount', { ...good, amount: 0 }],
    ['string amount', { ...good, amount: '25' }],
    ['below the minimum', { ...good, amount: 0.5 }],
    ['above the cap', { ...good, amount: TOPUP_LIMITS.USD.max + 1 }],
    ['sub-cent amount', { ...good, amount: 10.005 }],
    ['not a payment method id', { ...good, payment_method_id: '4242424242424242' }],
    ['missing idempotency key', { ...good, idempotency_key: undefined }],
    ['short idempotency key', { ...good, idempotency_key: 'abc' }],
  ])('rejects %s', (_label, body) => {
    expect(parseTopupRequest(body).ok).toBe(false)
  })

  it('applies per-currency limits', () => {
    expect(parseTopupRequest({ ...good, currency: 'NGN', amount: 500 }).ok).toBe(false)
    expect(parseTopupRequest({ ...good, currency: 'NGN', amount: 5000 }).ok).toBe(true)
  })
})

describe('paymentIntentMatches', () => {
  const expected = { amountMinor: 2550, currency: 'USD', customerId: 'cus_1', userId: 'u1' }
  const pi = {
    status: 'succeeded',
    amount_received: 2550,
    currency: 'usd',
    customer: 'cus_1',
    metadata: { user_id: 'u1', purpose: 'wallet_topup' },
  }

  it('accepts the PaymentIntent we created', () => {
    expect(paymentIntentMatches(pi, expected)).toBe(true)
    expect(paymentIntentMatches({ ...pi, customer: { id: 'cus_1' } }, expected)).toBe(true)
  })

  it.each([
    ['not succeeded', { status: 'requires_action' }],
    ['different amount', { amount_received: 2549 }],
    ['different currency', { currency: 'eur' }],
    ['other customer', { customer: 'cus_2' }],
    ['other user', { metadata: { user_id: 'u2', purpose: 'wallet_topup' } }],
    ['not a top-up', { metadata: { user_id: 'u1', purpose: 'subscription' } }],
  ])('rejects one that is %s', (_label, patch) => {
    expect(paymentIntentMatches({ ...pi, ...patch }, expected)).toBe(false)
  })
})
