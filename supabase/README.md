# Supabase Configuration

## config.toml
This file contains the **project linking information** and is **still relevant**:
- `project_id = "mxtsdgkwzjzlttpotole"` - Links this local project to the remote Supabase project
- Used by Supabase CLI for deployments, migrations, and function management
- **Keep this file** - Required for `supabase` commands to work

## What's NOT in config.toml (by design)
- API keys (now in GitHub secrets)
- Service URLs (automatically derived from project_id)
- Environment-specific configurations (handled by .env)

## Usage
- **Local development**: CLI uses this + your .env file
- **Production deployment**: GitHub Actions uses this + repository secrets
- **Team collaboration**: Everyone gets the same project_id via git