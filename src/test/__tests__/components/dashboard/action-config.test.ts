import { describe, it, expect } from 'vitest'
import { DASHBOARD_ACTIONS, transactionDirection } from '../../../../components/dashboard/action-config'

// Mirrors the live vortex_transactions_type_check constraint.
const ALLOWED_TYPES = ['credit', 'debit', 'transfer', 'refund', 'fee', 'reversal']

describe('dashboard actions', () => {
  it('only write transaction types the database accepts', () => {
    for (const action of Object.values(DASHBOARD_ACTIONS)) {
      expect(ALLOWED_TYPES).toContain(action.transactionType)
    }
  })

  it('record a money request as incoming and spending as outgoing', () => {
    expect(DASHBOARD_ACTIONS.request.transactionType).toBe('credit')
    expect(DASHBOARD_ACTIONS.pay_bills.transactionType).toBe('debit')
    expect(DASHBOARD_ACTIONS.top_up.transactionType).toBe('debit')
  })
})

describe('transactionDirection', () => {
  it('treats credits, refunds and reversals as income', () => {
    for (const t of ['credit', 'refund', 'reversal', 'deposit']) {
      expect(transactionDirection(t)).toBe('income')
    }
  })
  it('treats debits and fees as expenses', () => {
    for (const t of ['debit', 'fee', 'payment', 'withdrawal', null, undefined]) {
      expect(transactionDirection(t)).toBe('expense')
    }
  })
  it('counts a transfer as income only for a money request', () => {
    expect(transactionDirection('transfer', 'request')).toBe('income')
    expect(transactionDirection('transfer', 'send')).toBe('expense')
  })
})
