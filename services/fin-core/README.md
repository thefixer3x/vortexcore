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
5. **Webhooks are idempotent through a shared store.** On serverless platforms an in-memory `Set` doesn't survive between requests, so the store must be shared, for example a database table keyed on the event id.

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

### A shared idempotency store (Postgres / Supabase)

`runOnce` claims the event id, runs the handler, then marks the id done. A claim is a lease: if the function times out or crashes after claiming, the lease expires and Stripe's next retry can claim the event again. Without a lease, the event would be reported as a duplicate forever. Handlers should still be safe to run twice (use upserts, not increments), because a lease can expire while a slow handler is still running.

```sql
create table if not exists public.processed_webhook_events (
  id text primary key,
  status text not null default 'processing' check (status in ('processing', 'done')),
  claimed_at timestamptz not null default now()
);
alter table public.processed_webhook_events enable row level security; -- service role only

-- Atomic claim: insert, or take over a processing claim whose lease has expired.
create or replace function public.claim_webhook_event(p_id text, p_lease_seconds int default 300)
returns boolean
language sql
security invoker
as $$
  insert into public.processed_webhook_events as e (id) values (p_id)
  on conflict (id) do update
    set claimed_at = now()
    where e.status = 'processing'
      and e.claimed_at < now() - make_interval(secs => p_lease_seconds)
  returning true;
$$;
-- Returns true when this call holds the claim, null when the event is done
-- or another delivery holds an unexpired lease.
revoke execute on function public.claim_webhook_event(text, int) from public, anon, authenticated;
```

```ts
import type { IdempotencyStore } from '@lanonasis/fin-core';

export const dbStore = (admin: SupabaseClient): IdempotencyStore => ({
  async claim(id) {
    const { data, error } = await admin.rpc('claim_webhook_event', { p_id: id });
    if (error) throw error;
    return data === true;
  },
  async complete(id) {
    const { error } = await admin
      .from('processed_webhook_events')
      .update({ status: 'done' })
      .eq('id', id);
    if (error) throw error;
  },
  async release(id) {
    // An error here is surfaced by runOnce as IdempotencyReleaseError; the lease
    // expiry then lets a later retry claim the event.
    const { error } = await admin.from('processed_webhook_events').delete().eq('id', id);
    if (error) throw error;
  },
});
```

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
