#!/bin/bash

# VortexCore Webhook Endpoints Test Script
# This script tests if webhook endpoints are accessible and responding

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

# Get Supabase URL from environment
SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env 2>/dev/null | cut -d'=' -f2)

if [[ -z "$SUPABASE_URL" || "$SUPABASE_URL" == *"your_"* ]]; then
    print_error "Supabase URL not configured in .env file"
    exit 1
fi

if [[ -z "$SUPABASE_ANON_KEY" || "$SUPABASE_ANON_KEY" == *"your_"* ]]; then
    print_error "Supabase anon key not configured in .env file"
    exit 1
fi

# Test function endpoints
test_webhook_endpoint() {
    local function_name=$1
    local test_payload=$2
    local endpoint="$SUPABASE_URL/functions/v1/$function_name"
    
    print_status "Testing $function_name endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.txt \
        -X POST \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        "$endpoint")
    
    http_code="${response: -3}"
    response_body=$(cat /tmp/response.txt)
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 400 ]]; then
        print_success "$function_name endpoint is responding (HTTP $http_code)"
        echo -e "${CYAN}Response: $response_body${NC}"
    elif [[ "$http_code" == "401" ]]; then
        print_warning "$function_name endpoint requires authentication (HTTP $http_code)"
    elif [[ "$http_code" == "404" ]]; then
        print_error "$function_name endpoint not found (HTTP $http_code)"
    else
        print_error "$function_name endpoint error (HTTP $http_code)"
        echo -e "${RED}Response: $response_body${NC}"
    fi
    
    echo ""
}

# Main testing function
main() {
    print_header "VortexCore Webhook Endpoints Test"
    
    echo -e "${CYAN}Supabase URL: $SUPABASE_URL${NC}"
    echo -e "${CYAN}Testing with anon key authentication${NC}"
    echo ""
    
    # Test AI Router endpoint
    test_webhook_endpoint "ai-router" '{
        "messages": [
            {"role": "user", "content": "Hello, this is a test"}
        ]
    }'
    
    # Test Gemini AI endpoint
    test_webhook_endpoint "gemini-ai" '{
        "prompt": "Hello, this is a test"
    }'
    
    # Test OpenAI endpoint
    test_webhook_endpoint "openai" '{
        "messages": [
            {"role": "user", "content": "Hello, this is a test"}
        ]
    }'
    
    # Test OpenAI Assistant endpoint
    test_webhook_endpoint "openai-assistant" '{
        "message": "Hello, this is a test"
    }'
    
    # Test Payment endpoints
    test_webhook_endpoint "stripe" '{
        "type": "test",
        "data": {}
    }'
    
    test_webhook_endpoint "paystack" '{
        "event": "test"
    }'
    
    test_webhook_endpoint "flutterwave" '{
        "event": "test"
    }'
    
    # Test Gateway endpoint
    test_webhook_endpoint "gateway" '{
        "test": true
    }'
    
    print_header "Test Complete"
    print_status "If you see 401 errors, the endpoints exist but need proper API keys"
    print_status "If you see 404 errors, the functions may not be deployed"
    print_status "If you see 200 responses, the endpoints are working correctly"
}

# Execute main function
main "$@"
