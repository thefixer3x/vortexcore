#!/bin/bash

# VortexCore Webhook Fix Script
# This script resolves the "Failed to get all webhook endpoints" error

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

# Function to get Supabase project info
get_supabase_info() {
    print_header "Retrieving Supabase Project Information"
    
    local project_id="mxtsdgkwzjzlttpotole"
    local supabase_url="https://${project_id}.supabase.co"
    
    print_status "Project ID: $project_id"
    print_status "Project URL: $supabase_url"
    
    echo -e "${CYAN}To get your anon key:${NC}"
    echo "1. Go to: https://supabase.com/dashboard/project/$project_id/settings/api"
    echo "2. Copy the 'anon public' key"
    echo ""
}

# Function to configure API keys
configure_api_keys() {
    print_header "API Key Configuration"
    
    echo -e "${CYAN}We need to configure the following API keys:${NC}"
    echo "1. Supabase Anon Key (Required)"
    echo "2. OpenAI API Key (Required for AI functions)"
    echo ""
    
    # Check current .env configuration
    print_status "Current .env configuration:"
    if [ -f ".env" ]; then
        grep -E "(VITE_SUPABASE_|OPENAI_|GEMINI_)" .env | head -5 || echo "No API keys found in .env"
    else
        print_warning ".env file not found"
    fi
    echo ""
    
    echo -e "${YELLOW}Do you want to update API keys? (y/n):${NC}"
    read -r update_keys
    
    if [[ "$update_keys" =~ ^[Yy]$ ]]; then
        # Get Supabase anon key
        echo -e "${YELLOW}Enter your Supabase anon key (from the dashboard):${NC}"
        read -r supabase_anon_key
        
        if [ -n "$supabase_anon_key" ]; then
            # Update .env file
            if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
                sed -i '' "s/VITE_SUPABASE_ANON_KEY=.*/VITE_SUPABASE_ANON_KEY=$supabase_anon_key/" .env
            else
                echo "VITE_SUPABASE_ANON_KEY=$supabase_anon_key" >> .env
            fi
            print_success "Supabase anon key configured"
        fi
        
        # Get OpenAI API key
        echo -e "${YELLOW}Enter your OpenAI API key (optional, press Enter to skip):${NC}"
        read -r openai_api_key
        
        if [ -n "$openai_api_key" ]; then
            if grep -q "OPENAI_API_KEY=" .env; then
                sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_api_key/" .env
            else
                echo "OPENAI_API_KEY=$openai_api_key" >> .env
            fi
            print_success "OpenAI API key configured"
        fi
    fi
    
    echo ""
}

# Function to check webhook status
check_webhook_status() {
    print_header "Checking Webhook Status"
    
    # Check if Supabase CLI is available
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. You can install it with:"
        echo "npm install -g supabase@latest"
        return 1
    fi
    
    # List edge functions
    print_status "Listing edge functions..."
    if [ -d "supabase/functions" ]; then
        ls -la supabase/functions/
    else
        print_warning "No supabase/functions directory found"
    fi
    
    echo ""
}

# Function to test webhooks
test_webhooks() {
    print_header "Testing Webhook Endpoints"
    
    local base_url="https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1"
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # List all available endpoints
    print_status "Available webhook endpoints:"
    for func_dir in supabase/functions/*/; do
        if [ -d "$func_dir" ]; then
            func_name=$(basename "$func_dir")
            echo "  - $base_url/$func_name"
            
            # Test if endpoint responds
            print_status "Testing $func_name..."
            if curl -s -f "$base_url/$func_name" -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
                print_success "$func_name endpoint is responding"
            else
                print_warning "$func_name endpoint not responding (may need deployment or configuration)"
            fi
        fi
    done
    
    echo ""
}

# Function to start development server
start_dev_server() {
    print_header "Starting Development Server"
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Starting the application..."
    echo -e "${CYAN}Your application will be available at: http://localhost:5173${NC}"
    echo -e "${CYAN}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    npm run dev
}

# Main execution
main() {
    print_header "VortexCore Webhook Fix Script"
    echo -e "${CYAN}This script will help you resolve the webhook endpoints error${NC}"
    echo ""
    
    # Step 1: Show Supabase info
    get_supabase_info
    
    # Step 2: Configure API keys
    configure_api_keys
    
    # Step 3: Check webhook status
    check_webhook_status
    
    # Step 4: Test webhooks
    test_webhooks
    
    # Step 5: Start development server
    echo -e "${YELLOW}Do you want to start the development server? (y/n):${NC}"
    read -r server_answer
    if [[ "$server_answer" =~ ^[Yy]$ ]]; then
        start_dev_server
    fi
    
    print_header "Webhook Fix Complete"
    print_success "All steps completed!"
    echo -e "${CYAN}If you're still seeing webhook errors, please:${NC}"
    echo "1. Verify your API keys in the Supabase dashboard"
    echo "2. Check that your edge functions are deployed and running"
    echo "3. Ensure your environment variables are loaded correctly"
    echo ""
    echo -e "${PURPLE}For additional help, run: ./webhook-status.sh${NC}"
}

# Run main function
main "$@"
