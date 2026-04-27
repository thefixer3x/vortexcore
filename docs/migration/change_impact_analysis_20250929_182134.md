# 🔍 Change Impact Analysis Report

## Summary
This report analyzes all potential impacts of our VortexCore deployment changes.

## 1. Supabase Project Analysis
### Project Status
failed to inspect container health: Cannot connect to the Docker daemon at unix:///Users/seyederick/.colima/default/docker.sock. Is the docker daemon running?
Try rerunning the command with --debug to troubleshoot the error.
### Database Connectivity Test
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
### Edge Functions Status

  
   ID                                   | NAME                    | SLUG                    | STATUS | VERSION | UPDATED_AT (UTC)    
  --------------------------------------|-------------------------|-------------------------|--------|---------|---------------------
   7d36edd3-05dd-49c4-b3a4-ea1367f96eaa | openai                  | openai                  | ACTIVE | 25      | 2025-05-17 09:45:16 
   0919839c-8b54-4cb6-b06e-25c43b40b06f | openai-assistant        | openai-assistant        | ACTIVE | 30      | 2025-09-28 05:14:29 
   182a47fb-0172-48b4-a7e6-6be00cdc3182 | etl-daily-edoc          | etl-daily-edoc          | ACTIVE | 26      | 2025-06-02 20:53:15 
   fd23c99a-f46e-4763-bcc1-4b8f305ff801 | prembly                 | prembly                 | ACTIVE | 26      | 2025-06-01 14:38:39 
   c636b13c-a0c9-44b7-ab8b-8d5d5fdaa116 | gateway                 | gateway                 | ACTIVE | 28      | 2025-06-01 14:38:39 
   d2e9ab74-934f-4e74-9a3d-5a62b75a51de | paystack                | paystack                | ACTIVE | 28      | 2025-06-01 14:38:39 
   749df2ab-15fb-4590-bebc-65a6bb378997 | stripe                  | stripe                  | ACTIVE | 27      | 2025-09-28 12:00:53 
   db6300a1-a990-4869-b07a-86a1cb5b86d0 | flutterwave             | flutterwave             | ACTIVE | 27      | 2025-06-01 14:38:39 
   b3c94bee-b2f2-466e-9f8f-25569c5ebe04 | sayswitch               | sayswitch               | ACTIVE | 23      | 2025-06-01 14:38:39 
   60aff40e-8638-44b7-a74b-39c09ed1235b | edoc                    | edoc                    | ACTIVE | 22      | 2025-06-01 14:38:39 
   7440e717-da32-4ea6-83df-2aa0c507088a | edocWebhook             | edocWebhook             | ACTIVE | 22      | 2025-06-01 14:38:39 
   f27f1ccd-472e-4519-a548-33807249f816 | consent-status          | consent-status          | ACTIVE | 22      | 2025-06-02 20:53:15 
   976109c5-d761-4e6d-88df-0eb1c6cabca6 | delete-consent          | delete-consent          | ACTIVE | 22      | 2025-06-02 20:53:15 
   091c1610-ffcc-4ab2-9e08-a9b0c76eae89 | edoc-dashboard          | edoc-dashboard          | ACTIVE | 22      | 2025-06-02 20:53:15 
   2c786111-d825-4217-a433-125bc44ebad2 | edoc-webhook            | edoc-webhook            | ACTIVE | 23      | 2025-07-12 21:48:22 
   265bce5c-9c3a-4d35-bb3e-0af55b5e147a | init-consent            | init-consent            | ACTIVE | 22      | 2025-06-02 20:53:15 
   8a1f5b92-2cda-45b7-85da-a2b6237ecb59 | ai-router               | ai-router               | ACTIVE | 23      | 2025-06-15 12:22:59 
   fa3b040d-20b2-4e6f-91ff-17b8b33c8aae | gemini-ai               | gemini-ai               | ACTIVE | 22      | 2025-06-08 22:46:57 
   464fbfaf-c6a2-4535-a1a7-8834713ad4e7 | callback-handler        | callback-handler        | ACTIVE | 23      | 2025-09-28 05:14:26 
   bdcaa288-2848-4969-8f1b-95afba3a7cc4 | verify                  | verify                  | ACTIVE | 22      | 2025-06-08 22:57:12 
   b7ba8b27-392f-4ada-a5f8-835dfdeec492 | payment                 | payment                 | ACTIVE | 22      | 2025-06-08 22:57:21 
   462f4082-abdb-4912-8251-0fd2f1d3b1f0 | chat                    | chat                    | ACTIVE | 22      | 2025-06-08 22:57:31 
   9614f487-e577-4f40-8d04-587b66ee2202 | nixie-ai                | nixie-ai                | ACTIVE | 23      | 2025-06-15 16:14:57 
   6cdd3add-4057-429b-a2c8-750ff2b5546b | nixie-ai-streaming      | nixie-ai-streaming      | ACTIVE | 23      | 2025-06-15 16:14:57 
   7ac80163-6ae1-42d2-b92e-9e35aa6adffb | parent-dashboard        | parent-dashboard        | ACTIVE | 23      | 2025-06-15 16:14:57 
   cf984ef4-c18a-4943-82b2-fcc2a39731eb | stripe-webhook          | stripe-webhook          | ACTIVE | 25      | 2025-09-28 05:14:23 
   ceb1a334-dcae-4126-a59b-89646c0f2cbc | create-checkout-session | create-checkout-session | ACTIVE | 23      | 2025-06-15 16:14:57 
   fc0a0067-2c33-4246-a4ff-bb8e26da65fc | openai-chat             | openai-chat             | ACTIVE | 23      | 2025-09-28 05:14:32 
   2b4979f8-62f1-4480-b7a4-ec16a9cbc145 | auth                    | auth                    | ACTIVE | 23      | 2025-09-28 05:14:24 
   06e76acf-da96-4aad-8315-1e30b5a73e96 | claude-ai               | claude-ai               | ACTIVE | 20      | 2025-06-15 16:14:57 
   c6b249f6-b08f-4734-89bc-10bd42d4ba36 | create-portal-session   | create-portal-session   | ACTIVE | 20      | 2025-06-15 16:14:57 
   0ba4c1bd-1959-47cd-bd7f-93c393a06a33 | payments-gateway        | payments-gateway        | ACTIVE | 20      | 2025-07-12 21:41:59 
   25975b39-9ff3-43f2-8d70-362c82b8f8aa | health-check            | health-check            | ACTIVE | 20      | 2025-07-12 21:42:12 
   6c854bed-00ef-4c3f-b136-10e3ed2d5f89 | ai-chat                 | ai-chat                 | ACTIVE | 20      | 2025-07-12 21:46:39 
   34933058-bb8a-4469-961f-de76c8b041cb | bizgenie-router         | bizgenie-router         | ACTIVE | 20      | 2025-07-12 21:46:51 
   fbaf2537-4899-4c0a-8564-4781bbb1a713 | personalized-ai-chat    | personalized-ai-chat    | ACTIVE | 20      | 2025-07-12 21:46:53 
   925a4f70-568e-4b14-aad0-171646aef192 | cache-cleanup           | cache-cleanup           | ACTIVE | 20      | 2025-07-12 21:46:54 
   70c591d9-0d41-4953-8547-7548801f2524 | setup-cron-jobs         | setup-cron-jobs         | ACTIVE | 20      | 2025-07-12 21:47:05 
   bd6a3b5b-7f83-4845-bd91-63ee9d79eff7 | stripe-subscription     | stripe-subscription     | ACTIVE | 20      | 2025-07-12 21:47:07 
   257b2a9a-08d6-4dcd-bad7-2fa16df038df | stripe-connect          | stripe-connect          | ACTIVE | 20      | 2025-07-12 21:47:09 
   7abc78bd-ec9f-459f-bdc0-374bc2b8cf40 | stripe-issuing          | stripe-issuing          | ACTIVE | 20      | 2025-07-12 21:47:20 
   af880d7d-3c9f-46d8-9acd-0d856972687f | create-stripe-checkout  | create-stripe-checkout  | ACTIVE | 20      | 2025-07-12 21:47:22 
   ac0fc859-82a8-44bb-a956-29f6c07bb4d2 | create-notification     | create-notification     | ACTIVE | 20      | 2025-07-12 21:47:23 
   575a71cd-32ee-4b0c-952c-889f7ac107df | edoc-consent            | edoc-consent            | ACTIVE | 20      | 2025-07-12 21:47:31 
   ccc7f5e4-d6f3-4907-b456-4924ee09366a | edoc-transactions       | edoc-transactions       | ACTIVE | 20      | 2025-07-12 21:47:32 
   f3e7c8c2-5c71-4572-bf83-189f333e8284 | process-bulk-payment    | process-bulk-payment    | ACTIVE | 20      | 2025-07-12 21:47:33 
   d7d4d1cf-8763-4870-8b98-d8157ef83af0 | paypal-payment          | paypal-payment          | ACTIVE | 20      | 2025-07-12 21:47:50 
   84a27d81-951a-4de4-a8d3-f89c2161aee1 | sayswitch-bills         | sayswitch-bills         | ACTIVE | 20      | 2025-07-12 21:47:52 
   91dfb3d4-5ef5-40f0-9c5f-9dd4925a82e8 | sayswitch-payment       | sayswitch-payment       | ACTIVE | 20      | 2025-07-12 21:47:54 
   4e939f38-076b-4d43-ae38-10e7f46cb842 | sayswitch-transfer      | sayswitch-transfer      | ACTIVE | 20      | 2025-07-12 21:48:09 
   04e102c8-4108-40be-9175-30ff03291854 | paypal-webhook          | paypal-webhook          | ACTIVE | 20      | 2025-07-12 21:48:13 
   2c3cc508-a8cf-40b3-b929-9ae8c3086822 | sayswitch-webhook       | sayswitch-webhook       | ACTIVE | 20      | 2025-07-12 21:48:24 
   dd9bbc74-4411-457a-adc6-5f097c413705 | i18n-translator         | i18n-translator         | ACTIVE | 8       | 2025-07-19 08:08:44 
   d8a343fe-bba8-4e96-ad51-2dec9626c0e2 | hash-api-key            | hash-api-key            | ACTIVE | 11      | 2025-08-12 17:08:30 
   9c0c1237-1e0b-4bc5-8d53-3f7146920d25 | verify-api-key          | verify-api-key          | ACTIVE | 8       | 2025-08-12 16:53:31 
   cfb80de4-0684-4df9-abb1-5e35548ddecc | auth-hook-user-created  | auth-hook-user-created  | ACTIVE | 8       | 2025-08-13 02:15:59 
   dca89802-8b61-4909-9dfc-a02bedcb9b60 | auth-redirect-hook      | auth-redirect-hook      | ACTIVE | 11      | 2025-09-02 22:45:08 
   a82f690a-a4f5-45a3-9424-60ef383229ae | mcp-handler             | mcp-handler             | ACTIVE | 17      | 2025-09-17 16:32:44 
   2d534b4a-ab70-4fb5-881d-004e36681228 | generate-embedding      | generate-embedding      | ACTIVE | 7       | 2025-09-17 15:37:41 

