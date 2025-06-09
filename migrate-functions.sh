#!/bin/bash

# Function Migration Script
# Migrates all functions from Vortexcore.app to the-fixer-initiative

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Source and target project references
SOURCE_PROJECT="muyhurqfcsjqtnbozyir"  # Vortexcore.app
TARGET_PROJECT="mxtsdgkwzjzlttpotole"  # the-fixer-initiative

# List of functions to migrate (from the source project)
FUNCTIONS=(
    "callback-handler"
    "verify"
    "payment"
    "auth"
    "chat"
    "nixie-ai"
    "nixie-ai-streaming"
    "parent-dashboard"
    "stripe-webhook"
    "create-checkout-session"
    "gemini-ai"
    "openai-assistant"
    "openai-chat"
    "ai-router"
)

# Backup existing functions directory
backup_functions() {
    if [ -d "supabase/functions" ]; then
        print_status "Backing up existing functions..."
        cp -r supabase/functions supabase/functions.backup.$(date +%Y%m%d_%H%M%S)
        print_success "Functions backed up"
    fi
}

# Download functions from source project
download_from_source() {
    print_header "Downloading Functions from Vortexcore.app"
    
    # Link to source project
    print_status "Linking to source project: $SOURCE_PROJECT"
    supabase link --project-ref $SOURCE_PROJECT
    
    # Create functions directory if it doesn't exist
    mkdir -p supabase/functions
    
    # Download each function
    for func in "${FUNCTIONS[@]}"; do
        print_status "Downloading function: $func"
        if supabase functions download $func --project-ref $SOURCE_PROJECT; then
            print_success "Downloaded: $func"
        else
            print_error "Failed to download: $func"
        fi
    done
}

# Deploy to target project
deploy_to_target() {
    print_header "Deploying Functions to the-fixer-initiative"
    
    # Link to target project
    print_status "Linking to target project: $TARGET_PROJECT"
    supabase link --project-ref $TARGET_PROJECT
    
    # Deploy each function
    for func in "${FUNCTIONS[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            print_status "Deploying function: $func"
            if supabase functions deploy $func; then
                print_success "Deployed: $func"
            else
                print_error "Failed to deploy: $func"
            fi
        else
            print_warning "Function directory not found: $func"
        fi
    done
}

# Migrate secrets
migrate_secrets() {
    print_header "Migrating API Secrets"
    
    print_warning "Note: Secrets need to be manually configured in the target project"
    print_status "Required secrets to configure in target project:"
    echo "   - GEMINI_API_KEY"
    echo "   - OPENAI_API_KEY"
    echo "   - PERPLEXITY_API_KEY"
    echo "   - nixieai_secret_key"
    echo "   - stripe_secret_key"
    echo ""
    print_status "You can set these using: supabase secrets set KEY_NAME=value"
}

# Main migration function
main() {
    print_header "VortexCore Function Migration"
    echo -e "${CYAN}Source: Vortexcore.app (muyhurqfcsjqtnbozyir)${NC}"
    echo -e "${CYAN}Target: the-fixer-initiative (mxtsdgkwzjzlttpotole)${NC}"
    echo ""
    
    read -p "Continue with migration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled"
        exit 0
    fi
    
    backup_functions
    download_from_source
    deploy_to_target
    migrate_secrets
    
    print_header "Migration Complete"
    print_success "All functions have been migrated from Vortexcore.app to the-fixer-initiative"
    print_warning "Don't forget to configure the API secrets in the target project!"
}

# Execute main function
main "$@"
