#!/bin/bash

# =====================================================
# Fix Netlify Dev Server Issues
# =====================================================

echo "=================================================="
echo "Fixing Netlify Dev Server"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# Kill any existing dev servers
print_warning "Stopping existing dev servers..."
pkill -f "netlify dev" 2>/dev/null || true
pkill -f "bun run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment
sleep 2

# Start Vite dev server in background
print_status "Starting Vite dev server..."
bun run dev &
VITE_PID=$!

# Wait for Vite to start
sleep 5

# Check if Vite is running
if curl -s http://localhost:5173 > /dev/null; then
    print_status "Vite dev server running on port 5173"
else
    print_error "Vite dev server failed to start"
    kill $VITE_PID 2>/dev/null || true
    exit 1
fi

# Now start Netlify dev to proxy to Vite
print_status "Starting Netlify dev server..."
netlify dev --live &
NETLIFY_PID=$!

echo ""
print_status "Servers started!"
echo "Vite: http://localhost:5173"
echo "Netlify: http://localhost:8080"
echo ""
print_warning "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap 'kill $VITE_PID $NETLIFY_PID 2>/dev/null; exit' INT
wait