A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
### Secrets Configuration

  
   NAME                      | DIGEST                                                           
  ---------------------------|------------------------------------------------------------------
   AI_PROVIDER               | 5d72436256ada53828b51895a94bb8489e9f1ac4fe937a8024ef1594e7045ff6 
   DEEPSEEK_API_KEY          | 25dd856edc43de2097394bdcc57b3404abd124e60cbcda0b5fa26a2dab80b838 
   EDOC_API_URL              | fa3f6d99ea6c8e52074083c58b4f1b260d23115186a038faeb46d67234adbc33 
   EDOC_CLIENT_ID            | 6a1781e3cde39c7f2bf9e0abda9f3f2e9dfff42732a6a33adfb0ff5ebadfe19c 
   EDOC_PUBLIC_KEY           | 0ec87c0c4a04ac6698800e21977499035f071cb3dc76ff80afab304910c1d55c 
   EDOC_SECRET_KEY           | 063c703fd3e4cab95ef87749f8aaf5da37d22d5453e91d17c1de939ec9353b75 
   ELEVENLABS_API_KEY        | b09b5424ce3bbcaa832f5151dc9b2d438a3a2040e248b615f88ad43029d870ab 
   FLW_ENCRYPT_KEY_TEST      | f66b336b04a13d21885b16fcf0caabaed182bb164c5189da0c3e412434b75114 
   FLW_PUBLIC_KEY_TEST       | 20aec929d90d6e225695e47214129195748a3ea1b4e546abcb74a0b601b2fc68 
   FLW_SECRET_KEY            | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 
   FLW_SECRET_KEY_TEST       | 23c57a1173b8718d6609c02cf42bf90be5429cea835bb331f8087594055b5916 
   GEMINI_API_KEY            | a8a82c96fa627d9e0a9f650909b0476dc8ef797d82afee525cc29d81d2f61f55 
   MODE                      | ef260e9aa3c673af240d17a2660480361a8e081d1ffeca2a5ed0e3219fc18567 
   OPENAI_API_KEY            | d66182364c0891b5aadf383dbdd1f1d7e8d4a37beccb4f566cf5f6a073b48a20 
   OPENROUTER_API_KEY        | 25dd856edc43de2097394bdcc57b3404abd124e60cbcda0b5fa26a2dab80b838 
   OPENROUTER_DEFAULT_MODEL  | 94d9f0da97276443ab83dd315d000eef5751916f8d4849c468859bd51b21d79f 
   PERPLEXITY_API_KEY        | 1e9167c1ec4bb43c32c844a1726645171f12544ce7d21a1cde44c67432d4dab7 
   PSTACK_SECRET_KEY         | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 
   PSTACK_SECRET_KEY_TEST    | 3d09192f28ab5e431b89e0901eda3221f904b145fb6a4b76c53413711780841a 
   Pica_SK                   | 05edd5eb9ba832b2286a73ec89216c9df340cf8e80468ffa0ce821f6bac56c03 
   STRIPE_SECRET_KEY         | 1ea9a05636847efde95160b1684ffc99e8a5719057c105a07c4f78f6b398f249 
   STRIPE_WEBHOOK_SECRET     | cf0dbd3d736f2666dc005e89417eddd9b3b0358c7ef6297a52d91acedaba23b5 
   SUPABASE_ANON_KEY         | edc0bc08c72411ef416aa4ba2014825173db50e40d1033ca468b5d82897c3283 
   SUPABASE_DB_URL           | 310ba8132d9975c0f550519eb5737f55cc2caae4840d5c1499ea6ed68ed7a9a1 
   SUPABASE_SERVICE_ROLE_KEY | c2dc9702c6b01ed145bc94c5dff17228aa356d52786e2443a4b817f2a5496c86 
   SUPABASE_URL              | 88d697c9a9a628066bd0dff3f22473808343f4c4839775cdab160a495744ba17 
   SaySwitch_ live_sk        | ab2a369c29b0c27168f76af2c670467fc7844b7ac47a43a1d29a64271b510e2d 
   SaySwitch_live_PK         | ce176345c7e48d4437cfb8c40dd6e91c47ceec3dbbb801db2695858e25342f79 
   Stripe_PK                 | 45897cd7beafa2dc00ae13c19f50985411cb7547d30fd0ea9ce722389c23c3eb 
   Stripe_SK                 | 1ea9a05636847efde95160b1684ffc99e8a5719057c105a07c4f78f6b398f249 

