import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const CATEGORIES = ["subscription", "utility", "loan", "rent", "insurance", "tax", "salary", "other"];
const RECURRENCE = ["none", "weekly", "monthly", "quarterly", "yearly"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !userData?.user) return json({ error: "Please sign in" }, 401);
  const userId = userData.user.id;

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "VortexAI is not configured" }, 503);

  const { data: run } = await admin.from("vortex_obligation_detections")
    .insert({ user_id: userId, status: "running" }).select("id").single();

  const finish = async (patch: Record<string, unknown>) => {
    if (run?.id) await admin.from("vortex_obligation_detections")
      .update({ ...patch, run_completed_at: new Date().toISOString() }).eq("id", run.id);
  };

  try {
    const { data: txs, error: txErr } = await admin.from("vortex_transactions")
      .select("id, amount, type, description, metadata, created_at, status")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
    if (txErr) throw txErr;
    if (!txs?.length) {
      await finish({ status: "completed", transactions_scanned: 0, obligations_created: 0 });
      return json({ created: 0, scanned: 0, message: "No transactions to analyse yet." });
    }

    const compact = txs.map((t) => {
      const m = (t.metadata ?? {}) as Record<string, unknown>;
      return { id: t.id, amount: Number(t.amount) || 0, type: t.type, date: t.created_at,
        description: t.description || m.description || "", counterparty: m.counterparty || "", category: m.category || "" };
    });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You detect recurring financial obligations (subscriptions, bills, loans, rent, insurance, taxes, salaries) from transactions. Only report obligations supported by the data (repeated payments or clear bill descriptions). Predict the next due date based on the pattern. Today is ${new Date().toISOString().slice(0, 10)}.` },
          { role: "user", content: JSON.stringify(compact) },
        ],
        tools: [{ type: "function", function: {
          name: "report_obligations",
          parameters: { type: "object", properties: { obligations: { type: "array", items: { type: "object", properties: {
            title: { type: "string" }, description: { type: "string" },
            category: { type: "string", enum: CATEGORIES }, amount: { type: "number" },
            next_due_date: { type: "string", description: "YYYY-MM-DD" },
            recurrence: { type: "string", enum: RECURRENCE }, confidence: { type: "number" },
            transaction_ids: { type: "array", items: { type: "string" } },
          }, required: ["title", "category", "recurrence", "confidence"] } } }, required: ["obligations"] },
        } }],
        tool_choice: { type: "function", function: { name: "report_obligations" } },
      }),
    });
    if (!aiRes.ok) {
      const msg = aiRes.status === 429 ? "VortexAI is busy, try again shortly."
        : aiRes.status === 402 ? "VortexAI credits are exhausted." : "Detection failed.";
      await finish({ status: "failed", error: msg, transactions_scanned: txs.length });
      return json({ error: msg }, aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502);
    }
    const ai = await aiRes.json();
    const args = ai?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const found = (args ? JSON.parse(args).obligations : []) as Array<Record<string, unknown>>;

    const { data: existing } = await admin.from("vortex_obligations")
      .select("source_ref").eq("user_id", userId).eq("source", "ai");
    const seen = new Set((existing ?? []).map((e) => e.source_ref));

    const rows = found.slice(0, 30).map((o) => {
      const title = String(o.title ?? "").slice(0, 120);
      const ref = `ai:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const due = typeof o.next_due_date === "string" && !isNaN(Date.parse(o.next_due_date)) ? new Date(o.next_due_date).toISOString() : null;
      return {
        user_id: userId, title, description: o.description ? String(o.description).slice(0, 500) : null,
        category: CATEGORIES.includes(String(o.category)) ? String(o.category) : "other",
        amount: typeof o.amount === "number" ? Math.abs(o.amount) : null,
        due_date: due, recurrence: RECURRENCE.includes(String(o.recurrence)) ? String(o.recurrence) : "none",
        status: due && new Date(due) < new Date() ? "overdue" : "upcoming",
        source: "ai", confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)), source_ref: ref,
        metadata: { transaction_ids: Array.isArray(o.transaction_ids) ? o.transaction_ids.slice(0, 20) : [] },
      };
    }).filter((r) => r.title && !seen.has(r.source_ref));

    if (rows.length) {
      const { error } = await admin.from("vortex_obligations").insert(rows);
      if (error) throw error;
    }
    await finish({ status: "completed", transactions_scanned: txs.length, obligations_created: rows.length });
    return json({ created: rows.length, scanned: txs.length });
  } catch (e) {
    console.error("detect-obligations failed", e);
    await finish({ status: "failed", error: "Detection failed" });
    return json({ error: "Detection failed. Please try again." }, 500);
  }
});
