-- CreateTable
CREATE TABLE "technician_skills" (
    "technician_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "certification_expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "technician_skills_pkey" PRIMARY KEY ("technician_id","skill_id")
);

-- AddForeignKey
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
