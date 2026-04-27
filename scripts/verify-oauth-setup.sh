#!/bin/bash

# OAuth Provider Verification Script
# This script checks the OAuth provider configuration in Supabase

echo "🔍 OAuth Provider Configuration Verification"
echo "=========================================="

PROJECT_REF="mxtsdgkwzjzlttpotole"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(supabase projects api-keys --project-ref $PROJECT_REF | grep anon | awk '{print $3}')

if [ -z "$ANON_KEY" ]; then
    echo "❌ Could not retrieve Supabase anon key"
    exit 1
fi

echo "✅ Retrieved Supabase configuration"
echo "   Project URL: $SUPABASE_URL"
echo ""

echo "📋 Checking available OAuth providers..."
echo "   Note: This requires manual verification in the Supabase dashboard"
echo "   under Authentication → Providers"
echo ""

echo "🧪 Testing OAuth endpoint accessibility..."
curl -s -H "apikey: $ANON_KEY" "${SUPABASE_URL}/auth/v1/settings" > /tmp/auth_settings.json

if [ -f /tmp/auth_settings.json ] && [ -s /tmp/auth_settings.json ]; then
    echo "✅ Auth settings endpoint is accessible"
    # Clean up
    rm /tmp/auth_settings.json
else
    echo "❌ Auth settings endpoint is not accessible"
    echo "   Please check your Supabase project configuration"
fi

echo ""
echo "🔐 OAuth Providers That Should Be Configured:"
echo "   1. Google"
echo "   2. Instagram" 
echo "   3. Twitter"
echo "   4. LinkedIn (OIDC)"
echo ""
echo "📋 To verify these providers are properly configured:"
echo "   1. Go to your Supabase dashboard"
echo "   2. Navigate to Authentication → Providers"
echo "   3. Ensure each provider is enabled"
echo "   4. Check that Client IDs and Secrets are properly set"
echo "   5. Verify redirect URLs include:"
echo "      https://${PROJECT_REF}.supabase.co/auth/v1/callback"
echo ""
echo "🧪 To test OAuth functionality:"
echo "   1. Run your application locally: bun run dev"
echo "   2. Navigate to the login page"
echo "   3. Try signing in with each provider"
echo "   4. Check browser console for any errors"
echo ""
echo "✅ Verification Complete"
echo "Please manually verify each provider in the Supabase dashboard."