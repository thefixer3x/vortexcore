#!/bin/bash

# Test Migrated Functions Script
# Tests all functions migrated from VortexCore.app to the-fixer-initiative

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

# Get configuration from .env
SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env 2>/dev/null | cut -d'=' -f2)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
    print_error "Supabase configuration not found in .env file"
    exit 1
fi

# Test function endpoint
test_function() {
    local function_name=$1
    local test_payload=$2
    local endpoint="$SUPABASE_URL/functions/v1/$function_name"
    
    print_status "Testing $function_name..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/test_response.txt \
        -X POST \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        "$endpoint")
    
    http_code="${response: -3}"
    response_body=$(cat /tmp/test_response.txt)
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 400 ]]; then
        print_success "$function_name working (HTTP $http_code)"
        echo -e "${CYAN}Response preview: ${response_body:0:100}...${NC}"
    elif [[ "$http_code" == "401" ]]; then
        print_warning "$function_name needs authentication (HTTP $http_code)"
    elif [[ "$http_code" == "500" ]]; then
        print_error "$function_name has internal error (HTTP $http_code)"
        echo -e "${RED}Error: $response_body${NC}"
    else
        print_error "$function_name failed (HTTP $http_code)"
        echo -e "${RED}Response: $response_body${NC}"
    fi
    
    echo ""
}

# Main testing function
main() {
    print_header "Testing Migrated Functions"
    
    echo -e "${CYAN}Target Project: the-fixer-initiative${NC}"
    echo -e "${CYAN}Supabase URL: $SUPABASE_URL${NC}"
    echo ""
    
    print_header "Core Functions"
    
    # Test authentication
    test_function "auth" '{
        "action": "test",
        "email": "test@example.com"
    }'
    
    # Test callback handler
    test_function "callback-handler" '{
        "type": "test",
        "data": {"test": true}
    }'
    
    # Test verify
    test_function "verify" '{
        "token": "test_token",
        "type": "email"
    }'
    
    # Test payment
    test_function "payment" '{
        "amount": 1000,
        "currency": "USD",
        "type": "test"
    }'
    
    print_header "AI Functions"
    
    # Test chat
    test_function "chat" '{
        "messages": [
            {"role": "user", "content": "Hello, this is a test"}
        ]
    }'
    
    # Test Nixie AI
    test_function "nixie-ai" '{
        "message": "Hello Nixie",
        "userId": "test_user"
    }'
    
    # Test Nixie AI Streaming
    test_function "nixie-ai-streaming" '{
        "message": "Hello Nixie streaming",
        "userId": "test_user"
    }'
    
    # Test OpenAI Chat
    test_function "openai-chat" '{
        "messages": [
            {"role": "user", "content": "Hello OpenAI"}
        ]
    }'
    
    print_header "Dashboard & Payment Functions"
    
    # Test parent dashboard
    test_function "parent-dashboard" '{
        "action": "get_dashboard",
        "userId": "test_user"
    }'
    
    # Test Stripe webhook
    test_function "stripe-webhook" '{
        "type": "test.event",
        "data": {"object": {"id": "test"}}
    }'
    
    # Test create checkout session
    test_function "create-checkout-session" '{
        "priceId": "price_test",
        "successUrl": "https://example.com/success",
        "cancelUrl": "https://example.com/cancel"
    }'
    
    print_header "Test Summary"
    
    print_status "All migrated functions have been tested"
    print_warning "Functions returning 401 may require proper authentication"
    print_warning "Functions returning 500 may need API secrets configured"
    
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "1. Configure missing API secrets if needed"
    echo "2. Update your application to use the new function endpoints"
    echo "3. Test with real authentication tokens"
    echo "4. Verify end-to-end workflows"
}

# Execute main function
main "$@"
