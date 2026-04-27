# 🔒 Branch Protection Replication Guide

This guide shows you how to replicate the enterprise-grade security setup we implemented for VortexCore across all your important projects.

## 🚀 Quick Setup (Automated)

### **1. Use the Automated Script**
```bash
# Copy the script to a common location
cp scripts/setup-branch-protection.sh ~/bin/setup-branch-protection.sh
chmod +x ~/bin/setup-branch-protection.sh

# Apply to any repository
setup-branch-protection.sh "username/repo-name" "main"
setup-branch-protection.sh "username/repo-name" "main-protected"
```

### **2. Bulk Apply to Multiple Projects**
```bash
#!/bin/bash
# List your important repositories
REPOS=(
  "thefixer3x/project1"
  "thefixer3x/project2" 
  "thefixer3x/project3"
  "yourorg/important-project"
)

# Apply protection to all
for repo in "${REPOS[@]}"; do
  echo "🔒 Protecting $repo..."
  setup-branch-protection.sh "$repo" "main"
  setup-branch-protection.sh "$repo" "main-protected" 2>/dev/null || true
done
```

## 🛠️ Manual Setup (Step-by-Step)

### **Step 1: Branch Protection Rules**

For each repository, run:
```bash
gh api --method PUT repos/OWNER/REPO/branches/BRANCH/protection --input - << 'EOF'
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
```

### **Step 2: Clean Branch Structure**

Establish 3 sources of truth for each project:
```bash
# Navigate to your project
cd /path/to/your/project

# Create the 3-branch structure
git branch master              # Backup branch
git push -u origin master     # Push backup to remote
git checkout main             # Your main working branch
git branch main-protected     # Production branch
git push -u origin main-protected

# Clean up excess branches
git branch -D old-feature-branch1 old-feature-branch2
```

### **Step 3: Repository Security Settings**

For each repository, configure:

```bash
# Enable security features via GitHub CLI
gh repo edit OWNER/REPO \
  --enable-vulnerability-alerts \
  --enable-automated-security-fixes

# Or via API
gh api repos/OWNER/REPO -X PATCH -f has_vulnerability_alerts=true
gh api repos/OWNER/REPO -X PATCH -f allow_auto_merge=false
```

## 📋 Project-Specific Configurations

### **For Node.js/React Projects:**
```bash
# Add to .gitignore
echo "
# Secrets
.env
.env.*
!.env.example

# IDE
.vscode/settings.json
.claude/

# Security
.cache_ggshield
" >> .gitignore

# Create .env.example
cat > .env.example << 'EOF'
# Project Environment Variables Template
# Copy to .env and fill with real values

# API Configuration  
API_URL=https://your-api.com
API_KEY=your_api_key_here

# Database
DATABASE_URL=your_database_url_here

# Add other environment variables as needed
EOF
```

### **For Deployment Workflows:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main-protected]  # Only from protected branch
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          # Your deployment commands
```

## 🔍 Verification Commands

### **Test Branch Protection:**
```bash
# This should fail with "Changes must be made through a pull request"
git checkout main-protected
echo "test" >> test.txt
git add test.txt
git commit -m "Test protection"
git push origin main-protected
```

### **Verify Protection Status:**
```bash
# Check protection rules
gh api repos/OWNER/REPO/branches/BRANCH/protection

# List all protected branches
gh api repos/OWNER/REPO/branches --jq '.[] | select(.protected) | .name'
```

### **Scan for Security Issues:**
```bash
# Check for secrets in code
rg -i "(?:api[_-]?key|secret|token|password)" --type-not=lockb

