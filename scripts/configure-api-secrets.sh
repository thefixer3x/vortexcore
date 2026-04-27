#!/bin/bash

# API Secrets Configuration Script
# Purpose: Configure missing API secrets for VortexCore.app migration

set -e

PROJECT_TARGET="mxtsdgkwzjzlttpotole"

echo "🔐 Configuring API Secrets for VortexCore.app Migration"
echo "Target Project: $PROJECT_TARGET"

# Ensure we're linked to the target project
echo "🔗 Linking to target project..."
supabase link --project-ref $PROJECT_TARGET

# Check current secrets
echo "📋 Current secrets in target project:"
supabase secrets list

echo ""
echo "🔧 Setting up missing API secrets..."

# Function to securely prompt for API key
prompt_for_secret() {
    local secret_name=$1
    local description=$2
    
    echo ""
    echo "📌 Setting up: $secret_name"
    echo "Description: $description"
    
    read -p "Do you have this API key ready? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -n "Enter $secret_name: "
        read -s secret_value
        echo
        
        if [ -n "$secret_value" ]; then
            supabase secrets set $secret_name="$secret_value"
            echo "✅ $secret_name configured successfully"
        else
            echo "⚠️  Empty value provided, skipping $secret_name"
        fi
    else
        echo "⏭️  Skipping $secret_name - you can configure this later using:"
        echo "   supabase secrets set $secret_name=\"your_key_here\""
    fi
}

# Configure missing secrets based on previous analysis
prompt_for_secret "GEMINI_API_KEY" "Google Gemini AI API key for AI functionality"
prompt_for_secret "PERPLEXITY_API_KEY" "Perplexity AI API key for enhanced search and AI capabilities" 
prompt_for_secret "nixieai_secret_key" "Nixie AI secret key for authentication and API access"

echo ""
echo "🔍 Verifying current secrets configuration..."
supabase secrets list

echo ""
echo "📝 API Secrets Configuration Summary:"
echo "✅ Most secrets already configured in target project"
echo "⚠️  If you skipped any secrets, remember to configure them later"
echo ""
echo "🔗 How to configure secrets later:"
echo "   supabase secrets set SECRET_NAME=\"your_value\""
echo ""
echo "📋 All available secrets should include:"
echo "   - ANTHROPIC_API_KEY ✅"
echo "   - GEMINI_API_KEY (configure if needed)"
echo "   - OPENAI_API_KEY ✅"
echo "   - PERPLEXITY_API_KEY (configure if needed)"
echo "   - STRIPE_SECRET_KEY ✅"
echo "   - STRIPE_WEBHOOK_SECRET ✅"
echo "   - nixieai_secret_key (configure if needed)"
echo "   - SUPABASE_DB_PASSWORD ✅"
echo "   - SUPABASE_JWT_SECRET ✅"
echo ""
echo "🎯 Next steps after API configuration:"
echo "   1. Run database migration: ./migrate-database-schema.sh"
echo "   2. Test all Edge Functions"
echo "   3. Migrate user data from source project"
echo "   4. Perform end-to-end testing"
