import { api } from './client';

export async function getTechnicianSkills(technicianId: string) {
  const response = await api.get(`/technicians/${technicianId}/skills`);

  return response.data;
}

export async function addTechnicianSkill(
  technicianId: string,
  data: {
    skillId: string;
    certificationExpiresAt?: string | null;
  }
) {
  const response = await api.post(`/technicians/${technicianId}/skills`, data);

  return response.data;
}

export async function removeTechnicianSkill(technicianId: string, skillId: string) {
  const response = await api.delete(`/technicians/${technicianId}/skills/${skillId}`);

  return response.data;
}
