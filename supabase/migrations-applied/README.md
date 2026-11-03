# Applied database migrations (reference copies)

Copied from the live database's migration history (`supabase_migrations.schema_migrations`) on 2026-11-03.
This Supabase project is shared by several apps, so many of these came from other apps.

- Files here are **reference copies of SQL that has already run**. Do not re-run them.
- Migrations made from this project live in `supabase/migrations/` and are recorded by the migration tool; they are listed below rather than duplicated.

| Version | Name | Copy |
|---|---|---|
| 00000000000000 | create_maple_schema | `00000000000000_create_maple_schema.sql` |
| 20260108032219 | create_provider_accounts | `20260108032219_create_provider_accounts.sql` |
| 20260108032313 | create_provider_references | `20260108032313_create_provider_references.sql` |
| 20260108032314 | create_webhook_infrastructure | `20260108032314_create_webhook_infrastructure.sql` |
| 20260108032315 | create_project_capabilities | `20260108032315_create_project_capabilities.sql` |
| 20260108032342 | create_verification_schema_and_types | `20260108032342_create_verification_schema_and_types.sql` |
| 20260108032356 | create_verification_records_table | `20260108032356_create_verification_records_table.sql` |
| 20260108032427 | create_identity_verifications_table | `20260108032427_create_identity_verifications_table.sql` |
| 20260108032428 | create_business_verifications_table | `20260108032428_create_business_verifications_table.sql` |
| 20260108032429 | create_address_verifications_table | `20260108032429_create_address_verifications_table.sql` |
| 20260108032430 | create_biometric_verifications_table | `20260108032430_create_biometric_verifications_table.sql` |
| 20260108032501 | create_phone_verifications_v2 | `20260108032501_create_phone_verifications_v2.sql` |
| 20260108032502 | create_verification_metrics_and_requirements | `20260108032502_create_verification_metrics_and_requirements.sql` |
| 20260108032656 | create_verification_status_audit_v2 | `20260108032656_create_verification_status_audit_v2.sql` |
| 20260108032824 | create_credit_schema_and_types | `20260108032824_create_credit_schema_and_types.sql` |
| 20260108032904 | create_credit_bids_table | `20260108032904_create_credit_bids_table.sql` |
| 20260108032905 | create_credit_scores_table | `20260108032905_create_credit_scores_table.sql` |
| 20260108032906 | create_credit_repayment_schedule | `20260108032906_create_credit_repayment_schedule.sql` |
| 20260108032925 | create_credit_applications_v2 | `20260108032925_create_credit_applications_v2.sql` |
| 20260108032926 | create_credit_transactions_v2 | `20260108032926_create_credit_transactions_v2.sql` |
| 20260108033251 | create_verification_schema_facades | `20260108033251_create_verification_schema_facades.sql` |
| 20260108033312 | create_credit_schema_facades | `20260108033312_create_credit_schema_facades.sql` |
| 20260108033417 | enable_rls_verification_v2 | `20260108033417_enable_rls_verification_v2.sql` |
| 20260108033441 | enable_rls_credit_schema | `20260108033441_enable_rls_credit_schema.sql` |
| 20260108033541 | enable_rls_provider_tables_v2 | `20260108033541_enable_rls_provider_tables_v2.sql` |
| 20260108033615 | fix_view_security_invoker | `20260108033615_fix_view_security_invoker.sql` |
| 20260108033650 | fix_project_capabilities_view_v2 | `20260108033650_fix_project_capabilities_view_v2.sql` |
| 20260108042539 | grant_facade_view_permissions | `20260108042539_grant_facade_view_permissions.sql` |
| 20260112020216 | fix_auth_rls_initplan_policies_v2 | `20260112020216_fix_auth_rls_initplan_policies_v2.sql` |
| 20260112022019 | add_missing_fk_indexes | `20260112022019_add_missing_fk_indexes.sql` |
| 20260112023131 | drop_duplicate_credit_indexes | `20260112023131_drop_duplicate_credit_indexes.sql` |
| 20260112025529 | consolidate_permissive_policies | `20260112025529_consolidate_permissive_policies.sql` |
| 20260112025912 | consolidate_permissive_policies_v2 | `20260112025912_consolidate_permissive_policies_v2.sql` |
| 20260112030000 | consolidate_auth_events_policies | `20260112030000_consolidate_auth_events_policies.sql` |
| 20260112060537 | fix_audit_log_insert_and_api_keys_updated_at | `20260112060537_fix_audit_log_insert_and_api_keys_updated_at.sql` |
| 20260116180902 | create_trigger_sync_user_function | `20260116180902_create_trigger_sync_user_function.sql` |
| 20260116181000 | create_trigger_sync_user_on_security_service | `20260116181000_create_trigger_sync_user_on_security_service.sql` |
| 20260116230524 | setup_user_sync_cron | `20260116230524_setup_user_sync_cron.sql` |
| 20260122040609 | expose_control_room_apps_rpc | `20260122040609_expose_control_room_apps_rpc.sql` |
| 20260122071236 | add_find_duplicate_memories_rpc | `20260122071236_add_find_duplicate_memories_rpc.sql` |
| 20260122072228 | fix_find_duplicate_memories_search_path | `20260122072228_fix_find_duplicate_memories_search_path.sql` |
| 20260122073449 | add_memory_scan_limit_to_duplicate_detection | `20260122073449_add_memory_scan_limit_to_duplicate_detection.sql` |
| 20260123060150 | 015_universal_auth_identifier_schema_only | `20260123060150_015_universal_auth_identifier_schema_only.sql` |
| 20260123162443 | fix_memory_entries_auto_organization_id | `20260123162443_fix_memory_entries_auto_organization_id.sql` |
| 20260204155248 | add_unique_constraint_to_auth_events_underlying | `20260204155248_add_unique_constraint_to_auth_events_underlying.sql` |
| 20260208032039 | add_voyage_ai_embeddings | `20260208032039_add_voyage_ai_embeddings.sql` |
| 20260208032148 | add_clean_memory_views | `20260208032148_add_clean_memory_views.sql` |
| 20260208115756 | update_search_memories_for_voyage | `20260208115756_update_search_memories_for_voyage.sql` |
| 20260208115909 | update_facade_view_voyage_columns | `20260208115909_update_facade_view_voyage_columns.sql` |
| 20260208115939 | create_voyage_migration_helpers | `20260208115939_create_voyage_migration_helpers.sql` |
| 20260208121200 | fix_search_memories_search_path | `20260208121200_fix_search_memories_search_path.sql` |
| 20260208122447 | create_public_voyage_rpc_functions | `20260208122447_create_public_voyage_rpc_functions.sql` |
| 20260208180840 | fix_search_memories_voyage_embedding | `20260208180840_fix_search_memories_voyage_embedding.sql` |
| 20260208181025 | fix_search_memories_dimension_detection | `20260208181025_fix_search_memories_dimension_detection.sql` |
| 20260208181133 | fix_search_memories_enum_cast | `20260208181133_fix_search_memories_enum_cast.sql` |
| 20260208181459 | fix_search_memories_varchar_cast | `20260208181459_fix_search_memories_varchar_cast.sql` |
| 20260208200619 | add_voyage_trigger_embedding_to_behavior_patterns | `20260208200619_add_voyage_trigger_embedding_to_behavior_patterns.sql` |
| 20260212010103 | enable_rls_user_sync_log | `20260212010103_enable_rls_user_sync_log.sql` |
| 20260212010118 | fix_function_search_paths | `20260212010118_fix_function_search_paths.sql` |
| 20260212010224 | fix_critical_auth_gateway_rls | `20260212010224_fix_critical_auth_gateway_rls.sql` |
| 20260212010706 | rollback_auth_gateway_policies | `20260212010706_rollback_auth_gateway_policies.sql` |
| 20260212010735 | secure_facade_views_with_rls | `20260212010735_secure_facade_views_with_rls.sql` |
| 20260212010745 | secure_gcp_facade_views | `20260212010745_secure_gcp_facade_views.sql` |
| 20260218065536 | fix_security_definer_views | `20260218065536_fix_security_definer_views.sql` |
| 20260218065812 | fix_search_memories_voyage_search_path | `20260218065812_fix_search_memories_voyage_search_path.sql` |
| 20260218070745 | fix_performance_advisors_policies_and_indexes | `20260218070745_fix_performance_advisors_policies_and_indexes.sql` |
| 20260218070750 | drop_duplicate_auth_events_constraint | `20260218070750_drop_duplicate_auth_events_constraint.sql` |
| 20260218070815 | fix_rls_initplan_current_setting | `20260218070815_fix_rls_initplan_current_setting.sql` |
| 20260225000300 | memory_idempotency_unique_index | `20260225000300_memory_idempotency_unique_index.sql` |
| 20260321000000 | create_maple_brief_subscribers | `20260321000000_create_maple_brief_subscribers.sql` |
| 20260327212331 | add_organization_id_to_profiles | `20260327212331_add_organization_id_to_profiles.sql` |
| 20260404073709 |  | `20260404073709_.sql` |
| 20260404073757 |  | `20260404073757_.sql` |
| 20260421102020 | fix_trigger_sync_user_role_enum | `20260421102020_fix_trigger_sync_user_role_enum.sql` |
| 20260425090000 | create_maple_facades | `20260425090000_create_maple_facades.sql` |
| 20260427101849 |  | `20260427101849_.sql` |
| 20260508160559 | memory_inference_foundation | `20260508160559_memory_inference_foundation.sql` |
| 20260508160614 | memory_inference_embeddings | `20260508160614_memory_inference_embeddings.sql` |
| 20260509095646 | intelligence_quota_reset_on_access | `20260509095646_intelligence_quota_reset_on_access.sql` |
| 20260509100659 | memory_profiles | `20260509100659_memory_profiles.sql` |
| 20260512232827 |  | `20260512232827_.sql` |
| 20260513000545 |  | `20260513000545_.sql` |
| 20260513002301 |  | `20260513002301_.sql` |
| 20260513014039 |  | `20260513014039_.sql` |
| 20260522102941 | add_include_deleted_to_semantic_search | `20260522102941_add_include_deleted_to_semantic_search.sql` |
| 20260528061135 | add_org_plan_and_limits_columns | `20260528061135_add_org_plan_and_limits_columns.sql` |
| 20260529203610 | 20260529_017_enable_rls_security_service | `20260529203610_20260529_017_enable_rls_security_service.sql` |
| 20260626141903 | voyage_duplicate_detection | `20260626141903_voyage_duplicate_detection.sql` |
| 20260626141938 | voyage_duplicate_detection_fix_enum_cast | `20260626141938_voyage_duplicate_detection_fix_enum_cast.sql` |
| 20260804064922 | fix_apply_auth_event_onconflict_target | `20260804064922_fix_apply_auth_event_onconflict_target.sql` |
| 20260808030324 | fix_usage_tracking_insert_redirect_defaults | `20260808030324_fix_usage_tracking_insert_redirect_defaults.sql` |
| 20260808030422 | fix_usage_tracking_insert_redirect_defaults | `20260808030422_fix_usage_tracking_insert_redirect_defaults.sql` |
| 20260812183147 | api_key_context_projection_rollout | `20260812183147_api_key_context_projection_rollout.sql` |
| 20260816055635 | fix_app_vortexcore_facade_grants_and_backfill | in `supabase/migrations/20260816055635_fix_app_vortexcore_facade_grants_and_backfill.sql` |
| 20260816064721 | harden_vortex_security_advisor_findings | in `supabase/migrations/20260816064721_harden_vortex_security_advisor_findings.sql` |
| 20260816064741 | revoke_public_execute_on_vortex_rpcs | in `supabase/migrations/20260816064741_revoke_public_execute_on_vortex_rpcs.sql` |
| 20260816122929 | riskgpt_bounded_context | `20260816122929_riskgpt_bounded_context.sql` |
| 20260818144945 | align_vortex_ai_facade_privileges | in `supabase/migrations/20260818144945_align_vortex_ai_facade_privileges.sql` |
| 20260818145844 | remediate_security_definer_rpcs | in `supabase/migrations/20260818145844_remediate_security_definer_rpcs.sql` |
| 20260818150229 | align_vortex_profile_fields | in `supabase/migrations/20260818150229_align_vortex_profile_fields.sql` |
| 20260819014135 | add_trial_end_to_stripe_subscriptions | in `supabase/migrations/20260819014135_add_trial_end_to_stripe_subscriptions.sql` |
| 20260819015142 | fix_sync_auth_user_to_public_target_base_table | in `supabase/migrations/20260819015142_fix_sync_auth_user_to_public_target_base_table.sql` |
| 20260819015351 | pin_search_path_sync_auth_user_to_public | in `supabase/migrations/20260819015351_pin_search_path_sync_auth_user_to_public.sql` |
| 20260827005453 | mcp_search_filter_pushdown_008 | `20260827005453_mcp_search_filter_pushdown_008.sql` |
| 20260906165600 | 20260906_022_repair_projects_organization_id | `20260906165600_20260906_022_repair_projects_organization_id.sql` |
| 20261005030946 | retype_inferred_conclusions_embedding_to_voyage_1024 | `20261005030946_retype_inferred_conclusions_embedding_to_voyage_1024.sql` |
| 20261005040008 | detect_duplicates_scope_and_live_rows | `20261005040008_detect_duplicates_scope_and_live_rows.sql` |
| 20261005040059 | intelligence_bounded_aggregates_hardened | `20261005040059_intelligence_bounded_aggregates_hardened.sql` |
| 20261005040203 | analyze_patterns_aggregate_enum_cast | `20261005040203_analyze_patterns_aggregate_enum_cast.sql` |
| 20261011234337 | 460d9ced-d894-4e2e-a2c8-5c8f46de611a | in `supabase/migrations/20261011234337_460d9ced-d894-4e2e-a2c8-5c8f46de611a.sql` |
| 20261011235502 | aae2ef39-64ed-4267-839f-6547865a5262 | in `supabase/migrations/20261011235502_aae2ef39-64ed-4267-839f-6547865a5262.sql` |
| 20261011235718 | a0c695f3-59a3-47b6-bee1-8e50ff65a04e | in `supabase/migrations/20261011235718_a0c695f3-59a3-47b6-bee1-8e50ff65a04e.sql` |
| 20261012003905 | b13ba2be-854c-4014-b04d-2cd6f9467a42 | in `supabase/migrations/20261012003905_b13ba2be-854c-4014-b04d-2cd6f9467a42.sql` |
| 20261012005106 | 6b4659e4-33f3-469e-8ad3-fe61fa1754e9 | in `supabase/migrations/20261012005106_6b4659e4-33f3-469e-8ad3-fe61fa1754e9.sql` |
| 20261012085932 | 02d6da43-be80-444d-968b-08d038bd9e7a | in `supabase/migrations/20261012085932_02d6da43-be80-444d-968b-08d038bd9e7a.sql` |
| 20261012104449 | 5546f962-8ddc-4875-8d9c-f1d6bb500129 | in `supabase/migrations/20261012104449_5546f962-8ddc-4875-8d9c-f1d6bb500129.sql` |
| 20261012104715 | e0f75b46-5eff-4c3f-bf57-27e77997443c | in `supabase/migrations/20261012104715_e0f75b46-5eff-4c3f-bf57-27e77997443c.sql` |
| 20261014090825 | efb26dbf-45c4-4b75-8929-f05e2de2d8f8 | in `supabase/migrations/20261014090825_efb26dbf-45c4-4b75-8929-f05e2de2d8f8.sql` |
| 20261017054242 | sync_triggers_webhook_secret_header | `20261017054242_sync_triggers_webhook_secret_header.sql` |
| 20261018030603 | brainbox_authenticated_grants | `20261018030603_brainbox_authenticated_grants.sql` |
| 20261103144337 | a35321d6-468e-41e9-b427-0c285ad5fbf8 | in `supabase/migrations/20261103144337_a35321d6-468e-41e9-b427-0c285ad5fbf8.sql` |
| 20261103144435 | 856a7ac8-9d10-4858-a807-d3c6942a1300 | in `supabase/migrations/20261103144435_856a7ac8-9d10-4858-a807-d3c6942a1300.sql` |

## In `supabase/migrations/` but not in the live history

These files were applied by hand, quarantined, or never run:

- `2025-08-30_tighten_privileges.sql`
- `20250928_clean_vortex_core_tables.sql`
- `20250929_optimize_rls_policies.sql`
- `20251122_create_wallets_transactions_tables.sql`
- `20260427_app_vortexcore_schema.sql`
- `20260815_add_two_factor_enabled_to_profiles.sql`
- `20260816_fix_canonical_facade_grants_and_backfill.sql`
- `20260819120000_wallet_balance_adjust_fn.sql`
