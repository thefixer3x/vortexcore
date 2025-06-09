#!/bin/bash

# VortexCore API Configuration Setup Script
# This script helps configure all required API keys for webhook endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if API key is configured
check_api_key() {
    local service_name=$1
    local env_var=$2
    local value=$3
    
    if [[ -z "$value" || "$value" == *"your_"* || "$value" == *"_here"* ]]; then
        print_error "$service_name API key not configured ($env_var)"
        return 1
    else
        print_success "$service_name API key configured"
        return 0
    fi
}

# Function to validate Supabase configuration
validate_supabase_config() {
    print_header "Validating Supabase Configuration"
    
    local supabase_url=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
    local supabase_key=$(grep "VITE_SUPABASE_ANON_KEY" .env 2>/dev/null | cut -d'=' -f2)
    
    check_api_key "Supabase URL" "VITE_SUPABASE_URL" "$supabase_url"
    check_api_key "Supabase Anon Key" "VITE_SUPABASE_ANON_KEY" "$supabase_key"
}

# Function to validate AI service configuration
validate_ai_config() {
    print_header "Validating AI Service Configuration"
    
    local openai_key=$(grep "OPENAI_API_KEY" .env 2>/dev/null | cut -d'=' -f2)
    local gemini_key=$(grep "GEMINI_API_KEY" .env 2>/dev/null | cut -d'=' -f2)
    
    check_api_key "OpenAI" "OPENAI_API_KEY" "$openai_key"
    check_api_key "Gemini AI" "GEMINI_API_KEY" "$gemini_key"
}

# Function to validate payment configuration
validate_payment_config() {
    print_header "Validating Payment Service Configuration"
    
    local stripe_secret=$(grep "STRIPE_SECRET_KEY" .env 2>/dev/null | cut -d'=' -f2)
    local stripe_webhook=$(grep "STRIPE_WEBHOOK_SECRET" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -n "$stripe_secret" ]]; then
        check_api_key "Stripe Secret Key" "STRIPE_SECRET_KEY" "$stripe_secret"
        check_api_key "Stripe Webhook Secret" "STRIPE_WEBHOOK_SECRET" "$stripe_webhook"
    else
        print_warning "Stripe configuration not found (optional for basic functionality)"
    fi
}

# Function to deploy Supabase edge functions with API keys
deploy_edge_functions() {
    print_header "Deploying Supabase Edge Functions"
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        return 1
    fi
    
    # Set environment variables for edge functions
    local openai_key=$(grep "OPENAI_API_KEY" .env 2>/dev/null | cut -d'=' -f2)
    local gemini_key=$(grep "GEMINI_API_KEY" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -n "$openai_key" && "$openai_key" != *"your_"* ]]; then
        print_status "Setting OpenAI API key in Supabase secrets..."
        supabase secrets set OPENAI_API_KEY="$openai_key"
    fi
    
    if [[ -n "$gemini_key" && "$gemini_key" != *"your_"* ]]; then
        print_status "Setting Gemini API key in Supabase secrets..."
        supabase secrets set GEMINI_API_KEY="$gemini_key"
    fi
    
    print_status "Deploying edge functions..."
    supabase functions deploy ai-router
    supabase functions deploy gemini-ai
    supabase functions deploy openai-assistant
    
    print_success "Edge functions deployed successfully"
}

# Function to test webhook endpoints
test_webhook_endpoints() {
    print_header "Testing Webhook Endpoints"
    
    local supabase_url=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -z "$supabase_url" || "$supabase_url" == *"your_"* ]]; then
        print_error "Cannot test webhooks: Supabase URL not configured"
        return 1
    fi
    
    print_status "Testing AI router function..."
    if curl -s -f "$supabase_url/functions/v1/ai-router" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello"}]}' > /dev/null; then
        print_success "AI router endpoint is responding"
    else
        print_warning "AI router endpoint test failed (may need authentication)"
    fi
    
    print_status "Testing Gemini AI function..."
    if curl -s -f "$supabase_url/functions/v1/gemini-ai" -H "Content-Type: application/json" -d '{"prompt":"Hello"}' > /dev/null; then
        print_success "Gemini AI endpoint is responding"
    else
        print_warning "Gemini AI endpoint test failed (may need authentication)"
    fi
}

# Function to generate configuration guide
generate_config_guide() {
    print_header "API Key Configuration Guide"
    
    echo -e "${CYAN}To resolve the webhook endpoint error, you need to configure these API keys:${NC}"
    echo ""
    echo -e "${YELLOW}1. Supabase Configuration:${NC}"
    echo "   - Get your project URL and anon key from: https://app.supabase.com/project/[your-project]/settings/api"
    echo "   - Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
    echo ""
    echo -e "${YELLOW}2. OpenAI API Key:${NC}"
    echo "   - Get your API key from: https://platform.openai.com/api-keys"
    echo "   - Update OPENAI_API_KEY in .env"
    echo ""
    echo -e "${YELLOW}3. Google Gemini API Key:${NC}"
    echo "   - Get your API key from: https://makersuite.google.com/app/apikey"
    echo "   - Update GEMINI_API_KEY in .env"
    echo ""
    echo -e "${YELLOW}4. Stripe API Keys (if using payments):${NC}"
    echo "   - Get your keys from: https://dashboard.stripe.com/apikeys"
    echo "   - Update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env"
    echo ""
    echo -e "${CYAN}After updating the .env file, run this script again to validate and deploy.${NC}"
}

# Function to create Stripe webhooks
setup_stripe_webhooks() {
    print_header "Setting up Stripe Webhooks"
    
    local stripe_secret=$(grep "STRIPE_SECRET_KEY" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -z "$stripe_secret" || "$stripe_secret" == *"your_"* ]]; then
        print_warning "Stripe secret key not configured, skipping webhook setup"
        return 0
    fi
    
    print_status "Stripe webhook endpoints to configure in your Stripe dashboard:"
    echo "   - https://your-domain.com/api/webhooks/stripe"
    echo "   - Events to listen for:"
    echo "     * payment_intent.succeeded"
    echo "     * payment_intent.payment_failed"
    echo "     * customer.subscription.created"
    echo "     * customer.subscription.updated"
    echo "     * invoice.payment_succeeded"
    echo "     * invoice.payment_failed"
    
    print_status "Configure these in: https://dashboard.stripe.com/webhooks"
}

# Main function
main() {
    print_header "VortexCore API Configuration Validator"
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        print_warning ".env file not found, creating from template..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            print_success "Created .env from template"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    fi
    
    # Validate configurations
    validate_supabase_config
    validate_ai_config
    validate_payment_config
    
    echo ""
    
    # Check if all required keys are configured
    if grep -q "your_.*_here" .env; then
        print_warning "Some API keys are not configured yet"
        generate_config_guide
    else
        print_success "All API keys appear to be configured!"
        
        # Deploy edge functions if configured
        read -p "Deploy Supabase edge functions? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_edge_functions
        fi
        
        # Test webhook endpoints
        read -p "Test webhook endpoints? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            test_webhook_endpoints
        fi
        
        # Setup Stripe webhooks
        setup_stripe_webhooks
    fi
    
    print_header "Configuration Complete"
    print_success "Run this script again after updating API keys to validate and deploy"
}

# Execute main function
main "$@"
