#!/bin/bash

# 🔐 Secret Scanner Script
# Scans codebase for potentially exposed secrets and environment variables

# Configuration
SEARCH_DIR="/Users/seyederick/DevOps/_project_folders/vortex-core-app"
OUTPUT_FILE="exposed_secrets_report.txt"

# Patterns to search for
PATTERNS=(
    "API_?KEY"
    "SECRET"
    "TOKEN"
    "PASSWORD"
    "AUTH"
    "CREDENTIALS?"
    "PRIVATE_?KEY"
    "ACCESS_?KEY"
    "CLIENT_?SECRET"
    "DATABASE_?URL"
    "ENCRYPTION_?KEY"
    "SESSION_?SECRET"
    "process\.env"
    "import\.meta\.env"
    "Deno\.env"
    "Bun\.env"
    "getenv"
    "os\.environ"
)

# File types to scan
FILE_TYPES=(
    "*.js"
    "*.ts"
    "*.jsx"
    "*.tsx"
    "*.py"
    "*.sh"
    "*.env"
    "*.md"
    "*.yaml"
    "*.yml"
    "*.json"
)

# Exclude directories
EXCLUDE_DIRS=(
    "node_modules"
    "dist"
    "build"
    ".netlify"
    ".vite"
    ".next"
    ".git"
)

# Build find command
exclude_args=()
for dir in "${EXCLUDE_DIRS[@]}"; do
    exclude_args+=(-not -path "*/$dir/*")
done

file_args=()
for type in "${FILE_TYPES[@]}"; do
    file_args+=(-name "$type")
done

# Start scan
echo "🚀 Starting secret scan in $SEARCH_DIR"
echo "🔍 Patterns: ${PATTERNS[*]}"
echo "📄 File types: ${FILE_TYPES[*]}"
echo "🚫 Excluded: ${EXCLUDE_DIRS[*]}"
echo ""

echo "# Secret Scan Report - $(date)" > "$OUTPUT_FILE"
echo "## Project: $SEARCH_DIR" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Loop through patterns
for pattern in "${PATTERNS[@]}"; do
    echo "🔎 Scanning for pattern: $pattern"
    
    # Find files with matches
    find "$SEARCH_DIR" "${exclude_args[@]}" \( "${file_args[@]}" \) \
        -exec grep -I -H -n -i -E "$pattern" {} \; \
        | grep -v "test" \
        | grep -v "mock" \
        | grep -v "example" \
        | sort -u >> "$OUTPUT_FILE"
    
    echo "" >> "$OUTPUT_FILE"
done

# Add summary
echo "## Scan Summary" >> "$OUTPUT_FILE"
echo "- Scan completed: $(date)" >> "$OUTPUT_FILE"
echo "- Patterns scanned: ${#PATTERNS[@]}" >> "$OUTPUT_FILE"

# Count findings
finding_count=$(grep -c "^/" "$OUTPUT_FILE" || true)
echo "- Potential exposures found: $finding_count" >> "$OUTPUT_FILE"

echo ""
echo "✅ Scan complete! Results saved to $OUTPUT_FILE"
echo "⚠️ Review the findings carefully before committing to GitHub"
echo "💡 Consider moving secrets to .env files and adding them to .gitignore"
