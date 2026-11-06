import { describe, expect, it } from 'vitest';
import {
  IdempotencyLeaseLostError,
  IdempotencyReleaseError,
  memoryIdempotencyStore,
  runOnce,
  type IdempotencyStore,
} from '../src/index.js';

describe('runOnce', () => {
  it('runs a key once and reports later deliveries as duplicates', async () => {
    const store = memoryIdempotencyStore();
    let calls = 0;
    const handler = async () => ++calls;
    expect(await runOnce(store, 'evt_1', handler)).toEqual({ status: 'processed', result: 1 });
    expect(await runOnce(store, 'evt_1', handler)).toEqual({ status: 'duplicate' });
    expect(calls).toBe(1);
  });

  it('releases the key when the handler fails, so a retry runs', async () => {
    const store = memoryIdempotencyStore();
    await expect(runOnce(store, 'evt_2', async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(await runOnce(store, 'evt_2', async () => 'ok')).toEqual({ status: 'processed', result: 'ok' });
  });

  it('reports in_progress, not duplicate, while another delivery holds the lease', async () => {
    const t = 0;
    const store = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    let finish!: () => void;
    const first = runOnce(store, 'evt_3', () => new Promise<string>((r) => { finish = () => r('first'); }));
    await Promise.resolve();
    expect(await runOnce(store, 'evt_3', async () => 'second')).toEqual({ status: 'in_progress' });
    finish();
    expect(await first).toEqual({ status: 'processed', result: 'first' });
    expect(await runOnce(store, 'evt_3', async () => 'third')).toEqual({ status: 'duplicate' });
  });

  it('keeps both errors when release fails, and a retry before lease expiry is in_progress, not duplicate', async () => {
    let t = 0;
    const base = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    const store: IdempotencyStore = { ...base, release: async () => { throw new Error('release failed'); } };
    const handlerError = new Error('db down');
    const error = await runOnce(store, 'evt_4', async () => { throw handlerError; }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IdempotencyReleaseError);
    expect((error as IdempotencyReleaseError).handlerError).toBe(handlerError);
    expect(((error as IdempotencyReleaseError).releaseError as Error).message).toBe('release failed');

    t = 500; // retry before the lease expires: must stay retryable
    expect(await runOnce(base, 'evt_4', async () => 'early')).toEqual({ status: 'in_progress' });
    t = 1500; // after expiry the retry runs the handler
    expect(await runOnce(base, 'evt_4', async () => 'late')).toEqual({ status: 'processed', result: 'late' });
  });

  it('lets a later delivery reclaim an abandoned claim once its lease expires', async () => {
    let t = 0;
    const store = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    expect((await store.claim('evt_5')).status).toBe('claimed'); // delivery dies here
    t = 1500;
    expect(await runOnce(store, 'evt_5', async () => 'late')).toEqual({ status: 'processed', result: 'late' });
  });

  it('a stale handler can neither complete nor release a newer claim', async () => {
    let t = 0;
    const store = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    const a = await store.claim('evt_6');
    t = 1500;
    const b = await store.claim('evt_6');
    if (a.status !== 'claimed' || b.status !== 'claimed') throw new Error('expected two claims');
    expect(a.token).not.toBe(b.token);

    await store.release('evt_6', a.token); // stale release is a no-op
    expect((await store.claim('evt_6')).status).toBe('busy');
    expect(await store.complete('evt_6', a.token)).toBe(false); // stale complete is refused
    expect(await store.complete('evt_6', b.token)).toBe(true);
    expect((await store.claim('evt_6')).status).toBe('done');
  });

  it('throws IdempotencyLeaseLostError when the lease was taken over before the handler finished', async () => {
    let t = 0;
    const store = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    const run = runOnce(store, 'evt_7', async () => {
      t = 1500;
      await store.claim('evt_7'); // another delivery takes over the expired lease
      return 'slow';
    });
    await expect(run).rejects.toBeInstanceOf(IdempotencyLeaseLostError);
  });

  it('propagates a store failure while marking the key done', async () => {
    const base = memoryIdempotencyStore();
    const store: IdempotencyStore = { ...base, complete: async () => { throw new Error('complete failed'); } };
    await expect(runOnce(store, 'evt_8', async () => 1)).rejects.toThrow('complete failed');
  });

  it('requires a key', async () => {
    await expect(runOnce(memoryIdempotencyStore(), '', async () => 1)).rejects.toThrow();
  });
});