A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
## 2. Authentication Configuration Analysis
### Modified Auth Files
#### src/utils/auth-config.ts
✅ File exists
```typescript
// Auth configuration utilities
export const getRedirectUrl = (path: string = '/dashboard') => {
  const currentOrigin = window.location.origin;
  
  // If running locally, use production URL for magic links
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    // Try to detect deployment URLs from environment or use fallback
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    const netlifyUrl = import.meta.env.VITE_NETLIFY_URL;
    
    // Priority: Vercel > Netlify > hardcoded fallback
    if (vercelUrl) {
      return `https://${vercelUrl}${path}`;
    } else if (netlifyUrl) {
      return `https://${netlifyUrl}${path}`;
    } else {
      // Fallback - you'll need to update this with your actual deployment URL
      return `https://vortexcore-testing.vercel.app${path}`;
    }
  }
```

#### src/hooks/use-auth-fix.ts
✅ File exists
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getRedirectUrl } from '@/utils/auth-config';

export function useAuthFix() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // First, try to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
          emailRedirectTo: getRedirectUrl('/dashboard'),
```

#### src/pages/TestAuth.tsx
✅ File exists
```typescript
import { useState } from 'react';
import { useAuthFix } from '@/hooks/use-auth-fix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectUrl } from '@/utils/auth-config';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const { signUp, signIn, signOut } = useAuthFix();

  // Check current user on load
```

