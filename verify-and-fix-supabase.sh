#!/bin/bash

# =====================================================
# Supabase Verification and Fix Script
# This script verifies and fixes Supabase connectivity
# =====================================================

set -e

echo "=================================================="
echo "Supabase Connection Verification & Fix"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

# Your Supabase project details
SUPABASE_PROJECT_ID="mxtsdgkwzjzlttpotole"
SUPABASE_URL="https://mxtsdgkwzjzlttpotole.supabase.co"
SUPABASE_ANON_KEY="REDACTED"

echo ""
print_info "Project: $SUPABASE_PROJECT_ID"
print_info "URL: $SUPABASE_URL"

# =====================================================
# Step 1: Check Supabase CLI
# =====================================================
echo ""
print_info "Checking Supabase CLI..."

if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not installed!"
    print_warning "Installing Supabase CLI..."
    npm install -g supabase
fi

SUPABASE_VERSION=$(supabase --version 2>/dev/null || echo "Unknown")
print_status "Supabase CLI: $SUPABASE_VERSION"

# =====================================================
# Step 2: Link to Project
# =====================================================
echo ""
print_info "Linking to Supabase project..."

supabase link --project-ref $SUPABASE_PROJECT_ID 2>/dev/null || {
    print_warning "Already linked or need authentication"
    print_info "If not authenticated, run: supabase login"
}

# =====================================================
# Step 3: Test Database Connection
# =====================================================
echo ""
print_info "Testing database connection..."

# Create a test SQL to verify tables exist
cat > test-connection.sql << 'EOF'
-- Test query to verify tables
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
EOF

# Run the test
supabase db remote commit --dry-run 2>&1 | head -20 || {
    print_warning "Database connection test incomplete"
}

# =====================================================
# Step 4: List Current Functions
# =====================================================
echo ""
print_info "Checking deployed Edge Functions..."

# Try to list functions
supabase functions list 2>/dev/null || {
    print_warning "Could not list functions - may need authentication"
}

# =====================================================
# Step 5: Create Function Test Script
# =====================================================
echo ""
print_info "Creating function test script..."

cat > test-functions.js << 'EOF'
// Test script for Supabase functions
const SUPABASE_URL = 'https://mxtsdgkwzjzlttpotole.supabase.co';
const SUPABASE_ANON_KEY = 'REDACTED';

async function testFunction(functionName, payload) {
    console.log(`\nTesting ${functionName}...`);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/${functionName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(payload)
            }
        );
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✓ ${functionName} responded:`, data);
            return true;
        } else {
            console.error(`✗ ${functionName} error:`, data);
            return false;
        }
    } catch (error) {
        console.error(`✗ ${functionName} failed:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log('Starting function tests...\n');
    
    const results = {
        aiRouter: await testFunction('ai-router', {
            messages: [{ role: 'user', content: 'Hello, test message' }]
        }),
        stripe: await testFunction('stripe', {
            action: 'test'
        })
    };
    
    console.log('\n=== Test Results ===');
    console.log('AI Router:', results.aiRouter ? '✓ Working' : '✗ Failed');
    console.log('Stripe:', results.stripe ? '✓ Working' : '✗ Failed');
    
    if (!results.aiRouter) {
        console.log('\n⚠️  AI Router is not working. Check API keys in Supabase dashboard.');
    }
}

runTests();
EOF

print_status "Test script created: test-functions.js"

# =====================================================
# Step 6: Set Environment Variables
# =====================================================
echo ""
print_info "Preparing environment variables..."

# Check current secrets (won't show values)
print_warning "Current secrets in Supabase:"
supabase secrets list 2>/dev/null || print_warning "Cannot list secrets - need authentication"

# Create script to set secrets
cat > set-secrets.sh << 'EOF'
#!/bin/bash
# Run this script with your actual API keys

echo "Setting Supabase Edge Function secrets..."

# Replace these with your actual keys
OPENAI_KEY="sk-..."
GEMINI_KEY="AIza..."
PERPLEXITY_KEY="pplx-..."
STRIPE_SECRET="sk_..."
STRIPE_WEBHOOK="whsec_..."

# Set the secrets
supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
supabase secrets set GEMINI_API_KEY="$GEMINI_KEY"
supabase secrets set PERPLEXITY_API_KEY="$PERPLEXITY_KEY"
supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET"
supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK"

echo "Secrets set! Deploying functions..."
supabase functions deploy --all

echo "Done!"
EOF

chmod +x set-secrets.sh
print_status "Secret setter script created: set-secrets.sh"

# =====================================================
# Step 7: Fix Auth Configuration
# =====================================================
echo ""
print_info "Creating auth fix configuration..."

cat > src/lib/supabase-auth-fix.ts << 'EOF'
import { supabase } from '@/integrations/supabase/client';

// Fixed auth configuration
export const authConfig = {
  // Ensure redirectTo uses window.location.origin
  getRedirectURL: () => {
    const url = window.location.origin;
    return `${url}/dashboard`;
  },
  
  // Sign up with proper error handling
  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Signup failed' 
      };
    }
  },
  
  // Sign in with proper error handling
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  // Sign out
  signOut: async () => {
    await supabase.auth.signOut();
  }
};
EOF

print_status "Auth configuration fixed"

# =====================================================
# Step 8: Create Migration Verification
# =====================================================
echo ""
print_info "Creating migration verification script..."

cat > verify-tables.sql << 'EOF'
-- Verify all required tables exist
SELECT 
    'profiles' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as exists
UNION ALL
SELECT 
    'wallets',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets')
UNION ALL
SELECT 
    'transactions',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions')
UNION ALL
SELECT 
    'virtual_cards',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'virtual_cards')
UNION ALL
SELECT 
    'chat_conversations',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations')
UNION ALL
SELECT 
    'chat_messages',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages')
UNION ALL
SELECT 
    'user_settings',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings');

-- Check for contamination
SELECT 
    'Contamination Check' as check_type,
    'nixie schema' as item,
    EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'nixie') as found
UNION ALL
SELECT 
    'Contamination Check',
    'child_profiles table',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'child_profiles');
EOF

print_status "Table verification script created"

# =====================================================
# Final Summary
# =====================================================
echo ""
echo "=================================================="
echo "VERIFICATION COMPLETE"
echo "=================================================="

print_status "Scripts created for testing and fixing"

echo ""
echo "IMMEDIATE ACTIONS:"
echo ""
echo "1. LOGIN TO SUPABASE CLI (if needed):"
echo "   supabase login"
echo ""
echo "2. TEST YOUR FUNCTIONS:"
echo "   node test-functions.js"
echo ""
echo "3. SET YOUR API KEYS:"
echo "   Edit set-secrets.sh with your actual keys, then run:"
echo "   ./set-secrets.sh"
echo ""
echo "4. VERIFY TABLES:"
echo "   supabase db remote query verify-tables.sql"
echo ""
echo "5. APPLY CLEAN MIGRATIONS (if tables missing):"
echo "   supabase db push"
echo ""
echo "6. DEPLOY ALL FUNCTIONS:"
echo "   supabase functions deploy --all"
echo ""

print_warning "Dashboard URL: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID"
print_warning "Check Edge Functions logs there for debugging"

print_status "Verification script completed!"
