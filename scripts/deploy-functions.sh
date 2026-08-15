#!/bin/bash

# Supabase Edge Function Deployment Script

echo "🚀 Deploying Edge Functions to Supabase..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Check for required environment variables
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF environment variable is required"
  exit 1
fi

# Deploy functions with proper JWT verification (security best practice)
echo "📦 Deploying openai-assistant function..."
bunx supabase functions deploy openai-assistant --project-ref "$SUPABASE_PROJECT_REF"

echo "📦 Deploying gemini-ai function..."
bunx supabase functions deploy gemini-ai --project-ref "$SUPABASE_PROJECT_REF"

echo "📦 Deploying ai-router function..."
bunx supabase functions deploy ai-router --project-ref "$SUPABASE_PROJECT_REF"

echo "📦 Deploying stripe functions..."
bunx supabase functions deploy stripe --project-ref "$SUPABASE_PROJECT_REF"

echo "✅ Deployment complete with JWT verification enabled (secure)!"
