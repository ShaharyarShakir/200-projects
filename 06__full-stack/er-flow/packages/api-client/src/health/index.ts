import { api } from "../client";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  timestamp: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}
