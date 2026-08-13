/*
  Add skill codes and work-order skill requirements.
*/

-- Add the column as nullable first so existing skills can receive codes.
ALTER TABLE "skills" ADD COLUMN "code" TEXT;

-- Give existing skills unique codes.
UPDATE "skills"
SET "code" = 'SKILL-' || UPPER(SUBSTRING("id"::text, 1, 8))
WHERE "code" IS NULL;

-- Make the column required.
ALTER TABLE "skills" ALTER COLUMN "code" SET NOT NULL;

-- Create the work-order/skill join table.
CREATE TABLE "work_order_skills" (
    "work_order_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "work_order_skills_pkey"
        PRIMARY KEY ("work_order_id", "skill_id")
);

-- Make skill codes unique.
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- Add foreign key from work_order_skills to work_orders.
ALTER TABLE "work_order_skills"
ADD CONSTRAINT "work_order_skills_work_order_id_fkey"
FOREIGN KEY ("work_order_id")
REFERENCES "work_orders"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Add foreign key from work_order_skills to skills.
ALTER TABLE "work_order_skills"
ADD CONSTRAINT "work_order_skills_skill_id_fkey"
FOREIGN KEY ("skill_id")
REFERENCES "skills"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;