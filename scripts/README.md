# Scripts Directory

This directory contains operational scripts organized by purpose.

## Categories

- `deployment/` — deployment and release scripts
- `security/` — security hardening/scanning/fix scripts
- `migration/` — migration orchestrators and migration workflows
- `database/` — DB schema checks, SQL utilities, DB diagnostics
- `auth/` — authentication-specific setup/fix/verification scripts
- `testing/` — smoke tests and validation scripts
- `diagnostics/` — debugging and investigation helpers
- `maintenance/` — cleanup, restore, and maintenance scripts
- `env/` — environment and configuration setup scripts
- `webhooks/` — webhook validation and repair scripts

## Rules

1. Use `git mv` when relocating scripts to preserve history.
2. Keep executable scripts executable.
3. Every script should have a clear purpose and owner context in related docs.
4. Update README/docs references when script paths change.
