# @lanonasis/fin-core

Shared billing and money logic for LanOnasis apps (SubTrack Pro, VortexCore, …).

The package is pure TypeScript and has no runtime dependencies. It uses only language built-ins, so the same code runs in Node (Vercel functions), Deno (Supabase Edge Functions), React Native / Expo and Vite.

**What it holds:** the rules, configured per app.
**What it does not hold:** secrets, database clients, Stripe SDK calls, or prices. Each app keeps its own adapters.

| Module | What it does |
| --- | --- |
| `entitlements` | `createEntitlementResolver({ project, tiers, fallbackTier, catalog? })`: which tier a Stripe price, or a multi-item subscription, grants **in this app**. |
| `lookupKeys` | `lookupKey('subtrack', 'pro', 'monthly')` → `subtrack_pro_monthly`, and `parseLookupKey`. |
| `status` | `mapSubscriptionStatus`, `isEntitledStatus` (optional `past_due` grace period). |
| `currency` | `splitByPrimaryCurrency`, `totalsByCurrency`, `toMinorUnits` / `fromMinorUnits` (0-, 2- and 3-decimal currencies). Nothing is ever converted between currencies. |
| `idempotency` | `runOnce(store, eventId, handler)` with a pluggable, lease-based `IdempotencyStore`, so a webhook takes effect once even when the provider retries it, and an abandoned claim can be recovered. |

## The rules

1. **One Stripe account, separate entitlements.** A price grants a tier only in the app named in its `metadata.project`, or in the app whose catalog lists it. In every other app it grants the fallback tier.
2. **Tiers come from metadata or the catalog, never from names.** Price nicknames and product names are free text. Renaming a product must not change what a customer has paid for.
3. **Prices are found by lookup key** (`{project}_{tier}_{billing}`), never by hard-coded id.
4. **No mixed-currency totals.** Totals are reported per currency, or in the majority currency with the other currencies named.
5. **Webhooks are idempotent through a shared store.** On serverless platforms an in-memory `Set` doesn't survive between requests, so the store must be shared, for example a database table keyed on the event id. A delivery that arrives while another is still processing gets `in_progress`, never `duplicate`, so it can be retried.

## Usage

```ts
import { createEntitlementResolver, isEntitledStatus, runOnce } from '@lanonasis/fin-core';

export const entitlements = createEntitlementResolver({
  project: 'subtrack',
  tiers: ['free', 'pro', 'team'] as const,
  fallbackTier: 'free',
});

// In the Stripe webhook. A subscription can carry several items, from several
// apps on the same Stripe account: the first price that belongs to this app decides.
const tier = isEntitledStatus(subscription.status)
  ? entitlements.resolveTierFromPrices(subscription.items.data.map((item) => item.price))
  : 'free';
```

Deno (Supabase Edge Functions):

```ts
import { createEntitlementResolver } from 'npm:@lanonasis/fin-core@0.1';
```

### Running a webhook once

```ts
import { runOnce } from '@lanonasis/fin-core';

const outcome = await runOnce(store, event.id, () => applyEvent(event));
switch (outcome.status) {
  case 'processed':   return new Response('ok', { status: 200 });
  case 'duplicate':   return new Response('already processed', { status: 200 }); // stop retries
  case 'in_progress': return new Response('in progress', { status: 409 });       // ask Stripe to retry
}
// runOnce throws when the handler fails (the claim is released first), when the
// lease was lost (IdempotencyLeaseLostError) or when the store fails. Answer 500
// so Stripe retries.
```

### A shared idempotency store (Postgres / Supabase)

Each claim is a lease with an owner token, and moves from `processing` to `done`:

- If a function times out or crashes after claiming, the lease expires and a later retry claims the event again with a new token.
- `complete` and `release` only act for the token that owns the claim, so a handler whose lease expired can't finish or drop a newer delivery's claim.
- Keep the lease longer than the platform's function timeout. Make handler side effects safe to repeat (upserts keyed on the event, not increments): a handler that is still running after its lease expires can't be stopped.

```sql
create table if not exists public.processed_webhook_events (
  id text primary key,
  status text not null default 'processing' check (status in ('processing', 'done')),
  claim_token uuid not null,
  claimed_at timestamptz not null default now()
);
alter table public.processed_webhook_events enable row level security; -- service role only

-- Atomic claim: insert, or take over a processing claim whose lease has expired.
-- Returns ('claimed', token), ('done', null) or ('busy', null).
create or replace function public.claim_webhook_event(p_id text, p_lease_seconds int default 300)
returns table (status text, token uuid)
language plpgsql
security invoker
as $$
declare
  v_token uuid := gen_random_uuid();
  v_status text;
begin
  insert into public.processed_webhook_events as e (id, claim_token) values (p_id, v_token)
  on conflict (id) do update
    set claim_token = v_token, claimed_at = now()
    where e.status = 'processing'
      and e.claimed_at < now() - make_interval(secs => p_lease_seconds);
  if found then
    return query select 'claimed'::text, v_token;
    return;
  end if;
  select e.status into v_status from public.processed_webhook_events e where e.id = p_id;
  return query select (case when v_status = 'done' then 'done' else 'busy' end)::text, null::uuid;
end;
$$;
revoke execute on function public.claim_webhook_event(text, int) from public, anon, authenticated;
```

```ts
import type { IdempotencyStore } from '@lanonasis/fin-core';

const TABLE = 'processed_webhook_events';

export const dbStore = (admin: SupabaseClient): IdempotencyStore => ({
  async claim(id) {
    const { data, error } = await admin.rpc('claim_webhook_event', { p_id: id }).single();
    if (error) throw error;
    const row = data as { status: 'claimed' | 'done' | 'busy'; token: string | null };
    return row.status === 'claimed' && row.token
      ? { status: 'claimed', token: row.token }
      : { status: row.status === 'done' ? 'done' : 'busy' };
  },
  async complete(id, token) {
    // Only the current owner can finish the claim.
    const { data, error } = await admin
      .from(TABLE)
      .update({ status: 'done' })
      .eq('id', id)
      .eq('claim_token', token)
      .eq('status', 'processing')
      .select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
  async release(id, token) {
    // A stale token deletes nothing. A store error is surfaced by runOnce as
    // IdempotencyReleaseError; the lease expiry then lets a retry claim the event.
    const { error } = await admin
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('claim_token', token)
      .eq('status', 'processing');
    if (error) throw error;
  },
});
```

`memoryIdempotencyStore()` is for tests and single-process dev servers only. It keeps every key it has seen until the store is discarded, so its memory grows with the number of distinct keys.

## Development

```bash
cd services/fin-core
npm ci
npm run typecheck && npm test && npm run build
```

## Where it lives

The package lives in the VortexCore repo at `services/fin-core`, but it isn't part of the VortexCore app build. It has its own `package.json`, lockfile, tests and CI workflow (`.github/workflows/fin-core.yml`). SubTrack Pro installs the published npm package; it never copies files from this folder.

## Releasing

1. Bump `version` in `services/fin-core/package.json` and merge the change.
2. Push a tag `fin-core-vX.Y.Z` that matches the new version.
3. The `fin-core` workflow publishes the package to npm only when the tag points to a commit on `main`. It needs the `NPM_TOKEN` repository secret.

Breaking changes (a changed rule or a renamed export) need a new major version. Apps pin a minor range such as `~0.1`, so a release never changes behavior until the app chooses to upgrade.

## License

MIT
