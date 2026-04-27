#!/bin/bash

# VortexCore Webhook Status Monitor
# This script monitors webhook endpoints and provides status information

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-""}
    
    if [[ -z "$url" || "$url" == *"your_"* ]]; then
        print_error "$name: URL not configured"
        return 1
    fi
    
    local cmd="curl -s -f --max-time 10"
    
    if [[ "$method" == "POST" && -n "$data" ]]; then
        cmd="$cmd -X POST -H 'Content-Type: application/json' -d '$data'"
    fi
    
    cmd="$cmd '$url'"
    
    if eval $cmd > /dev/null 2>&1; then
        print_success "$name: Endpoint responding"
        return 0
    else
        print_error "$name: Endpoint not responding"
        return 1
    fi
}

# Function to check Supabase edge functions
check_supabase_functions() {
    print_header "Checking Supabase Edge Functions"
    
    local supabase_url=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -z "$supabase_url" ]]; then
        print_error "VITE_SUPABASE_URL not found in .env"
        return 1
    fi
    
    # Test AI router function
    local test_data='{"messages":[{"role":"user","content":"Hello"}]}'
    test_endpoint "AI Router" "$supabase_url/functions/v1/ai-router" "POST" "$test_data"
    
    # Test Gemini AI function
    local gemini_data='{"prompt":"Hello","history":[]}'
    test_endpoint "Gemini AI" "$supabase_url/functions/v1/gemini-ai" "POST" "$gemini_data"
    
    # Test OpenAI assistant function
    local openai_data='{"prompt":"Hello","history":[]}'
    test_endpoint "OpenAI Assistant" "$supabase_url/functions/v1/openai-assistant" "POST" "$openai_data"
}

# Function to check microservice health
check_microservices() {
    print_header "Checking Microservice Health"
    
    # Check auth service
    test_endpoint "Auth Service" "http://localhost:3001/health"
    
    # Check Kong API Gateway
    test_endpoint "Kong Gateway" "http://localhost:8001/status"
    
    # Check if services are running via Docker
    if command -v docker &> /dev/null; then
        print_status "Checking Docker containers..."
        
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "auth-service"; then
            print_success "Auth service container running"
        else
            print_warning "Auth service container not found"
        fi
        
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "kong"; then
            print_success "Kong gateway container running"
        else
            print_warning "Kong gateway container not found"
        fi
        
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "postgres"; then
            print_success "PostgreSQL container running"
        else
            print_warning "PostgreSQL container not found"
        fi
        
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "redis"; then
            print_success "Redis container running"
        else
            print_warning "Redis container not found"
        fi
    fi
}

# Function to check environment configuration
check_environment() {
    print_header "Checking Environment Configuration"
    
    if [[ ! -f ".env" ]]; then
        print_error ".env file not found"
        return 1
    fi
    
    # Check required environment variables
    local vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "OPENAI_API_KEY"
        "GEMINI_API_KEY"
    )
    
    for var in "${vars[@]}"; do
        local value=$(grep "$var" .env 2>/dev/null | cut -d'=' -f2)
        if [[ -n "$value" && "$value" != *"your_"* ]]; then
            print_success "$var configured"
        else
            print_error "$var not configured or using placeholder"
        fi
    done
    
    # Check optional variables
    local optional_vars=(
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "PERPLEXITY_API_KEY"
    )
    
    for var in "${optional_vars[@]}"; do
        local value=$(grep "$var" .env 2>/dev/null | cut -d'=' -f2)
        if [[ -n "$value" && "$value" != *"your_"* ]]; then
            print_success "$var configured (optional)"
        else
            print_warning "$var not configured (optional)"
        fi
    done
}

# Function to check webhook logs
check_webhook_logs() {
    print_header "Checking Recent Webhook Activity"
    
    # Check Supabase function logs if possible
    if command -v supabase &> /dev/null; then
        print_status "Checking Supabase function logs..."
        supabase functions logs ai-router --limit 5 2>/dev/null || print_warning "Could not fetch Supabase logs"
    else
        print_warning "Supabase CLI not installed, cannot check function logs"
    fi
    
    # Check Docker logs for auth service
    if command -v docker &> /dev/null; then
        print_status "Checking auth service logs for webhook activity..."
        docker logs --tail 10 vortex-core-app_auth-service_1 2>/dev/null | grep -i webhook || print_status "No recent webhook activity in auth service logs"
    fi
}

