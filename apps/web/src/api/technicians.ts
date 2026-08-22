import { api } from './client';

export async function getTechnicians(page = 1, limit = 25, search = '', skillId?: string) {
  const response = await api.get('/technicians', {
    params: {
      page,
      limit,
      search,
      ...(skillId ? { skillId } : {})
    }
  });

  return response.data;
}

export async function createTechnician(data: {
  email: string;
  password: string;
  fullName: string;
  employeeCode: string;
  baseLocation: string;
  maxWorkingMinutesPerDay?: number;
  phone?: string;
  bio?: string;
}) {
  const response = await api.post('/technicians', data);

  return response.data;
}

export async function updateTechnician(
  id: string,
  data: {
    fullName?: string;
    employeeCode?: string;
    baseLocation?: string;
    maxWorkingMinutesPerDay?: number;
    phone?: string;
    bio?: string;
  }
) {
  const response = await api.patch(`/technicians/${id}`, data);

  return response.data;
}

export async function deactivateTechnician(id: string) {
  const response = await api.patch(`/technicians/${id}/deactivate`);

  return response.data;
}

export async function activateTechnician(id: string) {
  const response = await api.patch(`/technicians/${id}/activate`);

  return response.data;
}

export async function getTechnician(id: string) {
  const response = await api.get(`/technicians/${id}`);

  return response.data;
}
