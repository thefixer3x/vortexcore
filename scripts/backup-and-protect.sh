#!/bin/bash

# 🛡️ VORTEX-CORE-APP BACKUP AND PROTECTION SCRIPT
# This script helps prevent your project from being wiped out again!

set -e

PROJECT_NAME="vortex-core-app"
PROJECT_DIR="/Users/seyederick/Documents/vortex-core-app"
BACKUP_DIR="/Users/seyederick/Documents/vortex-core-app-backups"
DATE=$(date +"%Y%m%d_%H%M%S")

echo "🛡️ Starting backup and protection for $PROJECT_NAME..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
BACKUP_NAME="${PROJECT_NAME}_backup_${DATE}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "📦 Creating backup: $BACKUP_NAME"

# Copy project files (excluding node_modules and .git)
rsync -av --exclude='node_modules' --exclude='.git' --exclude='.DS_Store' \
    "$PROJECT_DIR/" "$BACKUP_PATH/"

# Create git archive backup
cd "$PROJECT_DIR"
git archive --format=tar --output="$BACKUP_PATH.tar" HEAD

echo "✅ Backup created at: $BACKUP_PATH"

# Create critical files manifest
echo "📋 Creating critical files manifest..."
find "$PROJECT_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.sql" \) \
    -not -path "*/node_modules/*" -not -path "*/.git/*" > "$BACKUP_PATH/critical_files_manifest.txt"

# Create package.json backup
cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/package.json.backup"
cp "$PROJECT_DIR/bun.lockb" "$BACKUP_PATH/bun.lockb.backup"

# Create database schema backup
if [ -d "$PROJECT_DIR/supabase" ]; then
    echo "🗄️ Backing up database schema..."
    cp -r "$PROJECT_DIR/supabase" "$BACKUP_PATH/supabase.backup"
fi

# Create environment backup
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "🔐 Backing up environment configuration..."
    cp "$PROJECT_DIR/.env" "$BACKUP_PATH/.env.backup"
fi

# Create git status backup
echo "📊 Backing up git status..."
git status > "$BACKUP_PATH/git_status.txt"
git log --oneline -20 > "$BACKUP_PATH/git_log.txt"
git remote -v > "$BACKUP_PATH/git_remotes.txt"

# Create protection checklist
cat > "$BACKUP_PATH/PROTECTION_CHECKLIST.md" << 'EOF'
# 🛡️ PROTECTION CHECKLIST - VORTEX-CORE-APP

## **Backup Created**: $(date)

### **Critical Files Protected:**
- ✅ Source code (`src/`)
- ✅ Configuration files
- ✅ Database schema
- ✅ Environment variables
- ✅ Dependencies

### **Next Steps:**
1. **Set up GitHub branch protection**
2. **Enable required reviews**
3. **Set up automated backups**
4. **Monitor for critical changes**

### **Recovery Instructions:**
If project is wiped out again:
1. Restore from this backup: `$BACKUP_PATH`
2. Reinitialize git repository
3. Restore dependencies: `bun install`
4. Verify all files are intact

**NEVER AGAIN should this project be wiped out!**
EOF

echo "🛡️ Protection checklist created"

# Create automated backup reminder
echo "⏰ Setting up automated backup reminder..."
cat > "$BACKUP_PATH/README.md" << 'EOF'
# VORTEX-CORE-APP BACKUP

**Backup Date**: $(date)
**Project**: vortex-core-app
**Location**: $PROJECT_DIR

## **What's Backed Up:**
- Complete source code
- Configuration files
- Database schema
- Dependencies list
- Git history
- Environment variables

## **Recovery:**
Use this backup to restore your project if it gets wiped out again.

## **Next Backup:**
Schedule regular backups to prevent data loss.
EOF

echo "✅ Backup and protection complete!"
echo "📁 Backup location: $BACKUP_PATH"
echo "🛡️ Protection checklist: $BACKUP_PATH/PROTECTION_CHECKLIST.md"
echo ""
echo "🚨 NEXT STEPS:"
echo "1. Go to: https://github.com/thefixer3x/vortex-core-app/settings/branches"
echo "2. Set up branch protection rules"
echo "3. Enable required reviews"
echo "4. Set up automated backups"
echo ""
echo "💡 Run this script regularly to maintain backups!"
