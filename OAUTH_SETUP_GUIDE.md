# OAuth Provider Setup Guide for VortexCore

This guide will help you configure all OAuth providers for your VortexCore application.

## Available OAuth Providers

Based on the application code, the following OAuth providers are implemented:
1. Google
2. Instagram
3. Twitter
4. LinkedIn (using OIDC)
5. Email (built-in)

## Prerequisites

1. Access to your Supabase project dashboard
2. Access to developer accounts for each OAuth provider
3. Your application's domain (e.g., https://your-app.vercel.app)

## Configuration Steps

### 1. Google OAuth Setup

#### Supabase Configuration:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find "Google" and enable it
4. Set the following values:
   - Client ID: [Your Google OAuth Client ID]
   - Secret: [Your Google OAuth Client Secret]
   - Redirect URLs: 
     - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     - http://localhost:3000/** (for local development)

#### Google Developer Console:
1. Go to https://console.developers.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → OAuth consent screen
5. Set up the OAuth consent screen with your app information
6. Go to Credentials → Create Credentials → OAuth client ID
7. Select "Web application"
8. Add authorized redirect URIs:
   - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   - http://localhost:3000/** (for local development)
9. Save and copy the Client ID and Client Secret

### 2. Instagram OAuth Setup

#### Supabase Configuration:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find "Instagram" and enable it
4. Set the following values:
   - Client ID: [Your Instagram App Client ID]
   - Secret: [Your Instagram App Client Secret]
   - Redirect URLs:
     - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback

#### Instagram Developer Portal:
1. Go to https://developers.facebook.com/
2. Create a new app or select an existing one
3. Add "Instagram Basic Display" product
4. In the product settings, add your app domain and redirect URLs:
   - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
5. Save and copy the Client ID and Client Secret

### 3. Twitter OAuth Setup

#### Supabase Configuration:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find "Twitter" and enable it
4. Set the following values:
   - Client ID: [Your Twitter App Client ID]
   - Secret: [Your Twitter App Client Secret]
   - Redirect URLs:
     - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback

#### Twitter Developer Portal:
1. Go to https://developer.twitter.com/
2. Create a new app or select an existing one
3. In the app settings, set the Callback URI:
   - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
4. Enable "Request email address from users" if needed
5. Save and copy the API Key and API Secret

### 4. LinkedIn OAuth Setup

#### Supabase Configuration:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find "LinkedIn OIDC" and enable it
4. Set the following values:
   - Client ID: [Your LinkedIn App Client ID]
   - Secret: [Your LinkedIn App Client Secret]
   - Redirect URLs:
     - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback

#### LinkedIn Developer Portal:
1. Go to https://www.linkedin.com/developers/
2. Create a new app or select an existing one
3. In the "Auth" tab, add redirect URLs:
   - https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
4. Make sure to request the necessary scopes (r_liteprofile, r_emailaddress)
5. Save and copy the Client ID and Client Secret

## Testing OAuth Providers

After configuring all providers, test them using the following steps:

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Navigate to your login page
3. Try signing in with each provider
4. Check the browser console for any errors
5. Verify that users are properly redirected after authentication

## Troubleshooting Common Issues

### 1. Redirect URI Mismatch
- Ensure all redirect URIs in the OAuth provider dashboards exactly match what's configured in Supabase
- Include both production and development URLs

### 2. CORS Errors
- Make sure your application domain is whitelisted in the OAuth provider settings
- Check that the Supabase project settings allow your domain

### 3. Invalid Client ID/Secret
- Double-check that you've copied the correct credentials
- Make sure you're using the correct environment (development vs. production)

### 4. Scopes Not Authorized
- Ensure you've requested the necessary scopes in your OAuth provider settings
- Common scopes: profile, email, openid

## Environment Variables

Make sure the following environment variables are set in your deployment environment:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Verification Script

You can use this script to verify your OAuth setup:

```bash
#!/bin/bash

echo "Verifying OAuth provider setup..."

PROJECT_REF="mxtsdgkwzjzlttpotole"
PROVIDERS=("google" "instagram" "twitter" "linkedin_oidc")

for provider in "${PROVIDERS[@]}"; do
  echo "Testing $provider..."
  # This would require actual user interaction to test fully
  echo "  - Configuration check: [Manual verification required]"
  echo "  - Redirect URL: https://$PROJECT_REF.supabase.co/auth/v1/callback"
  echo ""
done

echo "OAuth setup verification complete."
echo "Please manually test each provider through the application interface."
```

## Next Steps

1. Test all OAuth providers through your application
2. Monitor authentication logs in Supabase dashboard
3. Set up proper error handling for failed authentications
4. Implement refresh token handling if needed