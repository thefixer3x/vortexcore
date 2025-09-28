# VortexCore AI Chat Setup Guide

This guide helps you set up and troubleshoot the AI chat functionality in VortexCore.

## 🚨 Quick Fix for AI Chat Issues

If your AI chat is not working, follow these steps:

### 1. Check Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update your `.env` file with these required values:**
   ```bash
   # Get these from: https://supabase.com/dashboard/project/_/settings/api
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### 2. Configure Supabase Function Environment Variables

The AI functions need API keys to work. Set these in your Supabase dashboard:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **Edge Functions** → **Environment Variables**
3. Add these variables:

   ```bash
   # Required for OpenAI functionality
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Required for Gemini functionality  
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # Optional for real-time data
   PERPLEXITY_API_KEY=your-perplexity-api-key-here
   ```

### 3. Get Your API Keys

- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Gemini API Key**: https://makersuite.google.com/app/apikey
- **Perplexity API Key**: https://www.perplexity.ai/settings/api

### 4. Deploy Functions (if self-hosting)

If you're deploying your own Supabase functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy ai-router
supabase functions deploy gemini-ai
supabase functions deploy openai-chat
```

## 🔧 Development Mode Diagnostics

In development mode, you'll see an **AI Configuration Status** card that helps diagnose issues:

- ✅ **Green checkmarks**: Configuration is correct
- ❌ **Red X marks**: Configuration missing or incorrect
- ⚠️ **Warnings**: Configuration may need attention

## 🐛 Common Issues and Solutions

### Issue: "Supabase configuration missing"
**Solution**: Copy `.env.example` to `.env` and update with your Supabase credentials.

### Issue: "AI service is not configured"
**Solution**: Add API keys to your Supabase Edge Functions environment variables.

### Issue: "Failed to get a response from the AI assistant"
**Possible causes:**
1. API keys not set in Supabase
2. API key quota exceeded
3. Network connectivity issues
4. Functions not deployed

### Issue: "Authentication required"
**Solution**: Some AI features may require user authentication. Sign in to access full functionality.

## 🏗️ Architecture Overview

VortexCore uses a cascading AI provider system:

```
User Input → ai-router → OpenAI (primary)
                     ↓
                   Gemini (fallback)  
                     ↓
                   Perplexity (real-time data)
```

### Components Involved

1. **`GeminiAIChat.tsx`**: Direct Gemini integration (floating bubble)
2. **`useVortexChat.ts`**: Smart router hook (ecosystem app)
3. **`ai-router`**: Supabase function with provider fallback
4. **`gemini-ai`**: Direct Gemini API integration  
5. **`openai-chat`**: Direct OpenAI API integration

## 📊 Monitoring and Analytics

The application includes:
- LogRocket integration for user session tracking
- Error tracking with detailed error messages
- Performance monitoring for AI response times

## 🔒 Security Considerations

- API keys are stored in Supabase Edge Functions (server-side)
- PII (Personal Identifiable Information) is filtered from requests
- Rate limiting is implemented to prevent abuse
- CORS headers are properly configured

## 🆘 Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Use the configuration status card** in development mode
3. **Test your API keys** directly in their respective platforms
4. **Check Supabase function logs** in your dashboard
5. **Verify your environment variables** are properly set

## 📝 Environment Variables Reference

### Client-side (.env)
```bash
# Required
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
VITE_LOGROCKET_APP_ID=your-logrocket-app-id
```

### Server-side (Supabase Edge Functions)
```bash
# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
PERPLEXITY_API_KEY=your-perplexity-api-key-here

# Supabase (automatically provided)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

**Need more help?** Check the [repository issues](https://github.com/thefixer3x/vortexcore/issues) or create a new one with details about your specific problem.