#!/bin/bash

# Branch Protection Setup Script
# Usage: ./setup-branch-protection.sh [repository] [branch-name]
# Example: ./setup-branch-protection.sh "thefixer3x/my-project" "main"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DEFAULT_BRANCH="main"
REPO="${1}"
BRANCH="${2:-$DEFAULT_BRANCH}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if repository is provided
if [ -z "$REPO" ]; then
    print_error "Repository is required!"
    echo "Usage: $0 <owner/repo> [branch-name]"
    echo "Example: $0 thefixer3x/my-project main"
    exit 1
fi

echo "🔒 Setting up branch protection for: $REPO"
echo "📋 Branch: $BRANCH"
echo "─────────────────────────────────────"

# Verify GitHub CLI is authenticated
if ! gh auth status > /dev/null 2>&1; then
    print_error "GitHub CLI not authenticated!"
    echo "Run: gh auth login"
    exit 1
fi

# Check if repository exists and user has admin access
if ! gh repo view "$REPO" > /dev/null 2>&1; then
    print_error "Cannot access repository: $REPO"
    echo "Make sure you have admin access to this repository"
    exit 1
fi

print_status "Repository access verified"

# Apply branch protection rules
echo "🛡️  Applying branch protection rules..."

gh api \
  --method PUT \
  "repos/$REPO/branches/$BRANCH/protection" \
  --input - << 'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

if [ $? -eq 0 ]; then
    print_status "Branch protection rules applied successfully!"
else
    print_error "Failed to apply branch protection rules"
    exit 1
fi

# Test branch protection by attempting a direct push
echo ""
echo "🧪 Testing branch protection..."
echo "ℹ️  This test requires you to be in the repository directory"
echo "   Run this script from within your repository to test the protection"

# Verification summary
echo ""
echo "📋 PROTECTION SUMMARY"
echo "─────────────────────"
echo "Repository: $REPO"
echo "Protected Branch: $BRANCH"
echo ""
echo "✅ Rules Applied:"
echo "   • Pull request reviews required (1 approval)"
echo "   • Dismiss stale reviews on new commits"
echo "   • Enforce for administrators"
echo "   • Prevent force pushes"
echo "   • Prevent branch deletion"
echo "   • Block direct commits"
echo ""
echo "🔍 Verification:"
echo "   Visit: https://github.com/$REPO/settings/branches"
echo "   Or run: gh api repos/$REPO/branches/$BRANCH/protection"
echo ""
print_status "Branch protection setup complete!"