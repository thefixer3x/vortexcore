// Shared AI obligation detection used by detect-obligations and import-statement.
// deno-lint-ignore-file no-explicit-any
type Client = any;

export const CATEGORIES = ["subscription", "utility", "loan", "rent", "insurance", "tax", "salary", "other"];
export const RECURRENCE = ["none", "weekly", "monthly", "quarterly", "yearly"];

export interface CompactTx {
  id: string; amount: number; type: string; date: string;
  description: string; counterparty?: string; category?: string;
}

export function compactTransactions(txs: Array<Record<string, any>>): CompactTx[] {
  return txs.map((t) => {
    const m = (t.metadata ?? {}) as Record<string, unknown>;
    return {
      id: t.id, amount: Number(t.amount) || 0, type: t.type, date: t.created_at,
      description: String(t.description || m.description || ""),
      counterparty: String(m.counterparty || ""), category: String(t.category || m.category || ""),
    };
  });
}

export class DetectionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Ask VortexAI for recurring obligations in `txs` and save new ones. */
export async function detectAndSaveObligations(
  admin: Client, userId: string, txs: CompactTx[], apiKey: string, currency?: string,
): Promise<{ created: number; scanned: number }> {
  const { data: run } = await admin.from("vortex_obligation_detections")
    .insert({ user_id: userId, status: "running" }).select("id").single();
  const finish = async (patch: Record<string, unknown>) => {
    if (run?.id) await admin.from("vortex_obligation_detections")
      .update({ ...patch, run_completed_at: new Date().toISOString() }).eq("id", run.id);
  };
  if (!txs.length) {
    await finish({ status: "completed", transactions_scanned: 0, obligations_created: 0 });
    return { created: 0, scanned: 0 };
  }
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You detect recurring financial obligations (subscriptions, bills, loans, rent, insurance, taxes, salaries) from transactions. Only report obligations supported by the data (repeated payments or clear bill descriptions). Predict the next due date based on the pattern. Today is ${new Date().toISOString().slice(0, 10)}.` },
          { role: "user", content: JSON.stringify(txs) },
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
      throw new DetectionError(msg, aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502);
    }
    const ai = await aiRes.json();
    const args = ai?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const found = (args ? JSON.parse(args).obligations : []) as Array<Record<string, unknown>>;

    const { data: existing } = await admin.from("vortex_obligations")
      .select("source_ref").eq("user_id", userId).eq("source", "ai");
    const seen = new Set((existing ?? []).map((e: { source_ref: string }) => e.source_ref));

    const rows = found.slice(0, 30).map((o) => {
      const title = String(o.title ?? "").slice(0, 120);
      const ref = `ai:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const due = typeof o.next_due_date === "string" && !isNaN(Date.parse(o.next_due_date)) ? new Date(o.next_due_date).toISOString() : null;
      return {
        user_id: userId, title, description: o.description ? String(o.description).slice(0, 500) : null,
        category: CATEGORIES.includes(String(o.category)) ? String(o.category) : "other",
        amount: typeof o.amount === "number" ? Math.abs(o.amount) : null,
        ...(currency ? { currency } : {}),
        due_date: due, recurrence: RECURRENCE.includes(String(o.recurrence)) ? String(o.recurrence) : "none",
        status: due && new Date(due) < new Date() ? "overdue" : "upcoming",
        source: "ai", confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)), source_ref: ref,
        metadata: { transaction_ids: Array.isArray(o.transaction_ids) ? o.transaction_ids.slice(0, 20) : [] },
      };
    }).filter((r) => r.title && !seen.has(r.source_ref));

    if (rows.length) {
      const { error } = await admin.from("vortex_obligations").insert(rows);
      if (error) throw error;
      await admin.from("vortex_obligation_feed").insert(rows.map((r) => ({
        user_id: userId, kind: "detected", message: `VortexAI found ${r.title}`, amount: r.amount, currency: currency ?? null,
      })));
    }
    await finish({ status: "completed", transactions_scanned: txs.length, obligations_created: rows.length });
    return { created: rows.length, scanned: txs.length };
  } catch (e) {
    if (e instanceof DetectionError) throw e;
    console.error("obligation detection failed", e);
    await finish({ status: "failed", error: "Detection failed" });
    throw new DetectionError("Detection failed. Please try again.", 500);
  }
}
