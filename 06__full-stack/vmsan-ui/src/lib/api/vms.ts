import type {
  ClientVM,
  GetVMsResponse,
  ApiErrorResponse,
  CreateVMRequest,
  CreateVMResponse,
  LifecycleActionResponse,
} from "./types";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Fetches the list of microVMs from the server API (/api/vms).
 *
 * @param fetchFn - Optional custom fetch implementation (defaults to global fetch)
 * @returns Promise resolving to an array of ClientVM
 * @throws ApiError when the request fails or returns an error status
 */
export async function getVMs(fetchFn: typeof fetch = fetch): Promise<ClientVM[]> {
  let response: Response;
  try {
    response = await fetchFn("/api/vms", {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      if (data?.error?.code) {
        errorCode = data.error.code;
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  const data = (await response.json()) as GetVMsResponse;
  return data?.vms ?? [];
}

/**
 * Creates a new microVM via the server API (/api/vms).
 *
 * @param options - Configuration including runtime, vcpus, and memoryMiB
 * @param fetchFn - Optional custom fetch implementation (defaults to global fetch)
 * @returns Promise resolving to CreateVMResponse
 * @throws ApiError when the request fails or returns an error status
 */
export async function createVM(
  options: CreateVMRequest,
  fetchFn: typeof fetch = fetch
): Promise<CreateVMResponse> {
  let response: Response;
  try {
    response = await fetchFn("/api/vms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(options),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      if (data?.error?.code) {
        errorCode = data.error.code;
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  const data = (await response.json()) as CreateVMResponse;
  return data;
}

/**
 * Starts a stopped microVM via the server API (POST /api/vms/:id/start).
 *
 * @param id - The ID of the VM to start
 * @param fetchFn - Optional custom fetch implementation (defaults to global fetch)
 * @returns Promise resolving to LifecycleActionResponse
 * @throws ApiError when the request fails or returns an error status
 */
export async function startVM(
  id: string,
  fetchFn: typeof fetch = fetch
): Promise<LifecycleActionResponse> {
  let response: Response;
  try {
    response = await fetchFn(`/api/vms/${encodeURIComponent(id)}/start`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      if (data?.error?.code) {
        errorCode = data.error.code;
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  const data = (await response.json()) as LifecycleActionResponse;
  return data;
}

/**
 * Stops a running microVM via the server API (POST /api/vms/:id/stop).
 *
 * @param id - The ID of the VM to stop
 * @param fetchFn - Optional custom fetch implementation (defaults to global fetch)
 * @returns Promise resolving to LifecycleActionResponse
 * @throws ApiError when the request fails or returns an error status
 */
export async function stopVM(
  id: string,
  fetchFn: typeof fetch = fetch
): Promise<LifecycleActionResponse> {
  let response: Response;
  try {
    response = await fetchFn(`/api/vms/${encodeURIComponent(id)}/stop`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      if (data?.error?.code) {
        errorCode = data.error.code;
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  const data = (await response.json()) as LifecycleActionResponse;
  return data;
}

/**
 * Deletes a microVM via the server API (DELETE /api/vms/:id).
 *
 * @param id - The ID of the VM to delete
 * @param fetchFn - Optional custom fetch implementation (defaults to global fetch)
 * @returns Promise resolving to LifecycleActionResponse
 * @throws ApiError when the request fails or returns an error status
 */
export async function deleteVM(
  id: string,
  fetchFn: typeof fetch = fetch
): Promise<LifecycleActionResponse> {
  let response: Response;
  try {
    response = await fetchFn(`/api/vms/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data?.error?.message) {
        errorMessage = data.error.message;
      }
      if (data?.error?.code) {
        errorCode = data.error.code;
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  const data = (await response.json()) as LifecycleActionResponse;
  return data;
}


