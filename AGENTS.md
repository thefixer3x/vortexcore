# Project rules
- Active AI interfaces call the Supabase `ai-router` function using user/assistant messages; a single contract avoids provider-specific response mismatches.
- AI branding uses the shared Lucide VortexAI icon and product-named routes; private upstream model identifiers stay server-side because integrations require their exact identifiers.
- Never change shared-table access policies without confirming intended access; this Supabase project serves multiple applications.
- Server Supabase clients use the shared key-aware factory with isolated auth state; opaque API keys go only in apikey and verified user JWTs remain in Authorization, so privileged operations preserve server identity without RLS workarounds.
- Endpoint and classification ownership is assigned by trusted services; organization access uses server-controlled app_metadata.org_id, not editable membership rows or user metadata, to prevent tenant spoofing.