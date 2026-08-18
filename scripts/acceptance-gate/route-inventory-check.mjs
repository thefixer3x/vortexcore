#!/usr/bin/env node
/**
 * Gate 6 — Route Completeness check.
 *
 * 1. Reads scripts/acceptance-gate/routes.json (the committed route inventory).
 * 2. Verifies every inventory route is registered in src/App.tsx (static scan).
 * 3. Flags placeholder destinations (kind=placeholder) as gate violations.
 * 4. If BASE_URL is set, optionally live-probes each functional route and reports
 *    HTTP outcome so navigation never lands on a 404/placeholder.
 *
 * Usage: node scripts/acceptance-gate/route-inventory-check.mjs [--app <src/App.tsx>]
 * Exit: 0 = pass, 1 = gate violation (missing route / placeholder destination).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(root, 'routes.json');
const appPath = process.argv.find((a, i) => a === '--app') ? process.argv[process.argv.indexOf('--app') + 1] : join(root, '..', '..', 'src', 'App.tsx');

if (!existsSync(manifestPath)) { console.error('✗ routes.json not found:', manifestPath); process.exit(1); }
if (!existsSync(appPath)) { console.error('✗ App.tsx not found:', appPath); process.exit(1); }

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const appSource = readFileSync(appPath, 'utf8');

const problems = [];
let registered = 0;
let placeholders = 0;

for (const r of manifest.routes) {
  // Registered in router? App.tsx uses absolute paths for top-level routes and
  // RELATIVE nested paths (e.g. "beneficiaries" under "/profile/payments").
  // Accept the full absolute path OR the leaf segment as a path="..." attribute.
  const escaped = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const full = new RegExp(`path="${escaped(r.path)}"`).test(appSource);
  const segs = r.path.split('/').filter(Boolean);
  const leafSeg = segs.length ? segs.pop() : null;
  const leaf = leafSeg ? new RegExp(`path="${escaped(leafSeg)}"`).test(appSource) : false;
  const inRouter = full || leaf;
  if (!inRouter) problems.push(`ROUTE MISSING from router: ${r.path}`);
  else registered++;

  if (r.kind === 'placeholder') {
    placeholders++;
    problems.push(`PLACEHOLDER destination (violates Gate 6): ${r.path} -> ${r.component}`);
  }
}

console.log(`\nGate 6 — Route Completeness`);
console.log(`  inventory: ${manifest.routes.length} routes, registered=${registered}, placeholders=${placeholders}`);
for (const p of problems) console.log(`  ✗ ${p}`);

// Optional live probe
const base = process.env.BASE_URL;
if (base) {
  const publicOnly = manifest.routes.filter(r => !r.auth);
  console.log(`\n  Live probe (BASE_URL=${base}) against ${publicOnly.length} public routes:`);
  const results = await Promise.all(publicOnly.map(async (r) => {
    try {
      const res = await fetch(base + r.path, { redirect: 'manual' });
      return { path: r.path, status: res.status, loc: res.headers.get('location') || '' };
    } catch (e) {
      return { path: r.path, status: 'ERR', loc: String(e) };
    }
  }));
  for (const r of results) {
    const ok = r.status === 200;
    if (!ok) problems.push(`LIVE ${r.path} -> ${r.status}${r.loc ? ' (redirect ' + r.loc + ')' : ''}`);
    console.log(`  ${ok ? '✓' : '✗'} ${r.path} -> ${r.status}${r.loc ? ' (→ ' + r.loc + ')' : ''}`);
  }
} else {
  console.log(`\n  (live probe skipped — set BASE_URL to probe functional routes)`);
}

if (problems.length > 0) {
  console.log(`\nRESULT: FAIL (${problems.length} violation(s))`);
  process.exit(1);
}
console.log(`\nRESULT: PASS`);
process.exit(0);
