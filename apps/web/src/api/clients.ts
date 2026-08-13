import { api } from "./client";

export async function getClients(page = 1, search = "") {
  const response = await api.get("/clients", {
    params: {
      page,
      search,
    },
  });

  return response.data;
}

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
}) {
  const response = await api.post("/clients", data);

  return response.data;
}

export async function deleteClient(id: string) {
  const response = await api.delete(`/clients/${id}`);

  return response.data;
}

export async function activateClient(id: string) {
  const response = await api.patch(`/clients/${id}/activate`);
  return response.data;
}

export async function deactivateClient(id: string) {
  const response = await api.patch(`/clients/${id}/deactivate`);

  return response.data;
}