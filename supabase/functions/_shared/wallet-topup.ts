// Pure helpers for card top-ups. No Deno or network APIs, so vitest can test
// them directly (src/test/__tests__/billing/wallet-topup.test.ts).
//
// Amounts move between three forms:
//   * the client's request: a number in major units (e.g. 25.5 USD)
//   * Stripe: an integer in minor units (2550)
//   * the wallet ledger: a decimal string in major units ("25.50"), passed to
//     Postgres as numeric so no float rounding reaches the balance.

/** Currencies a wallet can be topped up in. */
export const TOPUP_CURRENCIES = ["USD", "EUR", "GBP", "NGN", "ZAR", "KES"] as const;
export type TopupCurrency = (typeof TOPUP_CURRENCIES)[number];

/** Stripe zero-decimal currencies (none of the supported ones today, kept for safety). */
const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

/**
 * Per-top-up limits in major units. A first exposure cap while top-ups are
 * new; raise them deliberately. The minimum stays above Stripe's per-currency
 * minimum charge.
 */
export const TOPUP_LIMITS: Record<TopupCurrency, { min: number; max: number }> = {
  USD: { min: 1, max: 1_000 },
  EUR: { min: 1, max: 1_000 },
  GBP: { min: 1, max: 1_000 },
  NGN: { min: 1_000, max: 1_500_000 },
  ZAR: { min: 20, max: 20_000 },
  KES: { min: 150, max: 150_000 },
};

export function decimalsFor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/** Major units → integer minor units. Returns null for sub-minor-unit amounts. */
export function toMinorUnits(amount: number, currency: string): number | null {
  if (!Number.isFinite(amount)) return null;
  const factor = 10 ** decimalsFor(currency);
  const scaled = amount * factor;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-6) return null; // e.g. 1.005 USD
  return rounded;
}

/** Integer minor units → decimal string in major units ("25.50"). */
export function fromMinorUnits(minor: number, currency: string): string {
  const d = decimalsFor(currency);
  if (!Number.isInteger(minor)) throw new Error("minor units must be an integer");
  if (d === 0) return String(minor);
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor).toString().padStart(d + 1, "0");
  return `${sign}${abs.slice(0, -d)}.${abs.slice(-d)}`;
}

export interface TopupRequest {
  amountMinor: number;
  currency: TopupCurrency;
  paymentMethodId: string;
  idempotencyKey: string;
}

export type ParseResult = { ok: true; value: TopupRequest } | { ok: false; error: string };

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,100}$/;

/** Validates a fund-wallet request body. Never trusts the client beyond this. */
export function parseTopupRequest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request" };
  const b = body as Record<string, unknown>;

  const currency = typeof b.currency === "string" ? b.currency.trim().toUpperCase() : "";
  if (!(TOPUP_CURRENCIES as readonly string[]).includes(currency)) {
    return { ok: false, error: `Top-ups are available in ${TOPUP_CURRENCIES.join(", ")}` };
  }
  const cur = currency as TopupCurrency;

  if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0) {
    return { ok: false, error: "Enter an amount greater than zero" };
  }
  const { min, max } = TOPUP_LIMITS[cur];
  if (b.amount < min || b.amount > max) {
    return { ok: false, error: `Top-ups in ${cur} must be between ${min} and ${max}` };
  }
  const amountMinor = toMinorUnits(b.amount, cur);
  if (amountMinor === null) return { ok: false, error: "Amount has too many decimal places" };

  const paymentMethodId = typeof b.payment_method_id === "string" ? b.payment_method_id : "";
  if (!/^pm_[A-Za-z0-9]+$/.test(paymentMethodId)) return { ok: false, error: "Choose a saved card" };

  const idempotencyKey = typeof b.idempotency_key === "string" ? b.idempotency_key : "";
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) return { ok: false, error: "Missing request key; please retry" };

  return { ok: true, value: { amountMinor, currency: cur, paymentMethodId, idempotencyKey } };
}

/**
 * Checks that a succeeded PaymentIntent is exactly the one we asked for before
 * crediting: same amount, same currency, same customer, our top-up purpose.
 */
export function paymentIntentMatches(
  pi: { status: string; amount_received?: number | null; currency: string; customer?: unknown; metadata?: Record<string, string> | null },
  expected: { amountMinor: number; currency: string; customerId: string; userId: string },
): boolean {
  const customer = typeof pi.customer === "string" ? pi.customer : (pi.customer as { id?: string } | null)?.id;
  return (
    pi.status === "succeeded" &&
    pi.amount_received === expected.amountMinor &&
    pi.currency.toUpperCase() === expected.currency.toUpperCase() &&
    customer === expected.customerId &&
    pi.metadata?.user_id === expected.userId &&
    pi.metadata?.purpose === "wallet_topup"
  );
}
