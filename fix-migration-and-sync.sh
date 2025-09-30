#!/bin/bash

# =====================================================
# VortexCore Migration Fix and Sync Script
# This script helps clean up contaminated migrations
# and sync with Supabase properly
# =====================================================

set -e  # Exit on error

echo "=================================================="
echo "VortexCore Migration Cleanup and Sync"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Step 1: Backup current state
print_status "Creating backup of current migrations..."
mkdir -p .backup/migrations_$(date +%Y%m%d_%H%M%S)
cp -r supabase/migrations/* .backup/migrations_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r .bolt/supabase_discarded_migrations/* .backup/migrations_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Step 2: Clean contaminated migrations
print_warning "Removing contaminated migration files..."

# Remove the contaminated vortexcore tables migration with nixie schema
if [ -f ".bolt/supabase_discarded_migrations/20250609002800_add_vortexcore_tables.sql" ]; then
    print_status "Removing contaminated vortexcore migration with nixie schema..."
    rm ".bolt/supabase_discarded_migrations/20250609002800_add_vortexcore_tables.sql"
fi

# Step 3: Restore legitimate migrations
print_status "Organizing legitimate migrations..."

# Move the chat tables migration to active migrations
if [ -f ".bolt/supabase_discarded_migrations/20250530182754_create_chat_tables.sql" ]; then
    print_status "Restoring chat tables migration..."
    mv ".bolt/supabase_discarded_migrations/20250530182754_create_chat_tables.sql" \
       "supabase/migrations/20250530182754_create_chat_tables.sql"
fi

# Step 4: Check Supabase connection
print_status "Checking Supabase connection..."
if command -v supabase &> /dev/null; then
    echo "Supabase CLI found"
    
    # Check if we're linked to a project
    if supabase status 2>/dev/null | grep -q "Linked project:"; then
        print_status "Supabase project is linked"
        
        # Get current migration status
        echo ""
        print_warning "Current remote migrations:"
        supabase db remote list || true
        
    else
        print_warning "Supabase project not linked. Run: supabase link --project-ref YOUR_PROJECT_ID"
    fi
else
    print_warning "Supabase CLI not found. Install with: npm install -g supabase"
fi

# Step 5: Display migration order
echo ""
print_status "Recommended migration order:"
echo "1. 20250530182754_create_chat_tables.sql - Chat functionality"
echo "2. 20250613211653_solitary_limit.sql - Virtual cards (Stripe)"
echo "3. 20250928_clean_vortex_core_tables.sql - Clean VortexCore tables (NEW)"

# Step 6: Git status check
echo ""
print_status "Git status:"
if [ -d ".git" ]; then
    # Check if we're in the middle of a revert
    if [ -f ".git/REVERT_HEAD" ]; then
        print_warning "You are in the middle of a revert operation!"
        echo "Options:"
        echo "  1. Complete the revert: git revert --continue"
        echo "  2. Abort the revert: git revert --abort"
        echo ""
    fi
    
    # Show current branch info
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    # Check if behind remote
    BEHIND=$(git rev-list --count HEAD..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt 0 ]; then
        print_warning "Your branch is $BEHIND commits behind origin/$CURRENT_BRANCH"
    fi
fi

# Step 7: Create summary report
echo ""
print_status "Creating migration summary report..."
cat > MIGRATION_FIX_SUMMARY.md << 'EOF'
# VortexCore Migration Fix Summary

## Date: $(date +"%Y-%m-%d %H:%M:%S")

## Issues Identified
1. **Contaminated Migration**: `20250609002800_add_vortexcore_tables.sql` contained:
   - `nixie` schema (from another project)
   - `child_profiles` table (not part of VortexCore)
   - Mixed concerns from different projects

2. **Git Status**: Branch is 25 commits behind origin/main

3. **Stripe Integration**: Virtual cards implementation is intact in:
   - `/src/lib/stripe.ts`
   - `/src/services/virtualCardService.ts`
   - `/supabase/functions/stripe/`
   - `/supabase/functions/stripe-webhook/`

## Actions Taken
1. Backed up all existing migrations
2. Removed contaminated migration file
3. Created clean migration: `20250928_clean_vortex_core_tables.sql`
4. Restored legitimate chat tables migration

## Clean Migration Includes
- ✅ Profiles and user management
- ✅ Wallets and transactions
- ✅ Stripe virtual cards
- ✅ Chat conversations and messages
- ✅ User settings
- ✅ Proper RLS policies
- ✅ Indexes for performance
- ❌ No `nixie` schema
- ❌ No `child_profiles` table
- ❌ No contamination from other projects

## Next Steps
1. **Resolve Git status**:
   ```bash
   # Abort the current revert
   git revert --abort
   
   # Stash local changes
   git stash
   
   # Update from remote
   git fetch origin
   git checkout main
   git pull origin main
   
   # Apply stashed changes
   git stash pop
   ```

2. **Apply migrations to Supabase**:
   ```bash
   # Link to your project (if not already linked)
   supabase link --project-ref YOUR_PROJECT_ID
   
   # Push migrations
   supabase db push
   
   # Or apply individually:
   supabase db push --include 20250530182754_create_chat_tables.sql
   supabase db push --include 20250613211653_solitary_limit.sql
   supabase db push --include 20250928_clean_vortex_core_tables.sql
   ```

3. **Verify Stripe integration**:
   - Ensure environment variables are set in Supabase dashboard
   - Test virtual card creation endpoint
   - Verify webhook endpoints

## Environment Variables Required
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` (in Supabase Edge Functions)
- `STRIPE_WEBHOOK_SECRET` (for webhooks)

## Testing Checklist
- [ ] User authentication works
- [ ] Profiles are created on signup
- [ ] Wallets are initialized
- [ ] Chat conversations can be created
- [ ] Virtual cards can be created (Stripe)
- [ ] Transactions are recorded
- [ ] Settings can be saved/retrieved
EOF

print_status "Summary report created: MIGRATION_FIX_SUMMARY.md"

# Step 8: Final recommendations
echo ""
echo "=================================================="
echo "RECOMMENDATIONS:"
echo "=================================================="
echo ""
echo "1. IMMEDIATE: Resolve the git revert operation:"
echo "   git revert --abort  # To cancel the revert"
echo ""
echo "2. SYNC WITH REMOTE:"
echo "   git fetch origin"
echo "   git pull origin main  # This will fast-forward"
echo ""
echo "3. APPLY CLEAN MIGRATIONS:"
echo "   supabase db push"
echo ""
echo "4. TEST STRIPE INTEGRATION:"
echo "   - Check src/lib/stripe.ts"
echo "   - Verify environment variables"
echo "   - Test virtual card creation"
echo ""
print_status "Script completed successfully!"
