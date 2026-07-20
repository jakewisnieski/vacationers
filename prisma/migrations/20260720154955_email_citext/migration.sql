-- Make email columns case-insensitive so the #5 allowlist gate never mismatches
-- on letter case. citext must exist before the column type can reference it;
-- IF NOT EXISTS keeps this safe on a fresh DB (prod) and on Neon (already has it).
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable
ALTER TABLE "AllowlistEntry" ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "email" SET DATA TYPE CITEXT;
