import { fetchApi } from "./client";
import {
  RepositoryListResponse,
  RepositoryRead,
  RepositorySyncResponse,
} from "./types";

export interface ListRepositoriesOptions {
  limit?: number;
  offset?: number;
}

export async function listRepositories(
  limitOrOptions?: number | ListRepositoriesOptions,
  offsetArg?: number
): Promise<RepositoryListResponse> {
  let limit = 20;
  let offset = 0;

  if (typeof limitOrOptions === "object" && limitOrOptions !== null) {
    limit = limitOrOptions.limit ?? 20;
    offset = limitOrOptions.offset ?? 0;
  } else if (typeof limitOrOptions === "number") {
    limit = limitOrOptions;
    offset = offsetArg ?? 0;
  }

  const query = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  }).toString();

  return fetchApi<RepositoryListResponse>(`/api/v1/repositories?${query}`, {
    method: "GET",
  });
}

export async function syncRepositories(): Promise<RepositorySyncResponse> {
  return fetchApi<RepositorySyncResponse>("/api/v1/repositories/sync", {
    method: "POST",
  });
}

export async function getRepository(id: string): Promise<RepositoryRead> {
  return fetchApi<RepositoryRead>(`/api/v1/repositories/${id}`, {
    method: "GET",
  });
}

export const repositoriesApi = {
  listRepositories,
  getRepositories: listRepositories,
  syncRepositories,
  getRepository,
};
