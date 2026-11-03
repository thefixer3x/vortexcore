-- Applied migration 20260108032342 (create_verification_schema_and_types), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Verification Service Schema for Supabase
-- Create verification schema
CREATE SCHEMA IF NOT EXISTS verification;

-- Create enum types in verification schema
DO $$ BEGIN
  CREATE TYPE verification.verification_status AS ENUM('pending', 'processing', 'completed', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.verification_type AS ENUM('identity', 'business', 'phone', 'address', 'biometric', 'background_check');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.identity_document_type AS ENUM('passport', 'drivers_license', 'national_id', 'voters_card', 'permanent_voters_card', 'bvn', 'nin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.business_type AS ENUM('company', 'business_registration', 'tax_identification', 'bank_verification');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.phone_verification_method AS ENUM('sms', 'voice_call', 'missed_call', 'otp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.address_verification_type AS ENUM('utility_bill', 'bank_statement', 'government_document');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.biometric_type AS ENUM('face_match', 'liveness_check', 'fingerprint', 'voice_recognition');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification.background_check_type AS ENUM('criminal_record', 'credit_history', 'employment_history', 'education_verification');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;