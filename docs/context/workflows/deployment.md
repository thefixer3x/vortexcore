# Deployment Workflow

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local dev |
| Staging | *.web.app | Supabase staging |
| Production | Custom domain | Live users |

## Frontend Deployment

### Netlify (primary)
```bash
# Build
bun run build

# Deploy (via netlify CLI)
netlify deploy --prod --dir=dist
```

**Config:** `netlify.toml`
- Build command: `bun run build`
- Publish directory: `dist`
- Environment variables via Netlify UI

### Vercel (alternative)
```bash
vercel --prod
```
**Config:** `vercel.json`

### Environment Variables
**Required for production:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OBF_LIVE` (usually false until OBF ready)

## Supabase Edge Functions

### Deploy all functions
```bash
./deploy-functions.sh
```

### Deploy single function
```bash
supabase functions deploy ai-router
supabase functions serve ai-router  # local test
```

### Secrets management
```bash
supabase secrets set OPENAI_API_KEY=xxx
supabase secrets set STRIPE_SECRET_KEY=xxx
# etc.
```

**Required secrets:**
- `OPENAI_API_KEY`
- `PERPLEXITY_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENT_PRICE_ID`
- `ONASIS_GATEWAY_URL`
- `ONASIS_GATEWAY_TOKEN`
- `ALLOWED_ORIGINS` (comma-separated domains)

## Capacitor Mobile

### iOS build
```bash
bunx cap sync ios
bunx cap open ios  # Opens Xcode
```

### Android build
```bash
bunx cap sync android
bunx cap open android  # Opens Android Studio
```

## Database Migrations

### Apply migrations
```bash
# Via Supabase CLI
supabase db push

# Via SQL files
# Run APPLY_MIGRATIONS.sql in Supabase dashboard
```

### Migration files
- `APPLY_MIGRATIONS.sql` — main migration
- `vortexcore_tables_migration.sql` — table creation
- `safe_add_vortexcore_tables.sql` — safe additions

## Post-Deployment Checklist

- [ ] Verify environment variables set
- [ ] Test auth flow (login/logout)
- [ ] Test AI chat functionality
- [ ] Verify Stripe webhook endpoint reachable
- [ ] Check browser console for errors
- [ ] Monitor error tracking (Sentry if configured)