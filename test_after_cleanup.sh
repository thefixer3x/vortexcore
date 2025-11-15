#!/bin/bash

echo "🧪 Testing VortexCore after environment cleanup"
echo "=============================================="

echo "1. Deploying to production..."
vercel --prod

echo ""
echo "2. Testing health endpoints..."
PROD_URL=$(vercel ls | grep "https://" | head -1 | awk '{print $1}')
echo "Production URL: $PROD_URL"

if [ ! -z "$PROD_URL" ]; then
    echo "Testing health endpoint..."
    curl -s "$PROD_URL/health" || echo "❌ Health endpoint failed"
    
    echo ""
    echo "Testing API health endpoint..."
    curl -s "$PROD_URL/api/health" || echo "❌ API health endpoint failed"
    
    echo ""
    echo "✅ Test complete!"
    echo "🌐 Visit: $PROD_URL/test-auth to test authentication"
else
    echo "❌ Could not determine production URL"
fi
