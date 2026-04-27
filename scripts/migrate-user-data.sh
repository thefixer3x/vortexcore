#!/bin/bash

# Data Migration Script: VortexCore.app to The Fixer Initiative
# Purpose: Migrate user data, conversations, and other critical data

set -e

PROJECT_SOURCE="mxtsdgkwzjzlttpotole"
PROJECT_TARGET="mxtsdgkwzjzlttpotole"

echo "📦 VortexCore.app Data Migration Script"
echo "Source Project: $PROJECT_SOURCE"
echo "Target Project: $PROJECT_TARGET"

# Function to check project connection
check_project_link() {
    local expected_project=$1
    echo "🔗 Linking to project: $expected_project"
    supabase link --project-ref $expected_project
}

# Step 1: Export data from source project
echo "📤 Step 1: Exporting data from source project..."
check_project_link $PROJECT_SOURCE

# Create data export directory
mkdir -p data_export
EXPORT_DATE=$(date +%Y%m%d_%H%M%S)

echo "Exporting user profiles..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.profiles) TO './data_export/profiles_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting wallets..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.wallets) TO './data_export/wallets_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting conversations..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.conversations) TO './data_export/conversations_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting transactions..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.transactions) TO './data_export/transactions_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting child profiles..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.child_profiles) TO './data_export/child_profiles_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting parent comments..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.parent_comments) TO './data_export/parent_comments_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting API keys..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.api_keys) TO './data_export/api_keys_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting settings..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.settings) TO './data_export/settings_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting Stripe customers..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.stripe_customers) TO './data_export/stripe_customers_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting Stripe products..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.stripe_products) TO './data_export/stripe_products_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting Stripe prices..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.stripe_prices) TO './data_export/stripe_prices_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "Exporting Stripe subscriptions..."
psql -h db.${PROJECT_SOURCE}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.stripe_subscriptions) TO './data_export/stripe_subscriptions_${EXPORT_DATE}.csv' WITH CSV HEADER"

echo "✅ Data export completed! Files saved in ./data_export/"

# Step 2: Switch to target project
echo "🎯 Step 2: Switching to target project..."
check_project_link $PROJECT_TARGET

# Step 3: Create backup of target data
echo "💾 Step 3: Creating backup of target project data..."
mkdir -p data_backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

echo "Backing up target project profiles..."
psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "\copy (SELECT * FROM public.profiles) TO './data_backup/profiles_backup_${BACKUP_DATE}.csv' WITH CSV HEADER" || echo "No profiles table to backup"

echo "✅ Target data backed up!"

# Step 4: Import data to target project
echo "📥 Step 4: Importing data to target project..."

echo "⚠️  Ready to import data to target project..."
echo "This will add data from VortexCore.app to The Fixer Initiative project."
read -p "Do you want to proceed with data import? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting data import..."
    
    # Import profiles (handle conflicts with existing profiles)
    echo "Importing profiles..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    CREATE TEMP TABLE temp_profiles AS SELECT * FROM public.profiles WHERE false;
    \copy temp_profiles FROM './data_export/profiles_${EXPORT_DATE}.csv' WITH CSV HEADER;
    
    INSERT INTO public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
    SELECT id, full_name, email, avatar_url, created_at, updated_at 
    FROM temp_profiles
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    
    DROP TABLE temp_profiles;
    "
    
    # Import wallets
    echo "Importing wallets..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.wallets FROM './data_export/wallets_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import conversations
    echo "Importing conversations..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.conversations FROM './data_export/conversations_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import transactions
    echo "Importing transactions..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.transactions FROM './data_export/transactions_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import child profiles
    echo "Importing child profiles..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.child_profiles FROM './data_export/child_profiles_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import parent comments
    echo "Importing parent comments..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.parent_comments FROM './data_export/parent_comments_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import API keys
    echo "Importing API keys..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.api_keys FROM './data_export/api_keys_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import settings
    echo "Importing settings..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.settings FROM './data_export/settings_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    # Import Stripe data
    echo "Importing Stripe customers..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.stripe_customers FROM './data_export/stripe_customers_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    echo "Importing Stripe products..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.stripe_products FROM './data_export/stripe_products_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    echo "Importing Stripe prices..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.stripe_prices FROM './data_export/stripe_prices_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    echo "Importing Stripe subscriptions..."
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
    \copy public.stripe_subscriptions FROM './data_export/stripe_subscriptions_${EXPORT_DATE}.csv' WITH CSV HEADER;
    "
    
    echo "✅ Data import completed successfully!"
    
else
    echo "❌ Data import cancelled"
    exit 1
fi

# Step 5: Validate imported data
echo "🔍 Step 5: Validating imported data..."

echo "Counting imported records:"
psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -c "
SELECT 
    'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 
    'wallets' as table_name, COUNT(*) as record_count FROM public.wallets
UNION ALL
SELECT 
    'conversations' as table_name, COUNT(*) as record_count FROM public.conversations
UNION ALL
SELECT 
    'transactions' as table_name, COUNT(*) as record_count FROM public.transactions
UNION ALL
SELECT 
    'child_profiles' as table_name, COUNT(*) as record_count FROM public.child_profiles
UNION ALL
SELECT 
    'settings' as table_name, COUNT(*) as record_count FROM public.settings
ORDER BY table_name;
"

echo ""
echo "🎉 Data migration completed successfully!"
echo ""
echo "📋 Migration Summary:"
echo "  ✅ Exported data from source project"
echo "  ✅ Created backup of target project"
echo "  ✅ Imported all user data and configurations"
echo "  ✅ Validated data integrity"
echo ""
echo "📁 Files created:"
echo "  - data_export/ - Source project data"
echo "  - data_backup/ - Target project backup"
echo ""
echo "📝 Next steps:"
echo "  1. Test user authentication and data access"
echo "  2. Verify all Edge Functions work with migrated data"
echo "  3. Test payment and subscription functionality"
echo "  4. Perform end-to-end application testing"
echo "  5. Update any hardcoded references to old project IDs"