#### supabase/config.toml
✅ File exists
```typescript
project_id = "mxtsdgkwzjzlttpotole"

[db]
major_version = 15

[functions]
  # Default; set per-function below if needed
  # verify_jwt = false

[functions.stripe]
  verify_jwt = true

[functions.ai-router]
  verify_jwt = false

[functions.openai-assistant]
  verify_jwt = false

[functions.openai-chat]
  verify_jwt = false
```

## 3. Environment Variables Analysis
### Local Environment (.env)
#### Current .env contents (sanitized):
# VortexCore Environment Configuration
# Copy this file and update with your actual credentials

# Database password for PostgreSQL services
POSTGRES_PASSWORD=***HIDDEN***

# Read-only user password used by init-db.sql
VORTEX_READONLY_PASSWORD=***HIDDEN***

# Redis authentication password
REDIS_PASSWORD=***HIDDEN***

# Kong database password
KONG_PG_PASSWORD=***HIDDEN***

# SMTP credentials for auth-service emails
SMTP_PASS=***HIDDEN***

# Grafana admin password
GF_SECURITY_ADMIN_PASSWORD=***HIDDEN***

# Supabase Configuration (Required for webhook endpoints)
VITE_SUPABASE_URL=***HIDDEN***
VITE_SUPABASE_ANON_KEY=***HIDDEN***

