import { api } from './client';

type SiteData = {
  clientId?: string;
  name?: string;
  address?: string;
  city?: string;
  accessNotes?: string;
};

type SiteCoordinates = {
  latitude: number;
  longitude: number;
};

export async function getSites() {
  const response = await api.get('/sites');
  return response.data;
}

export async function createSite(data: SiteData) {
  const response = await api.post('/sites', data);
  return response.data;
}

export async function updateSite(id: string, data: SiteData) {
  const response = await api.patch(`/sites/${id}`, data);
  return response.data;
}

export async function deleteSite(id: string) {
  const response = await api.delete(`/sites/${id}`);
  return response.data;
}

export async function deactivateSite(id: string) {
  const response = await api.patch(`/sites/${id}/deactivate`);
  return response.data;
}

export async function updateSiteLocation(id: string, coordinates: SiteCoordinates) {
  const response = await api.patch(`/sites/${id}/location`, coordinates);

  return response.data;
}
