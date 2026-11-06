/**
 * Webhook idempotency. Stripe retries deliveries, so each event must take
 * effect once. An in-memory Set does not do this on serverless platforms,
 * where every request may land on a fresh instance: the store has to be
 * shared, e.g. a database table keyed on the event id.
 *
 * A key moves through: (absent) → processing → done.
 * - A processing claim is a lease with an owner token. If the process dies
 *   before finishing (timeout, crash), the lease expires and a later delivery
 *   may claim the key again, with a new token.
 * - `complete` and `release` only act for the current token, so a handler
 *   whose lease expired can never finish or drop a newer delivery's claim.
 * - A delivery that finds the key still processing gets `in_progress`, not
 *   `duplicate`: the caller should answer with a retryable status (e.g. 409 or
 *   503) so the provider retries instead of treating the event as handled.
 *
 * What this cannot do is stop a handler that is still running after its lease
 * expired. Keep the lease longer than the platform's function timeout, and
 * make side effects safe to repeat (upserts keyed on the event, not increments).
 */

export type ClaimResult =
  | { status: 'claimed'; token: string }
  | { status: 'done' }
  | { status: 'busy' };

export interface IdempotencyStore {
  /**
   * Atomically claim `key`. `claimed` (with a fresh owner token) when the key
   * was absent or its processing lease had expired; `done` when it finished
   * earlier; `busy` while another delivery holds an unexpired lease.
   * Must not throw for a duplicate.
   */
  claim(key: string): Promise<ClaimResult>;
  /**
   * Mark `key` done, only if `token` still owns its processing claim.
   * Resolve false when it does not (the lease expired and was taken over).
   * Throw only if the store itself failed.
   */
  complete(key: string, token: string): Promise<boolean>;
  /**
   * Drop the processing claim on `key`, only if `token` still owns it, so a
   * retry can run. A no-op for a stale token. Throw only if the store failed.
   */
  release(key: string, token: string): Promise<void>;
}

export type IdempotentResult<R> =
  | { status: 'processed'; result: R }
  /** Finished by an earlier delivery: acknowledge it. */
  | { status: 'duplicate' }
  /** Another delivery is processing it right now: answer with a retryable status. */
  | { status: 'in_progress' };

/** The handler failed and the claim could not be released either. Both causes are kept. */
export class IdempotencyReleaseError extends Error {
  readonly handlerError: unknown;
  readonly releaseError: unknown;
  constructor(key: string, handlerError: unknown, releaseError: unknown) {
    super(
      `fin-core: handler for "${key}" failed and its claim could not be released; ` +
        'a retry can claim it once the lease expires',
    );
    this.name = 'IdempotencyReleaseError';
    this.handlerError = handlerError;
    this.releaseError = releaseError;
  }
}

/**
 * The handler finished, but its lease had expired and another delivery took
 * the claim over, so this run could not mark the key done. The other run
 * decides the outcome; the caller should answer with a retryable status.
 */
export class IdempotencyLeaseLostError extends Error {
  constructor(key: string) {
    super(`fin-core: lease on "${key}" expired before the handler finished; another delivery owns it now`);
    this.name = 'IdempotencyLeaseLostError';
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
  const claim = await store.claim(key);
  if (claim.status === 'done') return { status: 'duplicate' };
  if (claim.status === 'busy') return { status: 'in_progress' };

  let result: R;
  try {
    result = await handler();
  } catch (handlerError) {
    try {
      await store.release(key, claim.token);
    } catch (releaseError) {
      throw new IdempotencyReleaseError(key, handlerError, releaseError);
    }
    throw handlerError;
  }

  if (!(await store.complete(key, claim.token))) throw new IdempotencyLeaseLostError(key);
  return { status: 'processed', result };
}

let tokenCounter = 0;
/** A unique claim token. Uses crypto.randomUUID where the runtime has it. */
export function newClaimToken(): string {
  const webCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID();
  tokenCounter += 1;
  return `${Date.now().toString(36)}-${tokenCounter.toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Store for tests and single-process dev servers only. It keeps every key it
 * has seen until the store is discarded, so memory grows with distinct keys.
 * `leaseMs` is how long a processing claim blocks other deliveries (default 5 minutes).
 */
export function memoryIdempotencyStore(
  options: { leaseMs?: number; now?: () => number } = {},
): IdempotencyStore {
  const leaseMs = options.leaseMs ?? 5 * 60_000;
  const now = options.now ?? Date.now;
  const entries = new Map<string, { done: boolean; claimedAt: number; token: string }>();
  return {
    async claim(key) {
      const entry = entries.get(key);
      if (entry?.done) return { status: 'done' };
      if (entry && now() - entry.claimedAt < leaseMs) return { status: 'busy' };
      const token = newClaimToken();
      entries.set(key, { done: false, claimedAt: now(), token });
      return { status: 'claimed', token };
    },
    async complete(key, token) {
      const entry = entries.get(key);
      if (!entry || entry.done || entry.token !== token) return false;
      entry.done = true;
      return true;
    },
    async release(key, token) {
      const entry = entries.get(key);
      if (entry && !entry.done && entry.token === token) entries.delete(key);
    },
  };
}
