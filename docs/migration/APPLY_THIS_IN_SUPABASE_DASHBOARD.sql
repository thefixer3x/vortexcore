-- Supabase Performance Optimization: Extension Updates
-- Run this in your Supabase Dashboard SQL Editor

-- Check current extension versions
SELECT name, installed_version, default_version 
FROM pg_available_extensions 
WHERE installed_version != default_version;

-- Update extensions to latest versions
-- Note: Replace 'latest' with actual version numbers if needed
ALTER EXTENSION IF EXISTS "wrappers" UPDATE;
ALTER EXTENSION IF EXISTS "supabase_vault" UPDATE;
ALTER EXTENSION IF EXISTS "pg_graphql" UPDATE;
ALTER EXTENSION IF EXISTS "pg_stat_statements" UPDATE;
ALTER EXTENSION IF EXISTS "pg_cron" UPDATE;
ALTER EXTENSION IF EXISTS "pg_net" UPDATE;
ALTER EXTENSION IF EXISTS "pg_tle" UPDATE;
ALTER EXTENSION IF EXISTS "pg_jsonschema" UPDATE;
ALTER EXTENSION IF EXISTS "pg_plan_filter" UPDATE;
ALTER EXTENSION IF EXISTS "pg_permissions" UPDATE;

-- Check extensions that might not be needed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname NOT IN ('plpgsql', 'pg_stat_statements', 'pg_catalog');

-- Optionally disable unused extensions to reduce overhead
-- Only run these if you're certain you're not using these features:
/*
DROP EXTENSION IF EXISTS wrappers CASCADE;  -- Only if not using foreign data wrappers
DROP EXTENSION IF EXISTS pg_graphql CASCADE; -- Only if not using GraphQL
DROP EXTENSION IF EXISTS pg_cron CASCADE; -- Only if not using cron jobs
*/