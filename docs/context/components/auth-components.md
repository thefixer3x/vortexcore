# Auth Components Context

**Purpose:** Authentication UI with multiple methods (email/password, biometric, social, 2FA)

## Components

### LoginForm
**File:** `src/components/auth/LoginForm.tsx` (5.8K)

Main login container:
- Combines EmailPasswordFields, SocialLoginButtons, LoginFormFooter
- Handles form submission to Supabase Auth
- Redirects on success to original destination

### EmailPasswordFields
**File:** `src/components/auth/EmailPasswordFields.tsx` (2.7K)

Email + password input fields with validation

### SocialLoginButtons
**File:** `src/components/auth/SocialLoginButtons.tsx` (3.2K)

OAuth providers:
- Google, GitHub, Apple (configured in Supabase)
- Links to Supabase OAuth endpoints

### EnhancedBiometricAuth
**File:** `src/components/auth/EnhancedBiometricAuth.tsx` (10.8K)

Biometric authentication:
- WebAuthn/FIDO2 for device authentication
- Supports platform authenticators (TouchID, FaceID)
- Fallback to device passcode

### BiometricAuthButton
**File:** `src/components/auth/BiometricAuthButton.tsx` (1.1K)

Standalone biometric trigger button

### TwoFactorAuthForm
**File:** `src/components/auth/TwoFactorAuthForm.tsx` (5.9K)

2FA verification:
- TOTP code input (6 digits)
- Backup codes support
- Trust device option

### AuthCallbackHandler
**File:** `src/components/auth/AuthCallbackHandler.tsx` (2.0K)

OAuth callback processor:
- Handles `?code=` or `?error=` from OAuth providers
- Exchanges code for session
- Navigates to original destination

## Context

### useAuth hook
**File:** `src/hooks/use-auth-providers.ts` (3.2K)

Auth state management:
- `user` — Supabase auth user
- `signIn()`, `signOut()`, `signUp()`
- `refreshSession()`

## Supabase Auth Integration

- Uses `@supabase/supabase-js` client
- Auth state via `@supabase/auth-helpers-react`
- JWT stored in httpOnly cookie (via Supabase middleware)
- `AUTH_CALLBACK_URL` env var for OAuth redirect