# Service Role Key (DO NOT EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY=***HIDDEN***

# AI Service API Keys (Required for AI webhooks/functions)
OPENAI_API_KEY=***HIDDEN***
GEMINI_API_KEY=***HIDDEN***

# Payment Processing Virtual-Cards (using Stripe)
STRIPE_PUBLISHABLE_KEY=***HIDDEN***
STRIPE_SECRET_KEY=***HIDDEN***
STRIPE_WEBHOOK_SECRET=***HIDDEN***
STRIPE_CONNECT=***HIDDEN***

# Payment Processing (using Sayswitch)
SAYSWITCH_SECRET_KEY=***HIDDEN***
SATSWITCH_PUBLISHABLE_KEY=***HIDDEN***

# BANK STATEMENT API & ANALYSIS
EDOC_SK=***HIDDEN***
EDOC_PK=***HIDDEN***
EDOC_CLIENT_ID=***HIDDEN***

# IDENTITY VERIFICATION (PREMBLY)
PREMBLY_SECRET_KEY=***HIDDEN***
PREMBLY_PUBLIC_KEY=***HIDDEN***

# Additional API Keys
PERPLEXITY_API_KEY=***HIDDEN***

# Supabase Configuration (from GitHub secrets in production)
VITE_SUPABASE_URL=***HIDDEN***
VITE_SUPABASE_ANON_KEY=***HIDDEN***

# Environment
NODE_ENV=***HIDDEN***#### Variables we may have added:
No custom variables found
#### Environment Backups:
No .env backups found
## 4. Deployment Configuration Analysis
### Vercel Configuration
#### Project Status:
Vercel CLI 48.1.6
Retrieving project…
Fetching deployments in thefixers-team
> Deployments for thefixers-team/vortexcore [600ms]

  Age     Deployment                                                 Status      Environment     Duration     Username       
  1d      https://vortexcore-93nt5k64d-thefixers-team.vercel.app     ● Ready     Production      27s          thefixer3x     
  1d      https://vortexcore-gup01vhoz-thefixers-team.vercel.app     ● Ready     Production      25s          thefixer3x     
  2d      https://vortexcore-6bffdgzat-thefixers-team.vercel.app     ● Ready     Production      6s           thefixer3x     
  2d      https://vortexcore-11377ktr3-thefixers-team.vercel.app     ● Ready     Preview         7s           thefixer3x     
  2d      https://vortexcore-1eyctuw8p-thefixers-team.vercel.app     ● Ready     Production      22s          thefixer3x     
  2d      https://vortexcore-lj6zeyqzq-thefixers-team.vercel.app     ● Ready     Preview         7s           thefixer3x     
  2d      https://vortexcore-9wbmjs0tq-thefixers-team.vercel.app     ● Ready     Preview         6s           thefixer3x     
  2d      https://vortexcore-5znrskv97-thefixers-team.vercel.app     ● Ready     Preview         7s           thefixer3x     
  2d      https://vortexcore-ibm0drgwl-thefixers-team.vercel.app     ● Ready     Preview         16s          thefixer3x     
  2d      https://vortexcore-m1kx2r2gt-thefixers-team.vercel.app     ● Ready     Preview         17s          thefixer3x     
  3d      https://vortexcore-98ia5yfvp-thefixers-team.vercel.app     ● Ready     Production      9s           thefixer3x     
  3d      https://vortexcore-iajw17ib1-thefixers-team.vercel.app     ● Ready     Preview         7s           thefixer3x     
  3d      https://vortexcore-w6tri14rc-thefixers-team.vercel.app     ● Ready     Preview         18s          thefixer3x     
  3d      https://vortexcore-glb8s7t20-thefixers-team.vercel.app     ● Error     Production      7s           thefixer3x     
  3d      https://vortexcore-loci25kbk-thefixers-team.vercel.app     ● Error     Preview         5s           thefixer3x     
  3d      https://vortexcore-q7dnsrb79-thefixers-team.vercel.app     ● Ready     Production      16s          thefixer3x     
  3d      https://vortexcore-96c3dsw3o-thefixers-team.vercel.app     ● Ready     Production      16s          thefixer3x     
  3d      https://vortexcore-k5yn4y3ei-thefixers-team.vercel.app     ● Ready     Preview         18s          thefixer3x     
  3d      https://vortexcore-e5nqcynrv-thefixers-team.vercel.app     ● Ready     Preview         17s          thefixer3x     
  6d      https://vortexcore-htrsm6jag-thefixers-team.vercel.app     ● Error     Preview         5s           thefixer3x     

