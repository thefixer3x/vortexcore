#!/bin/bash

# Supabase Edge Function Deployment Script

echo "🚀 Deploying Edge Functions to Supabase..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Deploy functions
echo "📦 Deploying openai-assistant function..."
npx supabase functions deploy openai-assistant --project-ref muyhurqfcsjqtnbozyir

echo "📦 Deploying gemini-ai function..."
npx supabase functions deploy gemini-ai --project-ref muyhurqfcsjqtnbozyir

# Update JWT settings
echo "🔒 Updating JWT settings for each function..."
npx supabase functions deploy openai-assistant --no-verify-jwt --project-ref muyhurqfcsjqtnbozyir
npx supabase functions deploy gemini-ai --no-verify-jwt --project-ref muyhurqfcsjqtnbozyir

echo "✅ Deployment complete!"
