import { prisma } from "../db/client.js";

export async function addTechnicianSkill(data: {
  technicianId: string;
  skillId: string;
  certificationExpiresAt?: string | null;
}) {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id: data.technicianId,
    },
  });

  if (!technician) {
    throw new Error("Technician not found.");
  }

  const skill = await prisma.skill.findUnique({
    where: {
      id: data.skillId,
    },
  });

  if (!skill) {
    throw new Error("Skill not found.");
  }

  const existing = await prisma.technicianSkill.findUnique({
    where: {
      technicianId_skillId: {
        technicianId: data.technicianId,
        skillId: data.skillId,
      },
    },
  });

  if (existing) {
    throw new Error("Technician already has this skill.");
  }

  return prisma.technicianSkill.create({
    data: {
      technicianId: data.technicianId,
      skillId: data.skillId,
      certificationExpiresAt: data.certificationExpiresAt
        ? new Date(data.certificationExpiresAt)
        : null,
    },
    include: {
      skill: true,
    },
  });
}

export async function getTechnicianSkills(technicianId: string) {
  const skills = await prisma.technicianSkill.findMany({
    where: {
      technicianId,
    },
    include: {
      skill: true,
    },
    orderBy: {
      skill: {
        name: "asc",
      },
    },
  });

  const now = new Date();

  return skills.map((technicianSkill) => ({
    ...technicianSkill,
    expired:
      technicianSkill.certificationExpiresAt !== null &&
      technicianSkill.certificationExpiresAt < now,
  }));
}

export async function removeTechnicianSkill(technicianId: string, skillId: string) {
  const existing = await prisma.technicianSkill.findUnique({
    where: {
      technicianId_skillId: {
        technicianId,
        skillId,
      },
    },
  });

  if (!existing) {
    throw new Error("Technician does not have this skill.");
  }

  return prisma.technicianSkill.delete({
    where: {
      technicianId_skillId: {
        technicianId,
        skillId,
      },
    },
  });
}
