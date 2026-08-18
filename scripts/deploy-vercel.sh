#!/bin/bash
set -e

echo "Deploying to Vercel..."
echo "Token: ${VERCEL_TOKEN:0:8}..."
echo "Org ID: ${VERCEL_ORG_ID:0:20}..."
echo "Project ID: ${VERCEL_PROJECT_ID:0:20}..."

# Use npx vercel to deploy with explicit token and project
npx vercel deploy --token="$VERCEL_TOKEN" --prod --confirm --prebuilt --cwd . 2>&1 || {
    echo "Deploy failed, trying without --prod flag..."
    npx vercel deploy --token="$VERCEL_TOKEN" --confirm --prebuilt --cwd . 2>&1
}