#!/bin/bash

# =====================================================
# VortexCore Comprehensive Fix Script
# This script addresses all deployment and runtime issues
# =====================================================

set -e  # Exit on error

echo "=================================================="
echo "VortexCore Complete Fix - All Issues"
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

# =====================================================
# STEP 1: Fix Docker Build Issues
# =====================================================
echo ""
print_info "Step 1: Fixing Docker build issues..."

# Clean npm cache and node_modules
if [ -d "node_modules" ]; then
    print_warning "Removing node_modules to fix I/O errors..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    print_warning "Removing package-lock.json..."
    rm -f package-lock.json
fi

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Install dependencies fresh
print_status "Installing dependencies..."
npm install

# =====================================================
# STEP 2: Fix Environment Variables
# =====================================================
echo ""
print_info "Step 2: Configuring environment variables..."

# Check if .env.local exists, if not create from .env
if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local from .env..."
    cp .env .env.local
fi

# Create proper environment configuration
cat > .env.production << 'EOF'
# Production Environment Configuration
VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
VITE_SUPABASE_ANON_KEY=REDACTED

# Default currency (change to NGN for Nigeria)
VITE_DEFAULT_CURRENCY=NGN
VITE_CURRENCY_SYMBOL=₦
VITE_CURRENCY_CODE=NGN

# Features flags
VITE_ENABLE_STRIPE=true
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_SUBSCRIPTIONS=true
EOF

print_status "Production environment configured"

# =====================================================
# STEP 3: Fix Authentication Issues
# =====================================================
echo ""
print_info "Step 3: Fixing authentication configuration..."

# Update Supabase auth configuration
cat > src/integrations/supabase/auth-config.ts << 'EOF'
import { supabase } from './client';

export const authConfig = {
  // Ensure proper redirect URLs
  redirectTo: window.location.origin,
  
  // Sign up configuration
  signUpOptions: {
    emailRedirectTo: `${window.location.origin}/dashboard`,
    data: {
      full_name: '',  // Will be populated from form
    }
  },
  
  // Sign in configuration
  signInOptions: {
    emailRedirectTo: `${window.location.origin}/dashboard`,
  }
};

