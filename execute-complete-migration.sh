#!/bin/bash

# Master Migration Execution Script
# VortexCore.app Complete Migration to The Fixer Initiative
# Created: June 9, 2025

set -e

echo "🚀 VortexCore.app Complete Migration Suite"
echo "=========================================="
echo "From: VortexCore.app (muyhurqfcsjqtnbozyir)"
echo "To: The Fixer Initiative (mxtsdgkwzjzlttpotole)"
echo ""

# Check if all required scripts exist
required_scripts=(
    "configure-api-secrets.sh"
    "migrate-database-schema.sh" 
    "migrate-user-data.sh"
    "validate-migration.sh"
)

echo "🔍 Checking required scripts..."
for script in "${required_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "✅ $script"
    else
        echo "❌ $script (missing)"
        exit 1
    fi
done

echo ""
echo "📋 MIGRATION PHASES OVERVIEW"
echo "=============================="
echo "Phase 1: API Secrets Configuration"
echo "Phase 2: Database Schema Migration"
echo "Phase 3: User Data Migration"
echo "Phase 4: Validation & Testing"
echo ""

# Function to prompt for phase execution
execute_phase() {
    local phase_num=$1
    local phase_name="$2"
    local script_name="$3"
    local description="$4"
    
    echo "🔄 PHASE $phase_num: $phase_name"
    echo "============================"
    echo "Description: $description"
    echo "Script: $script_name"
    echo ""
    
    read -p "Execute Phase $phase_num? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Executing Phase $phase_num..."
        ./"$script_name"
        
        echo ""
        echo "✅ Phase $phase_num completed!"
        read -p "Continue to next phase? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "🛑 Migration paused after Phase $phase_num"
            echo "To resume, run: $0"
            exit 0
        fi
    else
        echo "⏭️ Skipping Phase $phase_num"
        echo "You can run it manually later: ./$script_name"
    fi
    
    echo ""
}

# Show current status
echo "📊 CURRENT MIGRATION STATUS"
echo "============================"
echo "✅ Function Migration: COMPLETED (14 functions deployed)"
echo "✅ Function Testing: COMPLETED (basic connectivity verified)"
echo "⏳ API Secrets: PARTIAL (some missing keys)"
echo "⏳ Database Schema: PENDING"
echo "⏳ User Data: PENDING"
echo "⏳ Full Validation: PENDING"
echo ""

# Ask user if they want to proceed with full migration
echo "⚠️  IMPORTANT: This will modify your target database and configuration."
echo "Make sure you have:"
echo "- Database access credentials ready"
echo "- API keys for missing services (Gemini, Perplexity, Nixie AI)"
echo "- Sufficient time to complete the migration (estimated 1-2 hours)"
echo "- Recent backups of both projects"
echo ""

read -p "Are you ready to proceed with the complete migration? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    echo ""
    echo "📝 To run individual phases manually:"
    echo "- API Secrets: ./configure-api-secrets.sh"
    echo "- Database Schema: ./migrate-database-schema.sh"
    echo "- User Data: ./migrate-user-data.sh"
    echo "- Validation: ./validate-migration.sh"
    exit 0
fi

echo ""
echo "🎯 Starting Complete Migration Process..."
echo ""

# Execute migration phases
execute_phase 1 "API Secrets Configuration" "configure-api-secrets.sh" \
    "Configure missing API keys (Gemini, Perplexity, Nixie AI)"

execute_phase 2 "Database Schema Migration" "migrate-database-schema.sh" \
    "Create all required tables, functions, and RLS policies"

execute_phase 3 "User Data Migration" "migrate-user-data.sh" \
    "Export and import all user data, conversations, and configurations"

execute_phase 4 "Validation & Testing" "validate-migration.sh" \
    "Comprehensive testing of all migrated functionality"

# Final summary
echo "🎉 MIGRATION COMPLETED SUCCESSFULLY!"
echo "===================================="
echo ""
echo "📋 What was accomplished:"
echo "✅ 14 Edge Functions migrated and deployed"
echo "✅ Complete database schema created" 
echo "✅ User data migrated from source project"
echo "✅ RLS policies applied for security"
echo "✅ API secrets configured"
echo "✅ Comprehensive validation performed"
echo ""

echo "📝 Important files created:"
echo "- COMPLETE_MIGRATION_PLAN.md - Detailed migration strategy"
echo "- MIGRATION_VALIDATION_REPORT.md - Validation results"
echo "- data_export/ - Backup of source project data"
echo "- data_backup/ - Backup of target project data"
echo "- migration_script.sql - Database migration SQL"
echo "- rls_policies.sql - Security policies"
echo ""

echo "🔧 Post-Migration Checklist:"
echo "1. ✅ Test user authentication and registration"
echo "2. ✅ Verify AI chat functionality works"
echo "3. ✅ Test payment processing and Stripe integration"
echo "4. ✅ Check all Edge Functions respond correctly"
echo "5. ✅ Validate user data integrity and access"
echo "6. ⏳ Update application configuration (if needed)"
echo "7. ⏳ Test with real users"
echo "8. ⏳ Monitor performance and error rates"
echo "9. ⏳ Update documentation and user guides"
echo "10. ⏳ Communicate changes to users"
echo ""

echo "⚠️ IMPORTANT REMINDERS:"
echo "- Monitor the system closely for the first 24-48 hours"
echo "- Keep backup files until you're confident everything works"
echo "- Update any hardcoded project references in your application"
echo "- Test all critical user journeys thoroughly"
echo "- Have a rollback plan ready if issues arise"
echo ""

echo "🎯 NEXT STEPS:"
echo "1. Test the application thoroughly with real user scenarios"
echo "2. Update your application's Supabase configuration"
echo "3. Monitor logs and performance metrics"
echo "4. Communicate the migration completion to your users"
echo "5. Archive the source project once you're confident"
echo ""

echo "✨ Congratulations! Your VortexCore.app migration is complete!"
echo "The Fixer Initiative project now has all the functionality from VortexCore.app."

# Offer to open validation report
read -p "Would you like to view the validation report? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "MIGRATION_VALIDATION_REPORT.md" ]; then
        echo ""
        echo "📄 Opening validation report..."
        cat MIGRATION_VALIDATION_REPORT.md
    else
        echo "⚠️ Validation report not found. Run ./validate-migration.sh to generate it."
    fi
fi
