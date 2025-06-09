#!/bin/bash

# VortexCore Webhook Fix Script
echo "🚀 VortexCore Webhook Fix Script"
echo "================================="
echo ""

# Check current directory
echo "📍 Current directory: $(pwd)"
echo ""

# Check .env file
echo "🔑 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "Current configuration:"
    grep -E "(VITE_SUPABASE_|OPENAI_)" .env | head -3 || echo "No API keys configured yet"
else
    echo "❌ .env file not found"
fi
echo ""

# Check Supabase functions
echo "🔧 Checking Supabase functions..."
if [ -d "supabase/functions" ]; then
    echo "✅ Functions directory found"
    echo "Available functions:"
    ls supabase/functions/
else
    echo "❌ No supabase/functions directory found"
fi
echo ""

# Show project info
echo "📋 Supabase Project Information:"
echo "Project ID: mxtsdgkwzjzlttpotole"
echo "Project URL: https://mxtsdgkwzjzlttpotole.supabase.co"
echo ""
echo "To get your API keys:"
echo "1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/settings/api"
echo "2. Copy the 'anon public' key"
echo ""

# Check if user wants to configure keys
echo "❓ Do you want to configure API keys now? (y/n):"
read -r configure_keys

if [[ "$configure_keys" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Enter your Supabase anon key:"
    read -r supabase_key
    
    if [ -n "$supabase_key" ]; then
        # Update .env file
        if grep -q "VITE_SUPABASE_ANON_KEY=" .env 2>/dev/null; then
            sed -i '' "s/VITE_SUPABASE_ANON_KEY=.*/VITE_SUPABASE_ANON_KEY=$supabase_key/" .env
        else
            echo "VITE_SUPABASE_ANON_KEY=$supabase_key" >> .env
        fi
        echo "✅ Supabase anon key configured"
    fi
    
    echo ""
    echo "Enter your OpenAI API key (optional, press Enter to skip):"
    read -r openai_key
    
    if [ -n "$openai_key" ]; then
        if grep -q "OPENAI_API_KEY=" .env 2>/dev/null; then
            sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        else
            echo "OPENAI_API_KEY=$openai_key" >> .env
        fi
        echo "✅ OpenAI API key configured"
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If you configured API keys, restart your development server"
echo "2. Test your webhook endpoints at:"
echo "   https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/"
echo "3. Check the browser console for any remaining errors"
echo ""

echo "❓ Do you want to start the development server? (y/n):"
read -r start_server

if [[ "$start_server" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting development server..."
    npm run dev
fi

echo ""
echo "✅ Webhook fix script completed!"
echo "If you still see errors, check the API keys in your Supabase dashboard."
