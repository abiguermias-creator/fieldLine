import { api } from "./client";

type SkillData = {
  name: string;
};

export async function getSkills() {
  const response = await api.get("/skills");
  return response.data;
}

export async function createSkill(data: SkillData) {
  const response = await api.post("/skills", data);
  return response.data;
}

export async function updateSkill(id: string, data: SkillData) {
  const response = await api.patch(`/skills/${id}`, data);
  return response.data;
}

export async function deleteSkill(id: string) {
  const response = await api.delete(`/skills/${id}`);
  return response.data;
}