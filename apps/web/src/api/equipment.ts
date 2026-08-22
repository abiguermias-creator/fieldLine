import { api } from './client';

export type EquipmentData = {
  code: string;
  name: string;
  category: string;
  description?: string;
};

export async function getEquipment() {
  const response = await api.get('/equipment');
  return response.data;
}

export async function getEquipmentById(id: string) {
  const response = await api.get(`/equipment/${id}`);
  return response.data;
}

export async function createEquipment(data: EquipmentData) {
  const response = await api.post('/equipment', data);
  return response.data;
}

export async function updateEquipment(id: string, data: Partial<EquipmentData>) {
  const response = await api.patch(`/equipment/${id}`, data);
  return response.data;
}

export async function deleteEquipment(id: string) {
  const response = await api.delete(`/equipment/${id}`);
  return response.data;
}

export async function deactivateEquipment(id: string) {
  const response = await api.patch(`/equipment/${id}/deactivate`);
  return response.data;
}

export async function activateEquipment(id: string) {
  const response = await api.patch(`/equipment/${id}/activate`);
  return response.data;
}
