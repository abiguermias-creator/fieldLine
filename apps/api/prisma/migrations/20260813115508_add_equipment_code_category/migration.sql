-- Add the new columns as nullable first
ALTER TABLE "equipment"
ADD COLUMN "category" TEXT,
ADD COLUMN "code" TEXT;

-- Give existing equipment a code and category
UPDATE "equipment"
SET
  "code" = 'EQ-001',
  "category" = 'GENERAL'
WHERE "code" IS NULL;

-- Make the columns required
ALTER TABLE "equipment"
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "code" SET NOT NULL;

-- Add unique constraint for equipment codes
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");