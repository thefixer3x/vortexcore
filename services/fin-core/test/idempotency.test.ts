import { describe, expect, it } from 'vitest';
import {
  IdempotencyReleaseError,
  memoryIdempotencyStore,
  runOnce,
  type IdempotencyStore,
} from '../src/index.js';

describe('runOnce', () => {
  it('runs a key once and reports duplicates', async () => {
    const store = memoryIdempotencyStore();
    let calls = 0;
    const handler = async () => ++calls;
    expect(await runOnce(store, 'evt_1', handler)).toEqual({ duplicate: false, result: 1 });
    expect(await runOnce(store, 'evt_1', handler)).toEqual({ duplicate: true });
    expect(calls).toBe(1);
  });

  it('releases the key when the handler fails, so a retry runs', async () => {
    const store = memoryIdempotencyStore();
    await expect(runOnce(store, 'evt_2', async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(await runOnce(store, 'evt_2', async () => 'ok')).toEqual({ duplicate: false, result: 'ok' });
  });

  it('keeps both errors when release fails too', async () => {
    const base = memoryIdempotencyStore();
    const store: IdempotencyStore = { ...base, release: async () => { throw new Error('release failed'); } };
    const handlerError = new Error('db down');
    const error = await runOnce(store, 'evt_3', async () => { throw handlerError; }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IdempotencyReleaseError);
    expect((error as IdempotencyReleaseError).handlerError).toBe(handlerError);
    expect(((error as IdempotencyReleaseError).releaseError as Error).message).toBe('release failed');
  });

  it('lets a later delivery reclaim an abandoned claim once its lease expires', async () => {
    let t = 0;
    const store = memoryIdempotencyStore({ leaseMs: 1000, now: () => t });
    // A delivery claims the key and dies before finishing.
    expect(await store.claim('evt_4')).toBe(true);
    t = 500;
    expect(await runOnce(store, 'evt_4', async () => 'early')).toEqual({ duplicate: true });
    t = 1500;
    expect(await runOnce(store, 'evt_4', async () => 'late')).toEqual({ duplicate: false, result: 'late' });
    t = 10_000;
    expect(await runOnce(store, 'evt_4', async () => 'again')).toEqual({ duplicate: true });
  });

  it('propagates a failure to mark the key done', async () => {
    const base = memoryIdempotencyStore();
    const store: IdempotencyStore = { ...base, complete: async () => { throw new Error('complete failed'); } };
    await expect(runOnce(store, 'evt_5', async () => 1)).rejects.toThrow('complete failed');
  });

  it('requires a key', async () => {
    await expect(runOnce(memoryIdempotencyStore(), '', async () => 1)).rejects.toThrow();
  });
});
