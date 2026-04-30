# Database Schema Summary

**Auto-generated from:** `src/integrations/supabase/types.ts` (Database type)
**Pattern:** Supabase auto-generated types with Postgres schema

## Key Tables

### Financial Core

**`vortex_wallets`**
| Column | Type | Notes |
|--------|------|-------|
| id | string | Primary key |
| user_id | string | Owner |
| balance | number | Current balance |
| currency | string | ISO 4217 (USD, EUR, etc.) |
| is_locked | boolean | Prevents transactions |
| metadata | json | Extended data |
| created_at | string | |
| updated_at | string | |

**`vortex_transactions`**
| Column | Type | Notes |
|--------|------|-------|
| id | string | Primary key |
| user_id | string | Owner |
| wallet_id | string | FK to vortex_wallets |
| amount | number \| string | Normalize on read |
| type | string | deposit/withdrawal/transfer/payment |
| description | string | |
| metadata | json | counterparty, category, action |
| created_at | string | |

### Stripe Billing

**`stripe_customers`** — maps user to Stripe customer
| Column | Type |
|--------|------|
| user_id | string |
| customer_id | string (Stripe) |
| created_at | string |

**`stripe_subscriptions`** — raw Stripe subscription data
| Column | Type |
|--------|------|
| stripe_subscription_id | string (PK via onConflict) |
| customer_id | string (FK to stripe_customers) |
| status | string |
| price_id | string \| null |
| current_period_end | string |
| cancel_at | string \| null |
| updated_at | string |

**`user_tiers`** — computed tier for fast lookups
| Column | Type |
|--------|------|
| user_id | string (PK via onConflict) |
| tier_name | string (free/pro/enterprise) |
| max_queries_per_day | number |
| can_use_advanced_models | boolean |
| expires_at | string \| null |
| updated_at | string |

**Tier Resolution:**
```typescript
if (priceId === STRIPE_PRO_PRICE_ID) → "pro"
if (priceId === STRIPE_ENT_PRICE_ID) → "enterprise"
default → "free"

max_queries: enterprise=500, pro=100, free=10
```

### AI/Memory System

**`agent_banks_sessions`**
| Column | Type |
|--------|------|
| id | string |
| session_name | string |
| session_type | string \| null |
| status | string \| null |
| started_at | string \| null |
| completed_at | string \| null |
| last_activity | string \| null |
| memory_count | number \| null |
| description | string \| null |
| metadata | json |

**`agent_banks_memories`**
| Column | Type |
|--------|------|
| id | string |
| project_ref | string \| null |
| title | string |
| content | string |
| summary | string \| null |
| memory_type | string \| null |
| tags | json \| null |
| relevance_score | number \| null |
| access_count | number \| null |
| source_url | string \| null |
| status | string \| null |
| metadata | json \| null |
| created_at | string \| null |
| updated_at | string \| null |

### Other Notable Tables

**`beneficiaries`** — payment recipients
**`chat_conversations` / `chat_messages`** — AI chat history
**`feature_flags`** — feature toggle state
**`business_profiles`** — company info
**`card_authorizations`** — virtual card permissions

## Relationships

```
stripe_customers ←[customer_id]→ stripe_subscriptions
stripe_customers.user_id → user_tiers.user_id

agent_banks_sessions ←[id]→ agent_banks_memories.session_id
```

## Important Patterns

### Amount Normalization
`vortex_transactions.amount` can be `number | string`. Always normalize:
```typescript
const normalizeAmount = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};
```

### JSON Metadata
Transaction metadata stores: `{ description, category, counterparty, action }`
Use `(transaction.metadata ?? {}) as Record<string, unknown>` to access.