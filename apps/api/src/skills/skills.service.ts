import { prisma } from "../db/client.js";

export async function createSkill(data: {
  code: string;
  name: string;
}) {
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
  }
) {
  return prisma.skill.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteSkill(id: string) {
  return prisma.skill.delete({
    where: {
      id,
    },
  });
}