import { api } from './client';

type CreateWorkOrderData = {
  clientId: string;
  siteId: string;
  title: string;
  description?: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  duplicateConfirmed?: boolean;
};

type CreateClientRequestData = {
  siteId: string;
  title: string;
  description?: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  p1Confirmed?: boolean;
  duplicateConfirmed?: boolean;
  agreedDate?: string | null;
};

type GetWorkOrdersParams = {
  page?: number;
  limit?: number;
  statuses?: string[];
  priorities?: string[];
  technicianId?: string;
  clientId?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'priority' | 'nearestSla';
  sortOrder?: 'asc' | 'desc';
};

export async function getWorkOrders(params: GetWorkOrdersParams = {}) {
  const response = await api.get('/work-orders', {
    params: {
      ...params,

      statuses: params.statuses && params.statuses.length > 0 ? params.statuses.join(',') : undefined,

      priorities: params.priorities && params.priorities.length > 0 ? params.priorities.join(',') : undefined
    }
  });

  return response.data;
}

export async function createWorkOrder(data: CreateWorkOrderData) {
  const response = await api.post('/work-orders', data);
  return response.data;
}

export async function createClientRequest(data: CreateClientRequestData) {
  const response = await api.post('/work-orders/request', data);

  return response.data;
}

export async function getWorkOrderById(id: string) {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
}

type UpdateWorkOrderData = {
  title?: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  estimatedDuration?: number | null;
  skillIds?: string[];
  equipmentId?: string | null;
  technicianId?: string | null;
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  overrideDailyHours?: boolean;
  overrideReason?: string;
};

export async function updateWorkOrder(id: string, data: UpdateWorkOrderData) {
  const response = await api.patch(`/work-orders/${id}`, data);

  return response.data;
}

export async function cancelWorkOrder(id: string, reason: string) {
  const response = await api.patch(`/work-orders/${id}/cancel`, { reason });

  return response.data;
}

export async function getAssignmentOptions(workOrderId: string) {
  const response = await api.get(`/work-orders/${workOrderId}/assignment-options`);

  return response.data;
}

export async function unassignWorkOrder(
  id: string,
  reason: string,
) {
  const response = await api.patch(
    `/work-orders/${id}/unassign`,
    { reason },
  );

  return response.data;
}

export async function moveWorkOrderStatus(id: string) {
  const response = await api.patch(
    `/work-orders/${id}/status-action`,
  );

  return response.data;
}

export async function markWorkOrderWaitingOnParts(
  id: string,
  description: string,
) {
  const response = await api.patch(
    `/work-orders/${id}/waiting-on-parts`,
    { description },
  );

  return response.data;
}

export type CreateWorkLogData = {
  note: string;
  minutesSpent: number;
  partsUsed?: string;
};

export async function createWorkLog(
  workOrderId: string,
  data: CreateWorkLogData,
) {
  const response = await api.post(
    `/work-orders/${workOrderId}/work-logs`,
    data,
  );

  return response.data;
}

export async function getWorkLogs(
  workOrderId: string,
) {
  const response = await api.get(
    `/work-orders/${workOrderId}/work-logs`,
  );

  return response.data;
}

export async function getWorkOrderPhotos(
  workOrderId: string,
) {
  const response = await api.get(
    `/work-orders/${workOrderId}/photos`,
  );

  return response.data;
}

export async function uploadWorkOrderPhoto(
  workOrderId: string,
  file: File,
) {
  const formData = new FormData();

  formData.append("photo", file);

  const response = await api.post(
    `/work-orders/${workOrderId}/photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}