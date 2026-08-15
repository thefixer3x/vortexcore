# Lingo.dev i18n Starter — Reusable Template

Drop this into a new React/Vite/Next/Bun project to get a Lingo.dev pre-translation pipeline + i18next runtime + key-coverage CI guard, all wired together.

**What you get:**
- `i18n.json` — Lingo CLI config (source `en`, 10 target locales)
- `locales/en.json` — minimal starter key set
- `validate-translations.js` — flattens nested keys, validates parity across locales, exits non-zero on drift
- Drop-in `package.json` script block
- Minimal i18next bootstrap (`i18n.ts`)
- A `useTranslation` re-export hook

---

## 5-Minute Setup

```bash
# From the repo root of your new project:
cp -R path/to/this/template/. ./

# Install runtime deps
bun add i18next react-i18next i18next-browser-languagedetector

# Authenticate Lingo CLI (one-time, per developer)
npx lingo.dev@latest config set auth.apiKey lingo_sk_xxx
npx lingo.dev@latest auth   # → ✔ Authenticated as <email>

# Merge the scripts block from package.json.scripts.snippet into your real package.json
# (or copy the four lines manually)

# First translation pass
bun run i18n:translate

# Verify parity
bun run i18n:validate
```

Then in your app entry (`main.tsx` / `app.tsx`):
```ts
import "./i18n";   // before the first useTranslation() call anywhere
```

In any component:
```tsx
import { useTranslation } from "react-i18next";
const { t } = useTranslation();
return <h1>{t("app.name")}</h1>;
```

---

## Files in this Template

| File | Move to | Purpose |
|------|---------|---------|
| `i18n.json` | repo root | Lingo CLI config |
| `locales/en.json` | repo root | Source-of-truth keys |
| `validate-translations.js` | `scripts/` | Coverage validator (ESM, no deps) |
| `i18n.ts` | `src/` | i18next runtime bootstrap |
| `useTranslation.ts` | `src/hooks/` (optional) | Convenience re-export |
| `package.json.scripts.snippet` | merge into root `package.json` | npm scripts |
| `.env.example` | repo root | Documents `LINGO_API_KEY` env var |

---

## Daily Flow

1. Add new keys to `locales/en.json` — namespaced (`feature.subkey.label`), use `{{var}}` for interpolation.
2. `bun run i18n:translate` — Lingo translates to all targets in parallel; cached.
3. `bun run i18n:validate` — must exit 0.
4. `git add locales/*.json && git commit` — always commit en + targets together.

---

## Adding a New Locale

Edit `i18n.json`:
```json
"targets": ["es", "fr", "de", ..., "tr"]
```

And `i18n.ts`:
```ts
import tr from '../locales/tr.json';
const resources = { ..., tr: { translation: tr } };
```

Then `bun run i18n:translate` populates `locales/tr.json`. Add `tr` to `validate-translations.js` `languages` array.

---

## CI Recommendation

Add to GitHub Actions / your CI:
```yaml
- run: bun install
- run: bun run i18n:validate    # fails build if any locale missing keys
```

Optional: also run `i18n:translate` in CI on PRs that touch `en.json` and auto-commit the result. Requires `LINGO_API_KEY` as repo secret.

---

## Why Lingo + Pre-Translation

- **Zero runtime cost** — locale JSON ships in the bundle.
- **Cached** — re-running translate when nothing changed is a no-op.
- **CI-safe** — drift in any locale fails the build.
- **Reviewable** — translators or PMs can edit JSON directly without code.

For projects with >5000 keys × >20 locales, switch to lazy locale loading; this starter assumes eager loading is fine.

---

## License / Reuse

This template is part of the VortexCore project — copy freely into other Lan-Onasis or personal projects. Update the source `en.json` to match the new app and you're set.
