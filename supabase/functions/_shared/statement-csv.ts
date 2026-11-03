// Pure CSV bank-statement parser (no Deno APIs) — shared by import-statement and tests.

export interface StatementRow {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // always positive
  direction: "credit" | "debit";
  balance: number | null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");
function build(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Parse a statement date. Numeric dates are read day-first (Nigerian banks). */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return build(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    const a = +m[1], b = +m[2];
    // Day-first unless that is impossible (e.g. 10/25/2026).
    return b > 12 && a <= 12 ? build(+m[3], a, b) : build(+m[3], b, a);
  }
  m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ,]*(\d{2,4})/);
  if (m && MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()]) {
    const mon = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()];
    return build(+m[3], mon, +m[1]);
  }
  m = s.match(/^([A-Za-z]{3,9})[ -](\d{1,2}),?[ -](\d{2,4})/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return build(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  return null;
}

/** Parse money: "₦1,234.50", "(500.00)", "1,000.00 DR", "-20". Returns signed number or null. */
export function parseMoney(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s || s === "-" || s === "--") return null;
  let sign = 1;
  if (/\bDR\b/i.test(s)) sign = -1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  s = s.replace(/\b(CR|DR)\b/gi, "").replace(/[^\d.,-]/g, "");
  if (s.startsWith("-")) { sign = -sign; s = s.slice(1); }
  s = s.replace(/,/g, "");
  if (!s || isNaN(Number(s))) return null;
  return sign * Number(s);
}

export function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const find = (headers: string[], patterns: RegExp[], exclude?: RegExp) => {
  for (const p of patterns) {
    const i = headers.findIndex((h) => p.test(h) && !(exclude && exclude.test(h)));
    if (i >= 0) return i;
  }
  return -1;
};

export function parseStatementCsv(text: string): { rows: StatementRow[]; skipped: number; error?: string } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], skipped: 0, error: "The file is empty." };
  const sample = lines.slice(0, 20).join("\n");
  const delim = [",", ";", "\t", "|"].sort((a, b) => sample.split(b).length - sample.split(a).length)[0];

  // Header row: first of the top 20 lines naming a date and an amount-like column.
  let headerIdx = -1, headers: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cells = splitCsvLine(lines[i], delim).map((c) => c.toLowerCase());
    if (cells.some((c) => /date/.test(c)) && cells.some((c) => /amount|debit|credit|withdraw|deposit|money (in|out)|paid (in|out)/.test(c))) {
      headerIdx = i; headers = cells; break;
    }
  }
  if (headerIdx < 0) return { rows: [], skipped: 0, error: "Couldn't find the column headings (date and amount) in this file." };

  const dateCol = find(headers, [/trans(action)?\.? ?date/, /post(ing|ed)? ?date/, /^date$/, /date/], /value/) >= 0
    ? find(headers, [/trans(action)?\.? ?date/, /post(ing|ed)? ?date/, /^date$/, /date/], /value/)
    : find(headers, [/date/]);
  const descCol = find(headers, [/narration/, /desc/, /details?/, /particulars/, /remarks?/, /memo/, /payee/, /reference|ref/]);
  const debitCol = find(headers, [/debit/, /withdraw/, /money out/, /paid out/, /^dr$/]);
  const creditCol = find(headers, [/credit/, /deposit/, /lodg/, /money in/, /paid in/, /^cr$/]);
  const amountCol = find(headers, [/^amount/, /amount/], /balance/);
  const balanceCol = find(headers, [/balance/]);
  const typeCol = find(headers, [/^type$/, /dr ?\/ ?cr/, /direction/, /trans(action)? type/]);

  const rows: StatementRow[] = [];
  let skipped = 0;
  for (const line of lines.slice(headerIdx + 1)) {
    const c = splitCsvLine(line, delim);
    const date = dateCol >= 0 ? normaliseDate(c[dateCol] ?? "") : null;
    if (!date) { skipped++; continue; }
    let signed: number | null = null;
    const debit = debitCol >= 0 ? parseMoney(c[debitCol]) : null;
    const credit = creditCol >= 0 ? parseMoney(c[creditCol]) : null;
    if (debit && Math.abs(debit) > 0) signed = -Math.abs(debit);
    else if (credit && Math.abs(credit) > 0) signed = Math.abs(credit);
    else if (amountCol >= 0) {
      signed = parseMoney(c[amountCol]);
      const t = typeCol >= 0 ? (c[typeCol] ?? "").toLowerCase() : "";
      if (signed != null && /^(d|dr|debit|withdrawal|out)/.test(t)) signed = -Math.abs(signed);
      if (signed != null && /^(c|cr|credit|deposit|in)/.test(t)) signed = Math.abs(signed);
    }
    if (signed == null || signed === 0) { skipped++; continue; }
    const description = (descCol >= 0 ? c[descCol] : "")?.trim().slice(0, 300) || "Statement transaction";
    rows.push({
      date, description, amount: Math.abs(signed),
      direction: signed < 0 ? "debit" : "credit",
      balance: balanceCol >= 0 ? parseMoney(c[balanceCol]) : null,
    });
  }
  return { rows, skipped };
}
