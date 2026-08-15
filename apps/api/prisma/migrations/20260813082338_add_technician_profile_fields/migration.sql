/*
  Add technician profile fields required by US-302.
  Existing technician profiles receive temporary values.
*/

-- Add the new columns as nullable first so existing rows can be populated.
ALTER TABLE "technician_profiles"
ADD COLUMN "base_location" TEXT,
ADD COLUMN "employee_code" TEXT,
ADD COLUMN "max_working_minutes_per_day" INTEGER NOT NULL DEFAULT 480;

-- Populate existing technician profiles.
UPDATE "technician_profiles"
SET
  "employee_code" = 'TECH-' || UPPER(SUBSTRING("id"::text, 1, 8)),
  "base_location" = 'Addis Ababa'
WHERE "employee_code" IS NULL
   OR "base_location" IS NULL;

-- Make the required fields non-null after existing rows have values.
ALTER TABLE "technician_profiles"
ALTER COLUMN "employee_code" SET NOT NULL,
ALTER COLUMN "base_location" SET NOT NULL;

-- Employee codes must be unique.
CREATE UNIQUE INDEX "technician_profiles_employee_code_key"
ON "technician_profiles"("employee_code");
