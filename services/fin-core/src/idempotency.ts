/**
 * Webhook idempotency. Stripe retries deliveries, so each event must take
 * effect once. An in-memory Set does not do this on serverless platforms,
 * where every request may land on a fresh instance: the store has to be
 * shared, e.g. a database table keyed on the event id.
 *
 * A key moves through: (absent) → processing → done. A processing claim is a
 * lease: if the process dies before finishing (timeout, crash), the claim
 * expires and a later delivery may claim it again, instead of being reported
 * as a duplicate forever. Handlers should still be safe to re-run (upserts,
 * not increments), because a lease can expire while a slow handler is running.
 */

export interface IdempotencyStore {
  /**
   * Atomically claim `key` for processing. Resolve true if this call now holds
   * the claim: the key was absent, or its processing lease had expired.
   * Resolve false if the key is done, or held by an unexpired lease.
   * Must not throw for a duplicate.
   */
  claim(key: string): Promise<boolean>;
  /** Mark `key` done after its handler succeeded. Must throw if it could not. */
  complete(key: string): Promise<void>;
  /** Drop the claim on `key` so a retry can run it. Must throw if it could not. */
  release(key: string): Promise<void>;
}

export type IdempotentResult<R> = { duplicate: true } | { duplicate: false; result: R };

/** The handler failed and the claim could not be released either. Both causes are kept. */
export class IdempotencyReleaseError extends Error {
  readonly handlerError: unknown;
  readonly releaseError: unknown;
  constructor(key: string, handlerError: unknown, releaseError: unknown) {
    super(
      `fin-core: handler for "${key}" failed and its claim could not be released; ` +
        'it will be retried once the lease expires',
    );
    this.name = 'IdempotencyReleaseError';
    this.handlerError = handlerError;
    this.releaseError = releaseError;
  }
}

/**
 * Run `handler` once per `key`. On success the key is marked done. If the
 * handler throws, the claim is released and the handler's error rethrown, so
 * the provider's retry gets another attempt. If releasing also fails, an
 * IdempotencyReleaseError carries both errors; the lease expiry is the
 * recovery path.
 */
export async function runOnce<R>(
  store: IdempotencyStore,
  key: string,
  handler: () => Promise<R>,
): Promise<IdempotentResult<R>> {
  if (!key) throw new Error('fin-core: idempotency key is required');
  if (!(await store.claim(key))) return { duplicate: true };

  let result: R;
  try {
    result = await handler();
  } catch (handlerError) {
    try {
      await store.release(key);
    } catch (releaseError) {
      throw new IdempotencyReleaseError(key, handlerError, releaseError);
    }
    throw handlerError;
  }

  await store.complete(key);
  return { duplicate: false, result };
}

/**
 * Store for tests and single-process dev servers only.
 * `leaseMs` is how long a processing claim blocks other deliveries (default 5 minutes).
 */
export function memoryIdempotencyStore(
  options: { leaseMs?: number; now?: () => number } = {},
): IdempotencyStore {
  const leaseMs = options.leaseMs ?? 5 * 60_000;
  const now = options.now ?? Date.now;
  const entries = new Map<string, { done: boolean; claimedAt: number }>();
  return {
    async claim(key) {
      const entry = entries.get(key);
      if (entry && (entry.done || now() - entry.claimedAt < leaseMs)) return false;
      entries.set(key, { done: false, claimedAt: now() });
      return true;
    },
    async complete(key) {
      const entry = entries.get(key);
      if (!entry) throw new Error(`fin-core: cannot complete "${key}": no claim`);
      entry.done = true;
    },
    async release(key) {
      entries.delete(key);
    },
  };
}
