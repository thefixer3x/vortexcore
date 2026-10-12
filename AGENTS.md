# Project rules
- Active AI interfaces call the Supabase `ai-router` function using user/assistant messages; a single contract avoids provider-specific response mismatches.
- AI branding uses the shared Lucide VortexAI icon and product-named routes; private upstream model identifiers stay server-side because integrations require their exact identifiers.
- Never change shared-table access policies without confirming intended access; this Supabase project serves multiple applications.