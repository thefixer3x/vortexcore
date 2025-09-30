#!/bin/bash

# Supabase Edge Function Deployment Script

echo "🚀 Deploying Edge Functions to Supabase..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Deploy functions
echo "📦 Deploying openai-assistant function..."
npx supabase functions deploy openai-assistant --project-ref mxtsdgkwzjzlttpotole

echo "📦 Deploying gemini-ai function..."
npx supabase functions deploy gemini-ai --project-ref mxtsdgkwzjzlttpotole

# Update JWT settings
echo "🔒 Updating JWT settings for each function..."
npx supabase functions deploy openai-assistant --no-verify-jwt --project-ref mxtsdgkwzjzlttpotole
npx supabase functions deploy gemini-ai --no-verify-jwt --project-ref mxtsdgkwzjzlttpotole

echo "✅ Deployment complete!"
