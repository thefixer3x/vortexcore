# VortexAI branding and data references

## Active interfaces
- `/ecosystem/vortex-iq`: VortexIQ.
- `/ecosystem/deep-research`: VortexDeepresearch.
- The signed-in support bubble, both demo pages, and chat hooks call `ai-router`.
- The shared V-shaped Lucide icon uses currentColor, avoiding favicon contrast problems.
- Provider names are absent from active UI routes and router response metadata. Exact upstream model IDs and legacy integration paths remain private implementation details; removing these would break connections or existing clients.
- Research currently has no live search sources attached. It must disclose this limitation instead of fabricating current figures or citations.
- `{ "name": "Functions" }` tests connectivity; actual chat uses `{ "messages": [{ "role": "user", "content": "..." }] }`.
- Basic voluntarily supplied information stays intact; sensitive financial identifiers are redacted, and no full user profile is attached.

## Shared database tables requested for review
- `company_endpoints`: generated types in `src/integrations/supabase/types.ts`, starting at line 663. No active application or Edge Function query was found in this checkout. Its authoritative definition and access rules are in the connected Supabase database.
- `query_classifications`: generated types in `src/integrations/supabase/types.ts`, starting at line 2320; historical table definition in `docs/migration/target_schema.sql`, starting at line 822. Historical grants are at lines 2877–2879. These snapshots are not proof of current live policies.
- Neither table is used by the VortexAI UI. Do not hand-edit the generated type file.
- The open read-access findings and the `client_services.clients` editable tenant-claim finding remain active pending confirmation of the intended access rules. No SQL was executed for these findings.