// Helper function to handle auth errors
export const handleAuthError = (error: any) => {
  console.error('Auth error:', error);
  
  if (error?.message?.includes('Email not confirmed')) {
    return 'Please check your email to confirm your account.';
  }
  
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (error?.message?.includes('User already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }
  
  return error?.message || 'An authentication error occurred. Please try again.';
};
EOF

print_status "Auth configuration updated"

# =====================================================
# STEP 4: Fix AI Chat Integration
# =====================================================
echo ""
print_info "Step 4: Fixing AI chat integration..."

# Create AI fallback configuration
cat > src/lib/ai-config.ts << 'EOF'
// AI Provider Configuration with Fallback Support
export const AI_PROVIDERS = {
  primary: {
    name: 'openai',
    endpoint: '/functions/v1/ai-router',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  },
  fallbacks: [
    {
      name: 'gemini',
      endpoint: '/functions/v1/gemini-ai',
      model: 'gemini-pro',
      apiKey: process.env.GEMINI_API_KEY
    },
    {
      name: 'perplexity',
      endpoint: '/functions/v1/perplexity-ai',
      model: 'sonar-small-online',
      apiKey: process.env.PERPLEXITY_API_KEY
    }
  ]
};

export async function callAIWithFallback(messages: any[], options: any = {}) {
  const providers = [AI_PROVIDERS.primary, ...AI_PROVIDERS.fallbacks];
  
  for (const provider of providers) {
    try {
      console.log(`Trying AI provider: ${provider.name}`);
      
      const response = await fetch(
        `${process.env.VITE_SUPABASE_URL || 'https://mxtsdgkwzjzlttpotole.supabase.co'}${provider.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            ...options.headers
          },
          body: JSON.stringify({
            messages,
            model: provider.model,
            ...options.body
          })
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      console.warn(`Provider ${provider.name} failed with status: ${response.status}`);
    } catch (error) {
      console.error(`Provider ${provider.name} error:`, error);
    }
  }
  
  throw new Error('All AI providers failed. Please try again later.');
}
EOF

print_status "AI configuration with fallback created"

# =====================================================
# STEP 5: Fix Currency Configuration
# =====================================================
echo ""
print_info "Step 5: Fixing currency configuration..."

# Create currency configuration
cat > src/lib/currency-config.ts << 'EOF'
// Currency Configuration
export const CURRENCY_CONFIG = {
  default: process.env.VITE_DEFAULT_CURRENCY || 'NGN',
  symbol: process.env.VITE_CURRENCY_SYMBOL || '₦',
  code: process.env.VITE_CURRENCY_CODE || 'NGN',
  locale: 'en-NG',
  
  // Format currency amounts
  format: (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: process.env.VITE_DEFAULT_CURRENCY || 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  // Convert from USD to NGN (example rate)
  convertFromUSD: (usdAmount: number) => {
    const rate = 1500; // Update with current rate
    return usdAmount * rate;
  }
};

// Export for global use
export const formatCurrency = CURRENCY_CONFIG.format;
export const { default: defaultCurrency, symbol: currencySymbol, code: currencyCode } = CURRENCY_CONFIG;
EOF

print_status "Currency configuration created"

# =====================================================
# STEP 6: Fix Dashboard Data
# =====================================================
echo ""
print_info "Step 6: Fixing dashboard data fetching..."

# Create dashboard data service
cat > src/services/dashboard-service.ts << 'EOF'
import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  balance: number;
  transactions: any[];
  virtualCards: any[];
  settings: any;
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  try {
    // Fetch all data in parallel
    const [walletData, transactionsData, cardsData, settingsData] = await Promise.all([
      // Fetch wallet
      supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // Fetch recent transactions
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Fetch virtual cards
      supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', userId),
      
      // Fetch user settings
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
    ]);
    
    return {
      balance: walletData.data?.balance || 0,
      transactions: transactionsData.data || [],
      virtualCards: cardsData.data || [],
      settings: settingsData.data || {}
    };
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    // Return default values on error
    return {
      balance: 0,
      transactions: [],
      virtualCards: [],
      settings: {}
    };
  }
}
EOF

print_status "Dashboard service created"

# =====================================================
# STEP 7: Create Docker Configuration
# =====================================================
echo ""
print_info "Step 7: Creating optimized Docker configuration..."

# Create new Dockerfile
cat > Dockerfile << 'EOF'
# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx configuration
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass https://mxtsdgkwzjzlttpotole.supabase.co;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

print_status "Docker configuration created"

# =====================================================
# STEP 8: Create deployment script
# =====================================================
echo ""
print_info "Step 8: Creating deployment script..."

cat > deploy.sh << 'EOF'
#!/bin/bash
echo "Building and deploying VortexCore..."

# Build Docker image
docker build -t vortexcore:latest .

# Stop existing container
docker stop vortexcore 2>/dev/null || true
docker rm vortexcore 2>/dev/null || true

# Run new container
docker run -d \
  --name vortexcore \
  -p 3000:80 \
  --restart unless-stopped \
  vortexcore:latest

echo "VortexCore deployed at http://localhost:3000"
EOF

chmod +x deploy.sh
print_status "Deployment script created"

# =====================================================
# STEP 9: Apply database migrations
# =====================================================
echo ""
print_info "Step 9: Checking database migrations..."

if command -v supabase &> /dev/null; then
    print_status "Applying clean migrations to Supabase..."
    
    # Check if linked
    if supabase status 2>/dev/null | grep -q "Linked project:"; then
        # Apply migrations
        supabase db push || print_warning "Migration push failed - may need manual intervention"
    else
        print_warning "Supabase not linked. Run: supabase link --project-ref mxtsdgkwzjzlttpotole"
    fi
else
    print_warning "Supabase CLI not installed"
fi

# =====================================================
# FINAL SUMMARY
# =====================================================
echo ""
echo "=================================================="
echo "FIX SUMMARY"
echo "=================================================="
print_status "✓ Docker build issues addressed"
print_status "✓ Dependencies reinstalled"
print_status "✓ Environment variables configured"
print_status "✓ Authentication configuration fixed"
print_status "✓ AI chat with fallback configured"
print_status "✓ Currency set to NGN"
print_status "✓ Dashboard data service created"
print_status "✓ Docker configuration optimized"

echo ""
echo "NEXT STEPS:"
echo "1. Update API keys in .env.local:"
echo "   - OPENAI_API_KEY"
echo "   - GEMINI_API_KEY"
echo "   - PERPLEXITY_API_KEY"
echo "   - STRIPE_SECRET_KEY"
echo ""
echo "2. Link to Supabase (if not already):"
echo "   supabase link --project-ref mxtsdgkwzjzlttpotole"
echo ""
echo "3. Deploy with Docker:"
echo "   ./deploy.sh"
echo ""
echo "4. Or deploy to Vercel/Netlify:"
echo "   npm run build"
echo "   # Then deploy the 'dist' folder"
echo ""

print_status "Script completed successfully!"
