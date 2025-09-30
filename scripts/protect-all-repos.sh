#!/bin/bash

# Quick protection script for multiple repositories
# Add your repository names here:

REPOS=(
  "thefixer3x/vortexcore"
  # Add your other important repositories here:
  # "thefixer3x/project1"
  # "thefixer3x/project2" 
  # "thefixer3x/project3"
  # "yourorg/important-project"
)

BRANCHES=("main" "main-protected")

echo "🔒 Protecting all important repositories..."
echo "─────────────────────────────────────────"

for repo in "${REPOS[@]}"; do
  echo "📦 Processing: $repo"
  
  for branch in "${BRANCHES[@]}"; do
    echo "  🔒 Protecting branch: $branch"
    
    gh api --method PUT "repos/$repo/branches/$branch/protection" --input - << 'EOF' 2>/dev/null || echo "    ⚠️  Branch $branch might not exist"
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
  done
  
  echo "  ✅ $repo protected"
  echo ""
done

echo "🎉 All repositories have been protected!"
echo ""
echo "📋 Summary applied to each repository:"
echo "   • Pull request reviews required (1 approval)"
echo "   • Dismiss stale reviews on new commits"  
echo "   • Enforce for administrators"
echo "   • Prevent force pushes"
echo "   • Prevent branch deletion"
echo "   • Block direct commits"