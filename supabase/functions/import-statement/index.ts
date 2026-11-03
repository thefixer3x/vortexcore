// Bank statement import: CSV (parsed directly) or PDF (read by VortexAI).
// Inserts transactions (each fires the obligations live-feed trigger), then
// runs VortexAI obligation detection on the imported rows.
import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { parseStatementCsv, type StatementRow } from "../_shared/statement-csv.ts";
import { extractPdfStatement } from "../_shared/statement-pdf.ts";
import { detectAndSaveObligations, DetectionError } from "../_shared/obligation-detection.ts";

const headers = { ...corsHeaders, "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

const MAX_ROWS = 1000;
const MAX_CSV_CHARS = 2_000_000;
const MAX_PDF_BASE64 = 10_000_000; // ~7.5 MB file
const CURRENCY = /^[A-Z]{3}$/;

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("VORTEX_SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u, error: authErr } = await userClient.auth.getUser(authHeader.replace(/^Bearer /, ""));
  if (authErr || !u?.user) return json({ error: "Please sign in" }, 401);
  const userId = u.user.id;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const fileName = typeof body.file_name === "string" ? body.file_name.slice(0, 200) : "statement";
  const fileType = body.file_type === "pdf" ? "pdf" : body.file_type === "csv" ? "csv" : null;
  let currency = typeof body.currency === "string" && CURRENCY.test(body.currency) ? body.currency : "NGN";
  if (!fileType) return json({ error: "Upload a CSV or PDF statement." }, 400);

  let rows: StatementRow[] = [];
  let skipped = 0;
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (fileType === "csv") {
    if (typeof body.content !== "string" || !body.content.trim()) return json({ error: "The file is empty." }, 400);
    if (body.content.length > MAX_CSV_CHARS) return json({ error: "That file is too large (max 2 MB)." }, 400);
    const parsed = parseStatementCsv(body.content);
    if (parsed.error) return json({ error: parsed.error }, 400);
    rows = parsed.rows; skipped = parsed.skipped;
  } else {
    if (typeof body.data_base64 !== "string" || !body.data_base64) return json({ error: "The file is empty." }, 400);
    if (body.data_base64.length > MAX_PDF_BASE64) return json({ error: "That file is too large (max 7 MB)." }, 400);
    if (!key) return json({ error: "VortexAI is not configured" }, 503);
    try {
      const r = await extractPdfStatement(req, key, fileName, body.data_base64);
      rows = r.rows; skipped = r.skipped;
      if (r.currency && body.currency == null) currency = r.currency;
    } catch (e) {
      const status = (e as { status?: number }).status ?? 502;
      return json({ error: (e as Error).message }, status);
    }
  }
  if (!rows.length) return json({ error: "No transactions were found in this file." }, 400);
  if (rows.length > MAX_ROWS) { skipped += rows.length - MAX_ROWS; rows = rows.slice(0, MAX_ROWS); }

  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);
  const importId = crypto.randomUUID();
  // Identical rows on the same day get an occurrence number, so a re-upload of
  // the same statement produces the same references and is skipped.
  const seenKeys = new Map<string, number>();
  const prepared = await Promise.all(rows.map(async (r) => {
    const base = [userId, r.date, r.amount, r.direction, r.description.toLowerCase(), r.balance ?? ""].join("|");
    const n = (seenKeys.get(base) ?? 0) + 1;
    seenKeys.set(base, n);
    return {
      user_id: userId,
      amount: r.amount,
      currency,
      type: r.direction,
      status: "completed",
      description: r.description,
      reference: `stmt:${await sha(`${base}|${n}`)}`,
      metadata: { source: "statement", import_id: importId, file_name: fileName, balance: r.balance },
      created_at: `${r.date}T12:00:00Z`,
      completed_at: `${r.date}T12:00:00Z`,
    };
  }));

  // Drop rows already imported earlier.
  const existing = new Set<string>();
  for (let i = 0; i < prepared.length; i += 200) {
    const refs = prepared.slice(i, i + 200).map((p) => p.reference);
    const { data, error } = await admin.from("vortex_transactions").select("reference").in("reference", refs);
    if (error) { console.error("import-statement dedupe failed", error); return json({ error: "Import failed. Please try again." }, 500); }
    for (const d of data ?? []) existing.add(d.reference);
  }
  const fresh = prepared.filter((p) => !existing.has(p.reference));
  const inserted: Array<{ id: string; amount: number; type: string; description: string; created_at: string }> = [];
  // Oldest first so the live feed and matching follow the statement's order.
  fresh.sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (let i = 0; i < fresh.length; i += 200) {
    const chunk = fresh.slice(i, i + 200);
    const { data, error } = await admin.from("vortex_transactions").insert(chunk).select("id, amount, type, description, created_at");
    if (error) { console.error("import-statement insert failed", error); return json({ error: "Import failed. Please try again.", imported: inserted.length }, 500); }
    inserted.push(...(data ?? []));
  }

  let matched = 0;
  const insertedIds = inserted.map((t) => t.id);
  if (insertedIds.length) {
    const { count } = await admin.from("vortex_obligation_feed").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("kind", "matched").in("transaction_id", insertedIds.slice(0, 1000));
    matched = count ?? 0;
  }

  let obligationsCreated = 0;
  let detectionError: string | undefined;
  if (insertedIds.length && key) {
    try {
      const compact = inserted.slice(-400).map((t) => ({
        id: t.id, amount: Number(t.amount), type: t.type, date: t.created_at, description: t.description,
      }));
      obligationsCreated = (await detectAndSaveObligations(admin, userId, compact, key, currency)).created;
    } catch (e) {
      detectionError = e instanceof DetectionError ? e.message : "Detection failed";
    }
  }

  return json({
    import_id: importId,
    imported: insertedIds.length,
    duplicates: prepared.length - fresh.length,
    skipped,
    matched,
    obligations_created: obligationsCreated,
    currency,
    ...(detectionError ? { detection_error: detectionError } : {}),
  });
});
