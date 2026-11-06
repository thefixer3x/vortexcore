import { describe, expect, it } from 'vitest';
import { memoryIdempotencyStore, runOnce } from '../src/index.js';

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

  it('requires a key', async () => {
    await expect(runOnce(memoryIdempotencyStore(), '', async () => 1)).rejects.toThrow();
  });
});
