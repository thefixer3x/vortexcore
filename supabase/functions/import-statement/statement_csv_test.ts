import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normaliseDate, parseMoney, parseStatementCsv } from "../_shared/statement-csv.ts";

Deno.test("reads Nigerian debit/credit statements day-first", () => {
  const csv = [
    "Account Statement,,,,",
    "Trans Date,Value Date,Narration,Debit,Credit,Balance",
    '03/10/2026,03/10/2026,DSTV SUBSCRIPTION,"24,500.00",,"487,800.00"',
    '02/11/2026,02/11/2026,SALARY NOV,,"450,000.00","772,800.00"',
  ].join("\n");
  const r = parseStatementCsv(csv);
  assertEquals(r.rows.length, 2);
  assertEquals(r.rows[0], { date: "2026-10-03", description: "DSTV SUBSCRIPTION", amount: 24500, direction: "debit", balance: 487800 });
  assertEquals(r.rows[1].direction, "credit");
  assertEquals(r.rows[1].date, "2026-11-02");
});

Deno.test("single signed amount column", () => {
  const r = parseStatementCsv("Date;Description;Amount\n2026-10-05;Ikeja Electric;-15000\n2026-10-06;Refund;2000");
  assertEquals(r.rows.map((x) => [x.direction, x.amount]), [["debit", 15000], ["credit", 2000]]);
});

Deno.test("skips rows without a valid date or amount", () => {
  const r = parseStatementCsv("Date,Details,Amount\nOpening balance,,\n2026-10-05,Rent,-150000\n,,");
  assertEquals(r.rows.length, 1);
  assertEquals(r.skipped, 1);
});

Deno.test("reports a missing header", () => {
  assertEquals(parseStatementCsv("a,b,c\n1,2,3").error !== undefined, true);
});

Deno.test("money and date formats", () => {
  assertEquals(parseMoney("₦1,234.50"), 1234.5);
  assertEquals(parseMoney("(500.00)"), -500);
  assertEquals(parseMoney("1,000.00 DR"), -1000);
  assertEquals(normaliseDate("12-Jan-2026"), "2026-01-12");
  assertEquals(normaliseDate("10/25/2026"), "2026-10-25");
  assertEquals(normaliseDate("31/02/2026"), null);
});
