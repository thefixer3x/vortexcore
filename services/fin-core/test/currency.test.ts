import { describe, expect, it } from 'vitest';
import { fromMinorUnits, splitByPrimaryCurrency, toMinorUnits, totalsByCurrency } from '../src/index.js';

type Item = { id: string; currency?: string; minor: number };
const cur = (i: Item) => i.currency;

describe('minor units', () => {
  it('uses each currency\'s decimals', () => {
    expect(toMinorUnits(10, 'usd')).toBe(1000);
    expect(toMinorUnits(19.99, 'NGN')).toBe(1999);
    expect(toMinorUnits(500, 'JPY')).toBe(500);
    expect(toMinorUnits(1.234, 'KWD')).toBe(1234);
    expect(toMinorUnits(-0.005, 'USD')).toBe(-1);
    expect(fromMinorUnits(1050, 'USD')).toBe(10.5);
    expect(() => toMinorUnits(Number.NaN, 'USD')).toThrow();
    expect(() => fromMinorUnits(1.5, 'USD')).toThrow();
  });
});

describe('splitByPrimaryCurrency', () => {
  it('sums only the majority currency and names the rest', () => {
    const items: Item[] = [
      { id: 'a', currency: 'usd', minor: 1000 },
      { id: 'b', currency: 'USD', minor: 500 },
      { id: 'c', currency: 'EUR', minor: 1000 },
    ];
    const split = splitByPrimaryCurrency(items, cur);
    expect(split.currency).toBe('USD');
    expect(split.included.map((i) => i.id)).toEqual(['a', 'b']);
    expect(split.excluded.map((i) => i.id)).toEqual(['c']);
    expect(split.otherCurrencies).toEqual(['EUR']);
  });

  it('breaks ties by first seen and falls back when empty or missing', () => {
    expect(splitByPrimaryCurrency<Item>([{ id: 'a', currency: 'NGN', minor: 1 }, { id: 'b', currency: 'USD', minor: 1 }], cur).currency).toBe('NGN');
    expect(splitByPrimaryCurrency<Item>([], cur, 'gbp').currency).toBe('GBP');
    expect(splitByPrimaryCurrency<Item>([{ id: 'a', minor: 1 }], cur).included).toHaveLength(1);
  });
});

describe('totalsByCurrency', () => {
  it('never converts', () => {
    const items: Item[] = [
      { id: 'a', currency: 'USD', minor: 1000 },
      { id: 'b', currency: 'usd', minor: 250 },
      { id: 'c', currency: 'NGN', minor: 500000 },
    ];
    expect(totalsByCurrency(items, cur, (i) => i.minor)).toEqual({ USD: 1250, NGN: 500000 });
  });
});
