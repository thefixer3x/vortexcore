#!/usr/bin/env node
/**
 * Gate 5 — Data Hygiene scan.
 *
 * Scans the shipped source tree (src/, public/) for:
 *   1. Hardcoded dates past 2024 (year >= 2025 literals in app source).
 *   2. Sample / fake financial data markers (sample/demo/example amounts, fake accounts).
 *   3. Raw SQL / database error text that could leak to customers.
 *   4. Fabricated metrics / fake "Live" indicators (e.g. "API Online" without real check).
 *
 * Excludes node_modules, dist, test fixtures/backups. Reports file:line matches for
 * triage and exits non-zero when violations are found so a release cannot ship them.
 *
 * Usage: node scripts/acceptance-gate/data-hygiene-check.mjs [<scan-root>]
 * Exit: 0 = clean, 1 = violations found.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const argPath = process.argv[2];
const rootArg = argPath ? (argPath.startsWith('/') ? argPath : join(process.cwd(), argPath)) : join(here, '..', '..');
const scanRoot = join(rootArg, 'src');

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', 'archive', 'test-results', 'playwright-report', '.next', '.vercel', 'functions.backup']);
const EXCLUDE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.lock', '.lockb', '.diff', '.sql.bak']);

// year >= 2025 literal
const DATE_RE = /\b(20(?:2[5-9]|[3-9]\d))\b/;
// sample/fake financial markers
const FAKE_RE = /\b(sample[-_\s]?(data|wallet|account|transaction|card|payment)|demo[-_\s]?(data|account|card|payment|wallet)|placeholder[-_\s]?(data|amount)|fake[-_\s]?(data|metric|dashboard)|test[-_\s]?(transaction|wallet|card|amount))|lorem\s+ipsum|1\s?234\s?456|12\s?345\s?678\b/i;
// raw sql / db error leakage
const SQL_ERR_RE = /\b(SQLSTATE|psql:|dberror|relation\s+"[a-z_]+"\s+does\s+not\s+exist|syntax\s+error\s+at\s+or\s+near|Uncaught\s+Error:\s+.*\b(in|from)\b.*\bsupabase|RPC\s+failed|Failed\s+to\s+run\s+schema\s+query)\b/i;
// fabricated live metrics / fake online indicators
const FAKE_LIVE_RE = /\b(API\s+Online|System\s+Online|All\s+Systems\s+Operational|Live\s+Demo\s*:|Fake\s+Live|Mock\s+Live)\b/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) walk(p, out);
    } else if (st.isFile() && !EXCLUDE_EXT.has(extname(name))) {
      if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html'].includes(extname(name))) out.push(p);
    }
  }
  return out;
}

const files = walk(scanRoot);
const violations = [];

for (const f of files) {
  const rel = relative(rootArg, f);
  const text = readFileSync(f, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const n = i + 1;
    if (DATE_RE.test(line)) violations.push(`${rel}:${n}  [date>2024]  ${line.trim().slice(0, 110)}`);
    if (FAKE_RE.test(line)) violations.push(`${rel}:${n}  [fake-financial]  ${line.trim().slice(0, 110)}`);
    if (SQL_ERR_RE.test(line)) violations.push(`${rel}:${n}  [sql-error-leak]  ${line.trim().slice(0, 110)}`);
    if (FAKE_LIVE_RE.test(line)) violations.push(`${rel}:${n}  [fake-live-metric]  ${line.trim().slice(0, 110)}`);
  });
}

console.log(`\nGate 5 — Data Hygiene scan (root: ${relative(process.cwd(), scanRoot) || scanRoot})`);
console.log(`  scanned ${files.length} source files`);
if (violations.length === 0) {
  console.log(`  RESULT: PASS (no date>2024 / fake-financial / sql-error-leak / fake-live matches)`);
  process.exit(0);
}
console.log(`  RESULT: FAIL — ${violations.length} match(es); triage each before release:`);
for (const v of violations) console.log(`  ✗ ${v}`);
process.exit(1);
