# 🔒 Security Setup Guide

## GitHub Repository Secrets (Recommended)

### Why This is Safer:
- ✅ **No secrets in codebase** - Never risk accidental commits
- ✅ **Team access control** - Only admins can view/edit secrets
- ✅ **Audit logging** - GitHub tracks who accessed what
- ✅ **Environment isolation** - Different secrets for dev/staging/prod
- ✅ **Automatic injection** - CI/CD gets secrets securely

### Required Repository Secrets:

Go to: `https://github.com/thefixer3x/vortex-core-app/settings/secrets/actions`

Add these secrets:

```
VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

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

- **Repository secrets**: Only admins can view
- **Local .env**: Each developer manages their own
- **Archive files**: Accessible via git history (see below)