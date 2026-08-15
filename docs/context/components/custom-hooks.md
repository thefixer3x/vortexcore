# Custom Hooks Context

## Data Fetching Hooks

### useDashboardData
**File:** `src/hooks/use-dashboard-data.ts`

Fetches user dashboard data:
```typescript
{
  wallets: DashboardWallet[],    // from vortex_wallets
  transactions: DashboardTransaction[],  // from vortex_transactions
  profile: DashboardProfile | null,
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>
}
```

- Queries `vortex_wallets` and `vortex_transactions` by `user_id`
- Normalizes amount fields (handles string/number)
- Returns empty arrays when no user

### useOBFAccounts / useOBFTransactions
**File:** `src/hooks/use-obf-accounts.ts`

See `obf-components.md` for details.

## Analytics Hooks

### useAnalytics
**File:** `src/hooks/use-analytics.tsx` (5.4K)

Event tracking:
- `trackEvent(name, properties)`
- `trackPageView(path)`
- Sends to analytics backend

## Auth Hooks

### useAuthProviders
**File:** `src/hooks/use-auth-providers.ts` (3.2K)

See `auth-components.md` for details.

### useBiometrics
**File:** `src/hooks/use-biometrics.ts` (2.0K)

WebAuthn integration:
- `isSupported` — device supports biometrics
- `authenticate()` — trigger biometric prompt
- `register()` — register new credential

## UI Hooks

### useToast
**File:** `src/hooks/use-toast.ts` (3.8K)

Toast notifications:
```typescript
const { toasts, toast } = useToast()
toast({ title: "Success", description: "Done" })
```

### useMobile
**File:** `src/hooks/use-mobile.tsx` (565B)

Device detection:
```typescript
const isMobile = useMobile()
// true if viewport < 768px or user agent matches mobile
```

### useLocation
**File:** `src/hooks/use-location.ts` (2.3K)

Geolocation:
- `getCurrentPosition()` — returns lat/lng
- `permissionStatus` — granted/denied/prompt

## Translation Hook

### useTranslation (i18n)
**File:** `src/hooks/useTranslation.ts` (275B)

Light wrapper around react-i18next:
```typescript
const { t, i18n } = useTranslation()
// i18n.changeLanguage('es') to switch locale
```

Locale files in `locales/` directory, managed via Lingo pipeline.