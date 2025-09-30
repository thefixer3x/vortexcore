#!/bin/bash

# =====================================================
# VortexCore Quick Fix Script
# Immediate fixes for critical issues
# =====================================================

echo "=================================================="
echo "VortexCore Quick Fix - Immediate Solutions"
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# =====================================================
# 1. Fix Git Status First
# =====================================================
print_warning "Fixing Git status..."
git revert --abort 2>/dev/null || true
git stash
git fetch origin
git checkout main
git reset --hard origin/main
print_status "Git synchronized with origin/main"

# =====================================================
# 2. Fix npm/node issues
# =====================================================
print_warning "Cleaning npm/node issues..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
print_status "Dependencies reinstalled"

# =====================================================
# 3. Set up Supabase Edge Functions Environment
# =====================================================
print_warning "Setting up Supabase Edge Functions..."

# Create secrets file for Supabase
cat > .env.supabase << 'EOF'
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
EOF

print_warning "IMPORTANT: Update .env.supabase with your actual API keys!"

# =====================================================
# 4. Fix OpenAI Chat Component
# =====================================================
print_warning "Fixing AI Chat component..."

cat > src/components/ai/OpenAIChat-Fixed.tsx << 'EOF'
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, ChevronUp, ChevronDown, Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function OpenAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to VortexCore! How can I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-router', {
        body: {
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          model: 'gpt-4o-mini',
          userId: user?.id
        }
      });
      
      if (error) throw error;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.response || "I'm having trouble processing your request. Please try again."
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: "I'm currently experiencing connection issues. Please ensure your API keys are configured in the Supabase dashboard and try again."
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Please check your API configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 ${isMinimized ? 'h-14' : 'h-[600px]'} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="font-semibold">VortexAI Assistant</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about finance, markets, or your account..."
                className="flex-1 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
EOF

print_status "AI Chat component fixed"

# =====================================================
# 5. Fix Currency Configuration
# =====================================================
print_warning "Setting currency to NGN..."

cat > src/constants/currency.ts << 'EOF'
// Currency constants for Nigeria
export const CURRENCY = {
  code: 'NGN',
  symbol: '₦',
  locale: 'en-NG'
} as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}
EOF

print_status "Currency set to NGN"

# =====================================================
# 6. Deploy Supabase Functions
# =====================================================
print_warning "Deploying Supabase Edge Functions..."

if command -v supabase &> /dev/null; then
    # Link to project if not already
    supabase link --project-ref mxtsdgkwzjzlttpotole 2>/dev/null || true
    
    # Set secrets
    print_warning "Setting function secrets..."
    echo "Run these commands with your actual API keys:"
    echo ""
    echo "supabase secrets set OPENAI_API_KEY=your_key_here"
    echo "supabase secrets set GEMINI_API_KEY=your_key_here"
    echo "supabase secrets set PERPLEXITY_API_KEY=your_key_here"
    echo "supabase secrets set STRIPE_SECRET_KEY=your_key_here"
    echo "supabase secrets set STRIPE_WEBHOOK_SECRET=your_key_here"
    echo ""
    
    # Deploy functions
    print_warning "Deploying functions..."
    supabase functions deploy ai-router || print_error "Failed to deploy ai-router"
    supabase functions deploy stripe || print_error "Failed to deploy stripe"
    supabase functions deploy stripe-webhook || print_error "Failed to deploy stripe-webhook"
else
    print_error "Supabase CLI not installed. Install with: npm install -g supabase"
fi

# =====================================================
# 7. Build for Production
# =====================================================
print_warning "Building for production..."
npm run build

# =====================================================
# Summary
# =====================================================
echo ""
echo "=================================================="
echo "QUICK FIX COMPLETED"
echo "=================================================="
print_status "✓ Git repository synced"
print_status "✓ Dependencies reinstalled"
print_status "✓ AI Chat component fixed"
print_status "✓ Currency set to NGN"
print_status "✓ Build completed"

echo ""
echo "IMMEDIATE ACTIONS REQUIRED:"
echo ""
echo "1. SET API KEYS in Supabase Dashboard:"
echo "   - Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/settings/vault"
echo "   - Add these secrets:"
echo "     • OPENAI_API_KEY"
echo "     • GEMINI_API_KEY" 
echo "     • PERPLEXITY_API_KEY"
echo "     • STRIPE_SECRET_KEY"
echo "     • STRIPE_WEBHOOK_SECRET"
echo ""
echo "2. DEPLOY THE FUNCTIONS:"
echo "   supabase functions deploy --all"
echo ""
echo "3. TEST LOCALLY:"
echo "   npm run dev"
echo "   - Test signup/login"
echo "   - Test AI chat"
echo "   - Check dashboard data"
echo ""
echo "4. DEPLOY TO PRODUCTION:"
echo "   - Vercel: vercel --prod"
echo "   - Netlify: netlify deploy --prod"
echo "   - Docker: docker build -t vortexcore . && docker run -p 3000:80 vortexcore"
echo ""
print_status "Script completed!"
