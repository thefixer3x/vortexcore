-- Add currency and language preferences to profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "default_currency" character(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "language" character(2) DEFAULT 'en';

-- Add comment to document the fields
COMMENT ON COLUMN "public"."profiles"."default_currency" IS 'User preferred currency code (ISO 4217)';
COMMENT ON COLUMN "public"."profiles"."language" IS 'User preferred language code (ISO 639-1)';

-- Create index for faster currency lookups
CREATE INDEX IF NOT EXISTS "idx_profiles_default_currency" ON "public"."profiles"("default_currency");
