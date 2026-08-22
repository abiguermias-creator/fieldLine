import { prisma } from "../db/client.js";

export async function createSkill(data: { code: string; name: string }) {
  const existingSkill = await prisma.skill.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existingSkill) {
    throw new Error(`A skill with code "${data.code}" already exists.`);
  }

  return prisma.skill.create({
    data,
  });
}

export async function getSkills() {
  return prisma.skill.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getSkillById(id: string) {
  return prisma.skill.findUnique({
    where: {
      id,
    },
  });
}

export async function updateSkill(
  id: string,
  data: {
    code?: string;
    name?: string;
  },
) {
  return prisma.skill.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteSkill(id: string) {
  const workOrderCount = await prisma.workOrderSkill.count({
    where: {
      skillId: id,
    },
  });

  if (workOrderCount > 0) {
    throw new Error(
      `Cannot delete skill. It is required by ${workOrderCount} work order${
        workOrderCount === 1 ? "" : "s"
      }.`,
    );
  }

  return prisma.skill.delete({
    where: {
      id,
    },
  });
}
