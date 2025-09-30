#!/bin/bash
echo "🧪 Quick Authentication Test"
echo "=========================="

# Test local development
echo "1. Starting development server..."
bun run dev &
DEV_PID=$!

sleep 5

echo "2. Testing endpoints..."
curl -s http://localhost:5173/health || echo "❌ Health endpoint failed"
curl -s http://localhost:5173/api/health || echo "❌ API health endpoint failed"

echo "3. Open test page:"
echo "   http://localhost:5173/test-auth"

echo ""
echo "Press Ctrl+C to stop dev server"
wait $DEV_PID
