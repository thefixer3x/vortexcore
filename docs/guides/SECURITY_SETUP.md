# 🔒 Security Setup Guide

## GitHub Repository Secrets (Recommended)

### Why This is Safer:
- ✅ **No secrets in codebase** — avoid accidental commits
- ✅ **Scoped management** — admins can manage (not view) secrets; values are write-only
- ✅ **Governance** — use Environments with required reviewers and protected branches
- ✅ **Environment isolation** — separate secrets for dev/preview/prod
- ✅ **Automatic injection** — CI/CD receives masked env vars; logs redact values
### Required Repository Secrets:

Go to: `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions`
(Replace YOUR_ORG and YOUR_REPO with your actual GitHub organization and repository names, or navigate via GitHub → Repository → Settings → Secrets → Actions)

## Local Development

For local development, keep the `.env` file but:
1. **Never commit it** (already in .gitignore)
2. Use `.env.example` to share structure with team
3. Each developer creates their own `.env`

## Production Deployment

The GitHub Actions workflow will:
1. Inject secrets as environment variables
2. Build with proper configuration
3. Deploy securely to Vercel

## Team Access

- **Repository secrets**: Only admins can manage (add, update, delete) secrets; their values are write-only and cannot be viewed by anyone (including admins) after creation.
- **Local .env**: Each developer manages their own
- Enable repository-level secret scanning and push protection: Turn on GitHub secret scanning (or integrate an equivalent third‑party scanner) and enforce push protection/pre‑receive hooks to block commits containing secrets.
- Archived history is not a safe place for secrets: Any detected secrets must be rotated immediately and an incident noted; do not rely on archives or git history for access or distribution.
