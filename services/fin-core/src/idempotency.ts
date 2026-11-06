/**
 * Webhook idempotency. Stripe retries deliveries, so each event must take
 * effect once. An in-memory Set does not do this on serverless platforms,
 * where every request may land on a fresh instance: the store has to be
 * shared, e.g. a database table with a primary key on the event id.
 */

export interface IdempotencyStore {
  /**
   * Atomically record `key`. Resolve true if this call recorded it, false if
   * it was already there. Must not throw for a duplicate.
   */
  claim(key: string): Promise<boolean>;
  /** Forget `key`, so a delivery whose handler failed can be retried. */
  release(key: string): Promise<void>;
}

export type IdempotentResult<R> = { duplicate: true } | { duplicate: false; result: R };

/**
 * Run `handler` once per `key`. If the handler throws, the key is released and
 * the error rethrown, so the provider's retry gets another attempt.
 */
export async function runOnce<R>(
  store: IdempotencyStore,
  key: string,
  handler: () => Promise<R>,
): Promise<IdempotentResult<R>> {
  if (!key) throw new Error('fin-core: idempotency key is required');
  if (!(await store.claim(key))) return { duplicate: true };
  try {
    return { duplicate: false, result: await handler() };
  } catch (error) {
    await store.release(key);
    throw error;
  }
}

/** Store for tests and single-process dev servers only. */
export function memoryIdempotencyStore(): IdempotencyStore {
  const seen = new Set<string>();
  return {
    async claim(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
    async release(key) {
      seen.delete(key);
    },
  };
}
