#!/bin/bash

# =====================================================
# Test Environment Variables
# =====================================================

echo "=================================================="
echo "Testing Environment Variables"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# Load .env file
if [ -f ".env" ]; then
    source .env
    print_status ".env file loaded"
else
    print_error ".env file not found"
    exit 1
fi

echo ""
echo "Environment Variables Status:"
echo "=============================="

# Check Supabase
if [ ! -z "$VITE_SUPABASE_URL" ]; then
    print_status "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
else
    print_error "VITE_SUPABASE_URL: Not set"
fi

if [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    print_status "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
else
    print_error "VITE_SUPABASE_ANON_KEY: Not set"
fi

# Check OpenAI
if [ ! -z "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
    print_status "OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
    
    # Test OpenAI API
    echo ""
    print_warning "Testing OpenAI API..."
    response=$(curl -s -w "%{http_code}" -o /tmp/openai_test.json \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d '{
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Say hello"}],
            "max_tokens": 10
        }' \
        https://api.openai.com/v1/chat/completions)
    
    if [ "$response" = "200" ]; then
        print_status "OpenAI API: Working!"
        content=$(cat /tmp/openai_test.json | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
        echo "Response: $content"
    else
        print_error "OpenAI API: Failed (HTTP $response)"
        cat /tmp/openai_test.json 2>/dev/null || echo "No response body"
    fi
    rm -f /tmp/openai_test.json
else
    print_error "OPENAI_API_KEY: Not set or placeholder"
fi

# Check Perplexity
if [ ! -z "$PERPLEXITY_API_KEY" ] && [ "$PERPLEXITY_API_KEY" != "your_perplexity_api_key_here" ]; then
    print_status "PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY:0:10}..."
else
    print_warning "PERPLEXITY_API_KEY: Not set or placeholder"
fi

# Check Stripe
if [ ! -z "$STRIPE_SECRET_KEY" ] && [ "$STRIPE_SECRET_KEY" != "your_stripe_secret_key" ]; then
    print_status "STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:10}..."
else
    print_warning "STRIPE_SECRET_KEY: Not set or placeholder"
fi

echo ""
echo "=================================================="
echo "Deployment Status:"
echo "=================================================="

# Check if Supabase is linked
if command -v supabase &> /dev/null; then
    if supabase status 2>/dev/null | grep -q "Linked project:"; then
        print_status "Supabase: Linked to project"
    else
        print_warning "Supabase: Not linked"
    fi
else
    print_warning "Supabase CLI: Not installed"
fi

# Check if Netlify is linked
if command -v netlify &> /dev/null; then
    if netlify status 2>/dev/null | grep -q "Current site:"; then
        print_status "Netlify: Linked to site"
    else
        print_warning "Netlify: Not linked"
    fi
else
    print_warning "Netlify CLI: Not installed"
fi

echo ""
print_status "Environment test complete!"
