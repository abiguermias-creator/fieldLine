import { api } from "./client";

type CreateWorkOrderData = {
  clientId: string;
  siteId: string;
  title: string;
  description?: string;
  priority: "P1" | "P2" | "P3" | "P4";
  duplicateConfirmed?: boolean;
};

type CreateClientRequestData = {
  siteId: string;
  title: string;
  description?: string;
  priority: "P1" | "P2" | "P3" | "P4";
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
  sortBy?: "createdAt" | "priority" | "nearestSla";
  sortOrder?: "asc" | "desc";
};

export async function getWorkOrders(
  params: GetWorkOrdersParams = {}
) {
  const response = await api.get("/work-orders", {
    params: {
      ...params,

      statuses:
        params.statuses && params.statuses.length > 0
          ? params.statuses.join(",")
          : undefined,

      priorities:
        params.priorities && params.priorities.length > 0
          ? params.priorities.join(",")
          : undefined,
    },
  });

  return response.data;
}

export async function createWorkOrder(
  data: CreateWorkOrderData
) {
  const response = await api.post("/work-orders", data);
  return response.data;
}

export async function createClientRequest(
  data: CreateClientRequestData
) {
  const response = await api.post(
    "/work-orders/request",
    data
  );

  return response.data;
}

export async function getWorkOrderById(id: string) {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
}

type UpdateWorkOrderData = {
  title?: string;
  description?: string;
  priority?: "P1" | "P2" | "P3" | "P4";
  estimatedDuration?: number | null;
  skillIds?: string[];
};

export async function updateWorkOrder(
  id: string,
  data: UpdateWorkOrderData
) {
  const response = await api.patch(
    `/work-orders/${id}`,
    data
  );

  return response.data;
}

export async function cancelWorkOrder(
  id: string,
  reason: string
) {
  const response = await api.patch(
    `/work-orders/${id}/cancel`,
    { reason }
  );

  return response.data;
}