# i18n Workflow — Lingo.dev Pre-Translation Pipeline

**Status:** Production ready · **Verified:** 2026-04-28 · **CLI:** `lingo.dev@0.133.11`

This project pre-translates user-facing strings at build time using the Lingo.dev CLI. Locale JSON files are committed to the repo and shipped with the bundle — there is **no runtime translation API call**. `react-i18next` only reads the pre-baked JSON.

---

## TL;DR — Day-to-Day Flow

```bash
# 1. Add new keys ONLY to locales/en.json (source of truth)
# 2. Translate to all 10 target locales
bun run i18n:translate

# 3. Verify every locale has the same key set
bun run i18n:validate

# 4. Commit en.json + 10 target locale JSONs together
git add locales/*.json && git commit -m "i18n: <feature>"
```

That's it. Skip the rest unless something breaks.

---

## One-Time Setup

### 1. Authenticate the Lingo CLI

API key is per-developer. Get one from https://lingo.dev → Account → API Keys.

```bash
npx lingo.dev@latest config set auth.apiKey lingo_sk_xxx
bun run i18n:auth      # → ✔ Authenticated as <email>
```

The key is stored in `~/.lingodotdevrc` (gitignored at the user level). Do **not** put it in repo `.env` files committed to git.

If `auth` fails with `Failed to connect to the API`, fall back to env var:
```bash
export LINGO_API_KEY=lingo_sk_xxx
bun run i18n:auth
```
(`LINGODOTDEV_API_KEY` is deprecated — use `LINGO_API_KEY`.)

### 2. Verify project config

`i18n.json` (committed) defines source/target locales and which files Lingo manages:

```json
{
  "version": 1.8,
  "locale": {
    "source": "en",
    "targets": ["es", "fr", "de", "ja", "zh", "pt", "ar", "ko", "it", "ru"]
  },
  "buckets": {
    "json": { "include": ["locales/[locale].json"] }
  },
  "$schema": "https://lingo.dev/schema/i18n.json"
}
```

`[locale]` is the wildcard that maps to each target. To add a new target language, append the ISO code to `targets` and run `bun run i18n:translate`.

---

## The Scripts

| Command | What it does |
|---------|--------------|
| `bun run i18n:translate` | Reads `locales/en.json`, writes the 10 target locale files. Uses cache — only re-translates changed keys. |
| `bun run i18n:validate` | Local-only key parity check. Flattens nested keys, reports missing/extra per locale. Exits non-zero if any drift. |
| `bun run i18n:status` | Shows per-locale completeness from Lingo's perspective + word-count usage estimate. |
| `bun run i18n:cleanup` | Removes keys from target locales that no longer exist in `en.json`. Run after deleting or renaming keys. |
| `bun run i18n:auth` | Confirms API key is valid (`✔ Authenticated as <email>`). |

---

## Adding a New Translatable String

1. **Edit `locales/en.json` only.** Use namespaced dot keys (`subscription.actions.upgrade`), not flat strings. Group by feature.
2. **Use `{{var}}` for interpolation** — `react-i18next`-compatible. ICU plural and selector syntax also supported.
3. **Run `bun run i18n:translate`** — Lingo translates the new key in parallel across all 10 locales (~5–10 sec for typical additions, cached afterwards).
4. **Run `bun run i18n:validate`** — must exit 0 before committing.
5. **In components**, replace the literal:
   ```tsx
   import { useTranslation } from "react-i18next";
   const { t } = useTranslation();
   <h1>{t("subscription.actions.upgrade", { plan: plan.name })}</h1>
   ```

**Always commit `en.json` + all target locales together.** A commit with only `en.json` leaves CI broken on `i18n:validate`.

---

## Renaming or Deleting Keys

```bash
# 1. Update en.json
# 2. Translate any renamed keys (new key gets translated, old key becomes orphaned)
bun run i18n:translate

# 3. Remove orphans from target locales
bun run i18n:cleanup

# 4. Confirm
bun run i18n:validate
```

---

## Common Failures

| Symptom | Fix |
|---------|-----|
| `Failed to connect to the API` | Check `~/.lingodotdevrc` has `[auth]\napiKey=lingo_sk_xxx`. Re-run `npx lingo.dev@latest config set auth.apiKey lingo_sk_xxx`. |
| `i18n:validate` reports missing keys | Run `bun run i18n:translate` to fill them, then re-validate. |
| `i18n:validate` reports extra keys in target locale | A key was deleted from `en.json` but not from targets. Run `bun run i18n:cleanup`. |
| Lingo translates a key wrong / changes brand name | Use `_lingo` metadata or `{noTranslate}` markers in the source string. Or override the target locale value manually — Lingo respects existing values unless source changes. |
| CI fails on `i18n:validate` | Almost always missing translations. Run translate locally and re-push. |

---

## Performance Notes

- **First-time translation** of a new key: ~1–2 seconds per locale, parallel.
- **Cache**: Lingo caches per-key per-locale. Re-running `i18n:translate` with no en.json changes is a no-op (`0 processed, all from cache`).
- **Word usage**: Each translation consumes Lingo word credits. `i18n:status` shows estimate before running. Free tier handles small projects; paid tier for production.
- **Bundle size**: All locales ship with the build (eager-loaded in `src/i18n.ts`). For >20 locales or >2000 keys, switch to lazy locale loading.

---

## Why Pre-Translation Beats Runtime

| | Pre-translation (this project) | Runtime translation |
|---|---|---|
| Latency on first paint | 0 — locale JSON is in the bundle | +200–800ms per visit |
| API cost | One-shot per build | Every page load |
| Offline | ✅ Works | ❌ Breaks |
| Translation review | Translators see + edit JSON | Hidden in API |
| Quality control | `i18n:validate` in CI | No safety net |

The tradeoff is bundle size. For VortexCore's 33 keys × 11 locales (~17KB total), it's not measurable. Reassess if locales grow past 5000 keys.

---

## Reusable Template

The starter files for adding this workflow to a new project live at `scripts/templates/lingo-i18n/`. Copy that directory into a new project, set the API key, and you have the same flow running in 5 minutes. See the template's own README for project-specific wiring.
