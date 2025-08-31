# Archive Directory

This directory contains files that were causing build conflicts but should be preserved for historical context.

## Structure

### `migration-docs/`
- Contains migration and project setup documentation files
- These were causing persistent IDE errors due to markdown linting issues
- Archived to prevent build conflicts while preserving project history

### `unrelated-functions/`
- Contains Supabase functions not related to VortexCore
- Includes parent-dashboard, nixie-ai, and chat services
- Moved here to keep only VortexCore-specific functions in active development

## Purpose

Files are archived (not deleted) to maintain CI/CD context and project history while preventing active build conflicts.

## Team Access

✅ **Archive files ARE committed to git** - Team members have full access
✅ **Historical reference maintained** - Project context preserved  
✅ **Build conflicts avoided** - Files moved out of active development paths

## Why Not .gitignore?

Archive files are intentionally **NOT ignored** so team members can:
- Access migration documentation for reference
- Understand project evolution and decisions
- Restore files if needed for troubleshooting
- Maintain full project audit trail