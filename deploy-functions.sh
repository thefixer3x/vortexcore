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
echo "🔒 Updating JWT settings in config.toml..."
npx supabase functions config update --verify-jwt false --project-ref muyhurqfcsjqtnbozyir

echo "✅ Deployment complete!"
