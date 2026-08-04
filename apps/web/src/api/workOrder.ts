import { api } from "./client";

export async function getWorkOrders() {
  const response = await api.get("/work-orders");
  return response.data;
}