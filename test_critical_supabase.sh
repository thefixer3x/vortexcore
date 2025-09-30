#!/bin/bash

echo "🧪 Critical Supabase Function Tests"
echo "=================================="

# Test 1: Database connectivity
echo "1. Testing database connectivity..."
supabase db remote query "SELECT 'Database OK' as status;" || echo "❌ Database connection failed"

# Test 2: Auth system
echo "2. Testing auth system..."
supabase db remote query "SELECT COUNT(*) as user_count FROM auth.users;" || echo "❌ Auth system access failed"

# Test 3: Profiles table
echo "3. Testing profiles table..."
supabase db remote query "SELECT COUNT(*) as profile_count FROM public.profiles;" || echo "❌ Profiles table access failed"

# Test 4: Wallets table
echo "4. Testing wallets table..."
supabase db remote query "SELECT COUNT(*) as wallet_count FROM public.wallets;" || echo "❌ Wallets table access failed"

# Test 5: Edge functions
echo "5. Testing Edge functions..."
supabase functions list || echo "❌ Edge functions access failed"

echo ""
echo "✅ Critical tests complete!"
echo "📊 Full report available in: $SUPABASE_REPORT"
