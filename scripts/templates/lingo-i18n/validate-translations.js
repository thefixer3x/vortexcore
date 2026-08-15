#!/usr/bin/env node

/**
 * Translation key-coverage validator.
 * Flattens nested keys in en.json and verifies every other locale has the same set.
 * Exits non-zero on any drift (missing or extra keys).
 *
 * Usage: node scripts/validate-translations.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'locales');
const languages = ['es', 'fr', 'de', 'ja', 'zh', 'pt', 'ar', 'ko', 'it', 'ru'];

const sourceFile = path.join(localesDir, 'en.json');
if (!fs.existsSync(sourceFile)) {
  console.error('❌ Missing source file: locales/en.json');
  process.exit(1);
}

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flattenKeys(v, key)
      : [key];
  });
}

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const sourceKeys = new Set(flattenKeys(sourceData));

let hasErrors = false;

console.log(`📋 Source: en.json (${sourceKeys.size} keys)\n`);

for (const lang of languages) {
  const targetFile = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(targetFile)) {
    console.warn(`⚠️  Missing file: locales/${lang}.json`);
    hasErrors = true;
    continue;
  }

  let targetData;
  try {
    targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  } catch (e) {
    console.error(`❌ Invalid JSON in ${lang}.json: ${e.message}`);
    hasErrors = true;
    continue;
  }

  const targetKeys = new Set(flattenKeys(targetData));
  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${lang}.json — complete (${sourceKeys.size} keys)`);
  } else {
    if (missing.length > 0) {
      console.error(`❌ ${lang}.json — missing ${missing.length} keys:`);
      missing.forEach((k) => console.error(`   - ${k}`));
      hasErrors = true;
    }
    if (extra.length > 0) {
      console.warn(`⚠️  ${lang}.json — ${extra.length} extra keys (not in en.json):`);
      extra.forEach((k) => console.warn(`   + ${k}`));
    }
  }
}

if (hasErrors) {
  console.error('\n❌ Translation validation failed.');
  process.exit(1);
} else {
  console.log('\n✅ All translations complete.');
}
