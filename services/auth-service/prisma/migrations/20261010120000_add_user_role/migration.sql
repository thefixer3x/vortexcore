-- Add role-based authorization to users (additive, backwards compatible, re-runnable).
--
-- Every existing row gets role = 'USER' via the column default, so no user is
-- promoted by this migration. To promote the first admin, an operator runs
-- (manually, after review):
--   UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = '<admin email>';
--
-- Rollback (safe; default is USER, so dropping loses nothing the previous
-- code version relies on):
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
--   DROP TYPE IF EXISTS "UserRole";

-- CreateEnum (guarded: PostgreSQL has no CREATE TYPE IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';
