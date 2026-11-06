/**
 * Currency math with no exchange rates: amounts in different currencies are
 * never added together.
 */

/** ISO 4217 currencies Stripe treats as having no minor unit. */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF',
  'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);
/** Currencies with three decimal places. */
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

export function minorUnitDigits(currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

/**
 * 10.5 USD → 1050. Rounds half away from zero on the decimal value as written,
 * so 1.005 USD → 101 (binary scaling would give 100.49999… and round down).
 */
export function toMinorUnits(amount: number, currency: string): number {
  if (!Number.isFinite(amount)) throw new Error('fin-core: amount must be a finite number');
  const digits = minorUnitDigits(currency);
  const abs = Math.abs(amount);
  const text = String(abs);
  // Shift the decimal point in the shortest decimal representation instead of
  // multiplying in binary. Exponent notation (very large/small) falls back.
  const scaled = text.includes('e') ? abs * 10 ** digits : Number(`${text}e${digits}`);
  const minor = Math.round(scaled);
  return amount < 0 && minor !== 0 ? -minor : minor;
}

/** 1050 USD → 10.5 */
export function fromMinorUnits(minor: number, currency: string): number {
  if (!Number.isInteger(minor)) throw new Error('fin-core: minor units must be an integer');
  return minor / 10 ** minorUnitDigits(currency);
}

export interface CurrencySplit<T> {
  /** The currency every total is computed in. */
  currency: string;
  /** Items in `currency`; only these may be summed. */
  included: T[];
  /** Items in any other currency. */
  excluded: T[];
  /** The other currencies present, upper-case, in first-seen order. */
  otherCurrencies: string[];
}

/**
 * Pick the currency most items are in (ties go to the first seen) and split
 * the rest out, so a total never mixes currencies.
 */
export function splitByPrimaryCurrency<T>(
  items: readonly T[],
  currencyOf: (item: T) => string | null | undefined,
  fallback = 'USD',
): CurrencySplit<T> {
  const codeOf = (item: T) => (currencyOf(item) || fallback).toUpperCase();

  const counts = new Map<string, number>();
  for (const item of items) {
    const code = codeOf(item);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  let currency = fallback.toUpperCase();
  let best = 0;
  for (const [code, count] of counts) {
    if (count > best) {
      currency = code;
      best = count;
    }
  }

  return {
    currency,
    included: items.filter((i) => codeOf(i) === currency),
    excluded: items.filter((i) => codeOf(i) !== currency),
    otherCurrencies: [...counts.keys()].filter((c) => c !== currency),
  };
}

/** Totals per currency, in minor units, without converting anything. */
export function totalsByCurrency<T>(
  items: readonly T[],
  currencyOf: (item: T) => string | null | undefined,
  minorAmountOf: (item: T) => number,
  fallback = 'USD',
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const code = (currencyOf(item) || fallback).toUpperCase();
    totals[code] = (totals[code] ?? 0) + minorAmountOf(item);
  }
  return totals;
}
