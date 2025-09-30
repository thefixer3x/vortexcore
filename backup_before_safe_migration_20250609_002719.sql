SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: apps; Type: TABLE DATA; Schema: control_room; Owner: postgres
--

INSERT INTO "control_room"."apps" ("id", "name", "description", "status", "schema_name", "original_project_ref", "migration_status", "created_at", "updated_at") VALUES
	('vortexcore', 'Vortexcore.app', 'Main aggregation platform', 'active', 'app_vortexcore', 'mxtsdgkwzjzlttpotole', 'pending', '2025-05-14 13:33:22.060105+00', '2025-05-14 13:33:22.060105+00'),
	('seftec', 'SEFTEC Store', 'E-commerce platform', 'active', 'app_seftec', 'ptnrwrgzrsbocgxlpvhd', 'pending', '2025-05-14 13:33:22.060105+00', '2025-05-14 13:33:22.060105+00'),
	('saas', 'SaaS Platform', 'Software as a Service platform', 'active', 'app_saas', 'nbmomsntbamfthxfdnme', 'pending', '2025-05-14 13:33:22.060105+00', '2025-05-14 13:33:22.060105+00'),
	('apple', 'Apple Store Lekki', 'Retail store management', 'active', 'app_apple', 'rsabczhfeehazuyajarx', 'pending', '2025-05-14 13:33:22.060105+00', '2025-05-14 13:33:22.060105+00');


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: control_room; Owner: postgres
--



--
-- Data for Name: metrics; Type: TABLE DATA; Schema: control_room; Owner: postgres
--



--
-- Data for Name: user_app_access; Type: TABLE DATA; Schema: control_room; Owner: postgres
--



--
-- Data for Name: ai_response_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: beneficiaries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bulk_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orgs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edoc_consents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edoc_fin_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edoc_risk_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edoc_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edoc_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: marketplace_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: org_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pricing_insights; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_embeddings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: query_classifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: risk_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: stripe_connect_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: virtual_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: webhook_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('system', 'system', NULL, '2025-05-14 17:33:56.283308+00', '2025-05-14 17:33:56.283308+00', false, false, NULL, NULL, NULL),
	('logs', 'logs', NULL, '2025-05-14 17:33:56.283308+00', '2025-05-14 17:33:56.283308+00', false, false, NULL, NULL, NULL),
	('exports', 'exports', NULL, '2025-05-14 17:33:56.283308+00', '2025-05-14 17:33:56.283308+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
