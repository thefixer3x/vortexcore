// OBF-001-V: Providus accounts proxy via onasis-gateway
// Uses project-standard withAuthMiddleware from _shared/middleware.ts
// Secrets: ONASIS_GATEWAY_URL, ONASIS_GATEWAY_TOKEN (Supabase Vault — never in browser bundle)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "../_shared/supabase-client.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("VORTEX_SUPABASE_SECRET_KEY") || "");

// Account IDs the signed-in user has linked (app_vortexcore.accounts via public facade).
async function ownedAccountIds(userId: string): Promise<Set<string>> {
  const { data } = await db.from("accounts").select("provider_account_id").eq("user_id", userId).eq("is_active", true);
  return new Set((data || []).map((r: any) => r.provider_account_id).filter(Boolean));
}

// ── Env ──────────────────────────────────────────────────────────────────────

const GATEWAY_URL = Deno.env.get("ONASIS_GATEWAY_URL");
const GATEWAY_TOKEN = Deno.env.get("ONASIS_GATEWAY_TOKEN");

// ── Shared schema (mirrored from onasis-gateway OBF types) ───────────────────

const AccountSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  maskedNumber: z.string(),
  type: z.string(),
  currency: z.string(),
  balance: z.number(),
  asOf: z.string(),
});

const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  postedAt: z.string(),
  amount: z.number(),
  currency: z.string(),
  direction: z.enum(["credit", "debit"]),
  counterparty: z.string(),
  description: z.string(),
  status: z.enum(["posted", "pending", "failed"]),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function schemaViolation(entity: string): Response {
  return json(
    {
      code: "schema_violation",
      message: `Gateway returned an unexpected ${entity} shape.`,
      upstreamStatus: 502,
    },
    502
  );
}

async function gatewayFetch(path: string): Promise<Response> {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    return json(
      {
        code: "gateway_not_configured",
        message: "onasis-gateway is not configured on this environment.",
      },
      503
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${GATEWAY_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("[obf-accounts] Gateway fetch error:", err);
    return json(
      { code: "gateway_unreachable", message: "Could not reach onasis-gateway." },
      502
    );
  }

  if (!upstream.ok) {
    let errBody: unknown;
    try {
      errBody = await upstream.json();
    } catch {
      errBody = { code: "gateway_error", message: upstream.statusText, upstreamStatus: upstream.status };
    }
    return json(errBody, upstream.status);
  }

  return upstream;
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(
  withAuthMiddleware(async (req, { auth }) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Healthcheck — confirms gateway reachability without auth data
    if (req.method === "GET" && pathname.endsWith("/healthz")) {
      if (!GATEWAY_URL || !GATEWAY_TOKEN) {
        return json({ status: "unconfigured" }, 503);
      }
      try {
        const probe = await fetch(`${GATEWAY_URL}/healthz`, {
          headers: { Authorization: `Bearer ${GATEWAY_TOKEN}` },
        });
        return json({ status: probe.ok ? "ok" : "degraded", upstreamStatus: probe.status });
      } catch {
        return json({ status: "unreachable" }, 502);
      }
    }

    // GET /obf-accounts  →  accounts list
    if (req.method === "GET" && /\/obf-accounts\/?$/.test(pathname)) {
      const upstream = await gatewayFetch("/v1/aisp/accounts");
      if (!upstream.ok) return upstream;

      const raw = await upstream.json();
      const parsed = z.array(AccountSchema).safeParse(raw);
      if (!parsed.success) {
        console.error("[obf-accounts] Account schema violation:", parsed.error.flatten());
        return schemaViolation("account");
      }
      const owned = await ownedAccountIds(auth.userId!);
      return json(parsed.data.filter((a) => owned.has(a.id)));
    }

    // GET /obf-accounts/:id/transactions  →  transactions for account
    const txMatch = pathname.match(/\/obf-accounts\/([^/]+)\/transactions\/?$/);
    if (req.method === "GET" && txMatch) {
      const accountId = decodeURIComponent(txMatch[1]);
      const owned = await ownedAccountIds(auth.userId!);
      if (!owned.has(accountId)) return json({ error: "Account not found" }, 404);
      const params = new URLSearchParams();
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      const limit = String(Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50") || 50, 1), 200));
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", limit);

      const upstream = await gatewayFetch(
        `/v1/aisp/accounts/${encodeURIComponent(accountId)}/transactions?${params.toString()}`
      );
      if (!upstream.ok) return upstream;

      const raw = await upstream.json();
      const parsed = z.array(TransactionSchema).safeParse(raw);
      if (!parsed.success) {
        console.error("[obf-accounts] Transaction schema violation:", parsed.error.flatten());
        return schemaViolation("transaction");
      }
      return json(parsed.data);
    }

    return json({ error: "Not found" }, 404);
  },
  ["GET"],
  )
);
