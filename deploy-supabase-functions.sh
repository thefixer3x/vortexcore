#!/bin/bash

# =====================================================
# Deploy Supabase Edge Functions with Secrets
# =====================================================

echo "=================================================="
echo "Deploying Supabase Edge Functions"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not installed!"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Link to project
print_status "Linking to Supabase project..."
supabase link --project-ref mxtsdgkwzjzlttpotole 2>/dev/null || true

# Set secrets from .env file
print_status "Setting Edge Function secrets..."

# Read from .env file
if [ -f ".env" ]; then
    # Extract API keys from .env
    OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d'=' -f2)
    PERPLEXITY_KEY=$(grep "^PERPLEXITY_API_KEY=" .env | cut -d'=' -f2)
    STRIPE_SECRET=$(grep "^STRIPE_SECRET_KEY=" .env | cut -d'=' -f2)
    STRIPE_WEBHOOK=$(grep "^STRIPE_WEBHOOK_SECRET=" .env | cut -d'=' -f2)
    
    # Set Perplexity (we have this one)
    if [ ! -z "$PERPLEXITY_KEY" ]; then
        print_status "Setting Perplexity API key..."
        supabase secrets set PERPLEXITY_API_KEY="$PERPLEXITY_KEY"
    fi
    
    # For OpenAI - use a placeholder or skip
    if [ ! -z "$OPENAI_KEY" ] && [ "$OPENAI_KEY" != "your_openai_api_key_here" ]; then
        print_status "Setting OpenAI API key..."
        supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
    else
        print_warning "OpenAI API key not set - AI chat may not work fully"
        # Set a dummy key to prevent errors
        supabase secrets set OPENAI_API_KEY="sk-dummy-key-for-testing"
    fi
    
    # For Stripe
    if [ ! -z "$STRIPE_SECRET" ] && [ "$STRIPE_SECRET" != "your_stripe_secret_key" ]; then
        print_status "Setting Stripe keys..."
        supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET"
        supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK"
    else
        print_warning "Stripe keys not set - payment features disabled"
    fi
else
    print_error ".env file not found!"
    exit 1
fi

# Deploy functions
print_status "Deploying Edge Functions..."

# Deploy AI router
if [ -d "supabase/functions/ai-router" ]; then
    print_status "Deploying ai-router function..."
    supabase functions deploy ai-router --no-verify-jwt || print_warning "Failed to deploy ai-router"
fi

# Deploy Stripe functions
if [ -d "supabase/functions/stripe" ]; then
    print_status "Deploying stripe function..."
    supabase functions deploy stripe || print_warning "Failed to deploy stripe"
fi

if [ -d "supabase/functions/stripe-webhook" ]; then
    print_status "Deploying stripe-webhook function..."
    supabase functions deploy stripe-webhook || print_warning "Failed to deploy stripe-webhook"
fi

# Deploy other functions
for func_dir in supabase/functions/*; do
    if [ -d "$func_dir" ]; then
        func_name=$(basename "$func_dir")
        if [[ "$func_name" != "ai-router" && "$func_name" != "stripe" && "$func_name" != "stripe-webhook" ]]; then
            print_status "Deploying $func_name function..."
            supabase functions deploy "$func_name" || print_warning "Failed to deploy $func_name"
        fi
    fi
done

print_status "Edge Functions deployment complete!"

# Show deployed functions
echo ""
print_status "Listing deployed functions..."
supabase functions list

echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo "1. Test authentication at your app URL"
echo "2. Check function logs if issues occur:"
echo "   supabase functions logs ai-router --tail"
echo ""
print_status "Deployment script completed!"
