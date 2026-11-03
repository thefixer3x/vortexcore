// Extract bank statement rows from a PDF with Lovable AI (Responses, structured output).
import { streamStructured } from "./responses.ts";
import type { StatementRow } from "./statement-csv.ts";
import { normaliseDate } from "./statement-csv.ts";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["currency", "transactions"],
  properties: {
    currency: { type: ["string", "null"], description: "ISO currency code of the statement, e.g. NGN" },
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "description", "amount", "direction", "balance"],
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          description: { type: "string" },
          amount: { type: "number", description: "Positive amount" },
          direction: { type: "string", enum: ["credit", "debit"] },
          balance: { type: ["number", "null"] },
        },
      },
    },
  },
};

export async function extractPdfStatement(
  request: Request,
  apiKey: string,
  fileName: string,
  base64: string,
): Promise<{ rows: StatementRow[]; currency: string | null; skipped: number }> {
  const out = await streamStructured<{ currency: string | null; transactions: Array<Record<string, unknown>> }>(
    request, apiKey, {
      name: "bank_statement",
      schema: SCHEMA,
      instructions:
        "You extract every transaction row from a bank statement. Copy values exactly as printed; never invent rows. " +
        "Money out (debit/withdrawal) is direction 'debit'; money in (credit/deposit) is 'credit'. Amounts are positive numbers without currency symbols or commas. " +
        "Dates as YYYY-MM-DD; statements from Nigeria use day/month order. Skip opening/closing balance lines and totals. At most 1000 rows.",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract the transactions from this statement." },
          { type: "file", filename: fileName || "statement.pdf", data: base64, mediaType: "application/pdf" },
        ],
      }],
    },
  );
  let skipped = 0;
  const rows: StatementRow[] = [];
  for (const t of out?.transactions ?? []) {
    const date = normaliseDate(String(t.date ?? ""));
    const amount = Math.abs(Number(t.amount));
    const description = String(t.description ?? "").trim().slice(0, 300);
    if (!date || !Number.isFinite(amount) || amount <= 0 || !description) { skipped++; continue; }
    rows.push({
      date, description, amount,
      direction: t.direction === "credit" ? "credit" : "debit",
      balance: typeof t.balance === "number" && Number.isFinite(t.balance) ? t.balance : null,
    });
  }
  const currency = typeof out?.currency === "string" && /^[A-Z]{3}$/.test(out.currency) ? out.currency : null;
  return { rows, currency, skipped };
}