# Function to provide troubleshooting suggestions
provide_troubleshooting() {
    print_header "Troubleshooting Suggestions"
    
    echo -e "${CYAN}If you're still seeing webhook endpoint errors:${NC}"
    echo ""
    echo -e "${YELLOW}1. Configuration Issues:${NC}"
    echo "   - Run: ./configure-api-keys.sh to validate your API keys"
    echo "   - Ensure all required environment variables are set in .env"
    echo "   - Check that Supabase project is properly configured"
    echo ""
    echo -e "${YELLOW}2. Service Issues:${NC}"
    echo "   - Start microservices: ./setup-microservices.sh"
    echo "   - Deploy edge functions: supabase functions deploy"
    echo "   - Check service health: docker-compose ps"
    echo ""
    echo -e "${YELLOW}3. Network Issues:${NC}"
    echo "   - Verify CORS settings in Supabase dashboard"
    echo "   - Check firewall and network connectivity"
    echo "   - Ensure webhook URLs are accessible"
    echo ""
    echo -e "${YELLOW}4. Authentication Issues:${NC}"
    echo "   - Verify API keys are correctly set in Supabase secrets"
    echo "   - Check JWT configuration and auth flow"
    echo "   - Test with valid user authentication"
    echo ""
    echo -e "${CYAN}For more help, check the logs or contact support.${NC}"
}

# Function to show webhook URLs
show_webhook_urls() {
    print_header "Webhook Endpoint URLs"
    
    local supabase_url=$(grep "VITE_SUPABASE_URL" .env 2>/dev/null | cut -d'=' -f2)
    
    if [[ -n "$supabase_url" && "$supabase_url" != *"your_"* ]]; then
        echo -e "${CYAN}Supabase Edge Functions:${NC}"
        echo "  AI Router:        $supabase_url/functions/v1/ai-router"
        echo "  OpenAI Assistant: $supabase_url/functions/v1/openai-assistant"
        echo "  Gemini AI:        $supabase_url/functions/v1/gemini-ai"
        echo ""
    fi
    
    echo -e "${CYAN}Local Microservices:${NC}"
    echo "  Auth Service:     http://localhost:3001"
    echo "  Kong Gateway:     http://localhost:8000"
    echo "  Kong Admin:       http://localhost:8001"
    echo ""
    
    echo -e "${CYAN}External Webhooks:${NC}"
    echo "  Stripe:           https://your-domain.com/api/webhooks/stripe"
    echo "  Payment Provider: https://your-domain.com/api/webhooks/payments"
}

# Main function
main() {
    clear
    print_header "VortexCore Webhook Status Monitor"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || ! grep -q "vortex" package.json; then
        print_error "Not in VortexCore directory. Please run from project root."
        exit 1
    fi
    
    # Run all checks
    check_environment
    echo ""
    check_microservices
    echo ""
    check_supabase_functions
    echo ""
    check_webhook_logs
    echo ""
    show_webhook_urls
    echo ""
    provide_troubleshooting
    
    print_header "Status Check Complete"
}

# Handle command line arguments
case ${1:-""} in
    "env")
        check_environment
        ;;
    "services")
        check_microservices
        ;;
    "functions")
        check_supabase_functions
        ;;
    "logs")
        check_webhook_logs
        ;;
    "urls")
        show_webhook_urls
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [env|services|functions|logs|urls|help]"
        echo "  env       - Check environment configuration"
        echo "  services  - Check microservice health"
        echo "  functions - Check Supabase edge functions"
        echo "  logs      - Check webhook logs"
        echo "  urls      - Show webhook endpoint URLs"
        echo "  help      - Show this help message"
        echo ""
        echo "Run without arguments for full status check"
        ;;
    *)
        main
        ;;
esac