https://vortexcore-93nt5k64d-thefixers-team.vercel.app
https://vortexcore-gup01vhoz-thefixers-team.vercel.app
https://vortexcore-6bffdgzat-thefixers-team.vercel.app
https://vortexcore-11377ktr3-thefixers-team.vercel.app
https://vortexcore-1eyctuw8p-thefixers-team.vercel.app
https://vortexcore-lj6zeyqzq-thefixers-team.vercel.app
https://vortexcore-9wbmjs0tq-thefixers-team.vercel.app
https://vortexcore-5znrskv97-thefixers-team.vercel.app
https://vortexcore-ibm0drgwl-thefixers-team.vercel.app
https://vortexcore-m1kx2r2gt-thefixers-team.vercel.app
https://vortexcore-98ia5yfvp-thefixers-team.vercel.app
https://vortexcore-iajw17ib1-thefixers-team.vercel.app
https://vortexcore-w6tri14rc-thefixers-team.vercel.app
https://vortexcore-glb8s7t20-thefixers-team.vercel.app
https://vortexcore-loci25kbk-thefixers-team.vercel.app
https://vortexcore-q7dnsrb79-thefixers-team.vercel.app
https://vortexcore-96c3dsw3o-thefixers-team.vercel.app
https://vortexcore-k5yn4y3ei-thefixers-team.vercel.app
https://vortexcore-e5nqcynrv-thefixers-team.vercel.app
https://vortexcore-htrsm6jag-thefixers-team.vercel.app
> To display the next page, run `vercel ls --next 1758646320038`
#### Domain Status:
Vercel CLI 48.1.6
Fetching Domains under thefixers-team
> 0 Domains found under thefixers-team [527ms]
#### vercel.json:
```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": null,
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
### Netlify Configuration
#### Site Status:
──────────────────────┐
 Current Netlify User │
──────────────────────┘
[32mName: [39m  lan Onasis
[32mEmail: [39m info@lanonasis.com
[32mGitHub: [39mthefixer3x
────────────────────┐
 Netlify Project Info  │
────────────────────┘
[32mNetlify TOML: [39m/Users/seyederick/DevOps/_project_folders/vortex-core-app/netlify.toml
[32mAdmin URL: [39m   undefined
[32mProject URL: [39m undefined
[32mProject Id: [39m  4c00ccf3-206f-4a13-be88-00664155c439

#### Functions:
Based on local functions folder /Users/seyederick/DevOps/_project_folders/vortex-core-app/netlify/functions, these are the functions detected
.------------------------------------------------------------------.
|          Netlify Functions (in local functions folder)           |
|------------------------------------------------------------------|
|      Name       |                 URL                 | deployed |
|-----------------|-------------------------------------|----------|
| ai-router-proxy | /.netlify/functions/ai-router-proxy | yes      |
| health          | /.netlify/functions/health          | yes      |
'------------------------------------------------------------------'
#### netlify.toml:
```toml
[build]
  # Install Bun and build using Bun to avoid npm/yarn
  command = "bun install --frozen-lockfile && bun run build"
  publish = "dist"

[dev]
  command = "bun run dev"
  port = 8080
  targetPort = 5173

env = { }

# Explicitly set functions directory
[functions]
  directory = "netlify/functions"

# Single-page app rewrite so deep links resolve to index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = true