# Verify .env is ignored
git check-ignore .env
```

## 📊 Repository Health Checklist

Use this checklist for each important project:

### **Security Checklist:**
- [ ] Branch protection enabled on main/production branches
- [ ] Pull request reviews required (minimum 1 approval)
- [ ] Force push protection enabled
- [ ] Direct commit prevention active
- [ ] .env files properly ignored
- [ ] No hardcoded secrets in code
- [ ] GitHub security alerts enabled
- [ ] Dependabot vulnerability alerts active

### **Branch Structure:**
- [ ] Clean branch structure (3 sources of truth max)
- [ ] Production branch (`main-protected`)
- [ ] Working branch (`main` or `dev`)
- [ ] Backup branch (`master`)
- [ ] Excess feature branches cleaned up

### **CI/CD Security:**
- [ ] Deployment only from protected branches
- [ ] Secrets properly stored in GitHub secrets
- [ ] No secrets in workflow files
- [ ] Proper environment variable injection

## 🚀 Deployment Patterns

### **Safe Deployment Workflow:**
1. **Development** → `dev` or `main` branch
2. **Testing** → Create PR to `main-protected`
3. **Review** → Team approves PR (automated tests pass)
4. **Production** → Merge triggers deployment
5. **Backup** → `master` branch stays as fallback

### **Emergency Procedures:**
```bash
# Emergency hotfix (when main-protected is broken)
git checkout master           # Use backup
git checkout -b hotfix/critical
# Make critical fix
git push -u origin hotfix/critical
# Create emergency PR to main-protected
```

## 🔧 Customization Options

### **For Different Team Sizes:**
```bash
# Small team (1 approval)
"required_approving_review_count": 1

# Medium team (2 approvals)
"required_approving_review_count": 2

# Large team (3 approvals + code owners)
"required_approving_review_count": 3,
"require_code_owner_reviews": true
```

### **For CI/CD Requirements:**
```bash
# Require CI checks to pass
"required_status_checks": {
  "strict": true,
  "checks": [
    {"context": "ci/build"},
    {"context": "ci/test"}
  ]
}
```

## 📱 Management Commands

### **Bulk Status Check:**
```bash
#!/bin/bash
# Check protection status across multiple repos
REPOS=("repo1" "repo2" "repo3")

for repo in "${REPOS[@]}"; do
  echo "🔍 Checking $repo..."
  gh api "repos/thefixer3x/$repo/branches/main/protection" \
    --jq '.required_pull_request_reviews.required_approving_review_count // "No protection"'
done
```

### **Bulk Secret Management:**
```bash
# Add secret to multiple repositories
REPOS=("repo1" "repo2" "repo3")
SECRET_VALUE="your-secret-value"

for repo in "${REPOS[@]}"; do
  gh secret set API_KEY --body "$SECRET_VALUE" --repo "thefixer3x/$repo"
done
```

## 🆘 Troubleshooting

### **Common Issues:**

**"Branch not protected" error:**
```bash
# The branch might not exist on remote
git push origin main-protected
# Then apply protection
```

**"Insufficient permissions" error:**
```bash
# You need admin access to the repository
gh auth refresh --scopes repo,admin:repo_hook
```

**Protection rules not working:**
```bash
# Check if you're an admin (admins can bypass unless enforce_admins: true)
gh api repos/OWNER/REPO --jq '.permissions.admin'
```

## 🎯 Quick Reference Commands

```bash
# Apply protection (replace OWNER/REPO/BRANCH)
gh api --method PUT repos/OWNER/REPO/branches/BRANCH/protection --input protection.json

# Remove protection
gh api --method DELETE repos/OWNER/REPO/branches/BRANCH/protection

# List protected branches
gh api repos/OWNER/REPO/branches --jq '.[] | select(.protected) | .name'

# Test protection (should fail)
git push origin protected-branch

# View protection settings
gh api repos/OWNER/REPO/branches/BRANCH/protection
```

---

**💡 Pro Tip:** Save this guide and the script to a shared location accessible across all your projects. Consider creating a "security-templates" repository with these tools for your entire team.

**🔒 Security Note:** Always test branch protection on a non-critical repository first to ensure the setup works as expected in your specific environment.