# Edge Functions (if any) can be mapped here
# [[edge_functions]]
# path = "/functions/*"
# function = "<function-name>"
```
## 5. Database Schema Analysis
### Database Tables and Functions
#### Tables in public schema:
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
#### Functions in public schema:
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
#### Auth users count:
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
#### Profiles table status:
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
#### Wallets table status:
Manage remote databases

Usage:

Flags:
      --db-url string     Connect using the specified Postgres URL (must be percent-encoded).
  -h, --help              help for remote
      --linked            Connect to the linked project. (default true)
  -p, --password string   Password to your remote Postgres database.
  -s, --schema strings    Comma separated list of schema to include.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.45.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
## 6. Serverless Functions Analysis
### Netlify Functions
#### Netlify Functions Directory:
total 16
drwxr-xr-x  4 seyederick  staff  128 Sep 28 07:39 .
drwxr-xr-x  3 seyederick  staff   96 Sep 28 07:38 ..
-rw-r--r--  1 seyederick  staff  995 Sep 28 07:39 ai-router-proxy.mts
-rw-r--r--  1 seyederick  staff  351 Sep 28 07:38 health.mts
#### ai-router-proxy.mts:
```typescript
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  // Proxy to Supabase Edge Function ai-router
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mxtsdgkwzjzlttpotole.supabase.co";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const endpoint = `${supabaseUrl}/functions/v1/ai-router`;
  const init: RequestInit = {
    method: "POST",
```
#### health.mts:
```typescript
import type { Context, Config } from "@netlify/functions";

export default async (_req: Request, _context: Context) => {
  return new Response(
    JSON.stringify({ ok: true, service: "vortexcore", time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } }
  );
};

export const config: Config = {
```
### Vercel Functions
#### Vercel API Directory:
total 8
drwxr-xr-x    3 seyederick  staff    96 Sep 28 07:39 .
drwxr-xr-x  139 seyederick  staff  4448 Sep 29 18:21 ..
-rw-r--r--    1 seyederick  staff   217 Sep 28 07:39 health.ts
#### health.ts:
```typescript
export default async function handler() {
  return new Response(
    JSON.stringify({ ok: true, service: "vortexcore", time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } }
  );
}
```
### Supabase Edge Functions
#### Supabase Functions Directory:
total 24
drwxr-xr-x  15 seyederick  staff    480 Sep 28 05:07 .
drwxr-xr-x   9 seyederick  staff    288 Sep 28 05:07 ..
-rw-r--r--@  1 seyederick  staff  10244 Jul  5 20:29 .DS_Store
drwxr-xr-x   3 seyederick  staff     96 Sep 28 05:07 _shared
drwxr-xr-x@  5 seyederick  staff    160 Sep 28 05:07 ai-router
drwxr-xr-x   3 seyederick  staff     96 Sep 28 05:07 auth
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 callback-handler
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 create-checkout-session
drwxr-xr-x   3 seyederick  staff     96 Sep 28 05:07 gemini-ai
drwxr-xr-x   3 seyederick  staff     96 Sep 28 05:07 openai-assistant
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 openai-chat
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 payment
drwxr-xr-x   3 seyederick  staff     96 Sep 28 05:07 stripe
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 stripe-webhook
drwxr-xr-x@  3 seyederick  staff     96 Sep 28 05:07 verify
#### _shared:
#### ai-router:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withPublicMiddleware } from "../_shared/middleware.ts";
import OpenAI from 'npm:openai@4.11.0'
import { askPerplexity } from './providers/perplexity.ts'

// Define the VortexAI system contract
export const VORTEX_SYSTEM_PROMPT = `
You are **VortexAI**, the embedded digital banker inside the VortexCore app.
Tone: concise, proactive, analytics-driven, never apologetic, no third-person references to yourself
Always:
 • reply in first-person
 • cite data sources inline when they are external (e.g. [MSCI], [Reuters])
 • finish with 1 actionable recommendation (when relevant)
Forbidden:
 • "I don't have real-time data…"
```
#### auth:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { withAuthMiddleware } from "../_shared/middleware.ts";

serve(withAuthMiddleware(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, code, factorId } = await req.json();
    switch (action) {
      case 'setup-2fa': {
        if (!email) return new Response(JSON.stringify({ error: 'Email is required for 2FA setup' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
```
#### callback-handler:
```typescript
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";
import { createHash, timingSafeEqual } from "node:crypto";
// Constants
const MAX_REQUEST_SIZE = 102400; // 100KB in bytes
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 100;
// Rate limiting implementation using a simple in-memory store
const requestStore = new Map();
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, encryption',
```
#### create-checkout-session:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16"
});
serve(withAuthMiddleware(async (req)=>{
  try {
    const { priceId } = await req.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card'
      ],
      line_items: [
        {
```
#### gemini-ai:
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";

serve(withAuthMiddleware(async (req) => {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Gemini API Key not configured in Supabase Secrets");

    const { prompt, systemPrompt, history, model = "gemini-pro" } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const isGemini2Model = model.startsWith("gemini-2");
    const apiEndpoint = isGemini2Model
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      : `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
```
#### openai-assistant:
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";

serve(withPublicMiddleware(async (req) => {

  try {
    // Check for auth header if JWT verification is enabled
    // Note: With config.toml set to verify_jwt = false, this check isn't needed
    // but we include it for completeness
    const authHeader = req.headers.get('Authorization');
    console.log(`Auth header present: ${!!authHeader}`);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API Key not configured in Supabase Secrets");
```
#### openai-chat:
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";
serve(withPublicMiddleware(async (req)=>{
  try {
    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API Key not configured in Supabase Secrets");
    }
    // Parse the request body
    const { prompt, systemPrompt, history } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({
        error: "Prompt is required"
      }), { status: 400, headers: { "Content-Type": "application/json" } });
```
#### payment:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { createHash } from "node:crypto";
// Constants and configurations
const SAYSWITCH_BASE_URL = Deno.env.get('SAYSWITCH_BASE_URL') || 'https://backendapi.sayswitchgroup.com/api/v1';
const SAYSWITCH_PUBLIC_KEY = Deno.env.get('SAYSWITCH_PUBLIC_KEY');
const SAYSWITCH_SECRET_KEY = Deno.env.get('SAYSWITCH_SECRET_KEY');
const MAX_REQUEST_SIZE = 102400; // 100KB
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```
#### stripe-webhook:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.18.0";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
serve(withPublicMiddleware(async (req)=>{
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", {
        status: 400
```
#### stripe:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```
#### verify:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { withAuthMiddleware } from "../_shared/middleware.ts";
const SAYSWITCH_BASE_URL = Deno.env.get('SAYSWITCH_BASE_URL') || 'https://backendapi.sayswitchgroup.com/api/v1';
const SAYSWITCH_SECRET_KEY = Deno.env.get('SAYSWITCH_SECRET_KEY') || '';
serve(withAuthMiddleware(async (req)=>{
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return new Response(JSON.stringify({ success: false, message: 'Reference is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
```
## 7. Potential Impact Areas

### 🚨 High Risk Areas We May Have Affected:

#### Authentication Flow:
- ✅ **Supabase Auth URLs**: We definitely changed these
- ✅ **OAuth Redirects**: May have been overwritten
- ⚠️ **Magic Link Redirects**: We modified these
- ⚠️ **Password Reset Flow**: We updated redirect URLs

#### Database:
- ⚠️ **User Profiles**: We added/modified triggers
- ⚠️ **Wallets Table**: We created/modified this
- ⚠️ **RLS Policies**: We may have changed these
- ❓ **Existing Functions**: May have been affected by migrations

#### Environment Variables:
- ⚠️ **Local .env**: We added production URLs
- ❓ **Vercel Environment**: May need updating
- ❓ **Netlify Environment**: May need updating
- ❓ **Supabase Secrets**: We set OpenAI/Perplexity keys

#### Serverless Functions:
- ✅ **New Netlify Functions**: We created health and ai-router-proxy
- ✅ **New Vercel Functions**: We created health endpoint
- ❓ **Existing Edge Functions**: May have been redeployed

#### Domain Configuration:
- ❓ **Custom Domain**: me.vortexcore.app serving issues
- ❓ **DNS Settings**: May need verification
- ❓ **SSL Certificates**: May need renewal

### 🔧 Recommended Immediate Checks:

1. **Test Login Flow**: Try logging in with existing credentials
2. **Check OAuth Providers**: Test Twitter/Google login
3. **Verify Custom Domain**: Ensure me.vortexcore.app works
4. **Test API Endpoints**: Check if existing APIs still work
5. **Verify Database Access**: Ensure other projects can access DB
6. **Check Cross-Project Auth**: Test if other projects still authenticate

## 8. Rollback Preparation

### 🔄 Rollback Strategy:

#### If Authentication Breaks:
```bash
# Restore Supabase auth settings manually in dashboard
# Site URL: https://api.lanonasis.com
# Redirect URLs: https://api.lanonasis.com/auth/callback?return_to=vortexcore
```

#### If Database Issues:
```bash
# Check for backup SQL files
ls -la backup_before_vortexcore_migration_*.sql
# Restore from backup if needed
```

#### If Environment Variables Issues:
```bash
# Restore from backup
cp .env.backup.[timestamp] .env
```

#### If Functions Break:
```bash
# Remove our functions
rm -rf netlify/functions/
rm -rf api/
# Redeploy original functions
supabase functions deploy [original-function-name]
```

## 9. Testing Checklist

### ✅ Critical Tests to Run:

#### Authentication Tests:
- [ ] Login with existing user credentials
- [ ] OAuth login (Twitter, Google, etc.)
- [ ] Magic link authentication
- [ ] Password reset flow
- [ ] Cross-project authentication

#### Database Tests:
- [ ] User profile creation
- [ ] Wallet functionality
- [ ] Existing data integrity
- [ ] Database triggers working

#### API Tests:
- [ ] Health endpoints (/health, /api/health)
- [ ] AI router functionality
- [ ] Existing API endpoints
- [ ] Cross-origin requests

#### Domain Tests:
- [ ] me.vortexcore.app serving correctly
- [ ] SSL certificate valid
- [ ] DNS resolution working
- [ ] Redirects functioning

#### Integration Tests:
- [ ] Other projects can authenticate
- [ ] Central auth system working
- [ ] Project routing via return_to parameter
- [ ] Vanity domain (lanonasis.supabase.co) working

