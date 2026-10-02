import { ApiError } from "./vms";
import type {
  ApiErrorResponse,
  CreateVmDirectoryRequest,
  UploadVmFileRequest,
  VmFileDeleteResult,
  VmFileListResult,
  VmFileMkdirResult,
  VmFileReadResult,
  VmFileWriteResult,
} from "./types";

/**
 * Helper to parse API errors from a failed Response object.
 */
async function handleApiError(response: Response): Promise<never> {
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

/**
 * Lists files and directories in a microVM directory via GET /api/vms/:id/files?path=...
 *
 * @param id - MicroVM identifier
 * @param path - Filesystem path within the VM (defaults to "/")
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to VmFileListResult
 */
export async function listVmFiles(
  id: string,
  path: string = "/",
  fetchFn: typeof fetch = fetch
): Promise<VmFileListResult> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files?path=${encodeURIComponent(path)}`;
    response = await fetchFn(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = (await response.json()) as VmFileListResult;
  return {
    path: data?.path ?? path,
    entries: data?.entries ?? [],
  };
}

/**
 * Reads text file contents from a microVM via GET /api/vms/:id/files/read?path=...
 *
 * @param id - MicroVM identifier
 * @param path - Path to the file within the microVM
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to VmFileReadResult
 */
export async function readVmFile(
  id: string,
  path: string,
  fetchFn: typeof fetch = fetch
): Promise<VmFileReadResult> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files/read?path=${encodeURIComponent(path)}`;
    response = await fetchFn(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = (await response.json()) as VmFileReadResult;
  return data;
}

/**
 * Uploads a file into a microVM directory via POST /api/vms/:id/files.
 *
 * @param id - MicroVM identifier
 * @param options - Upload parameters including destDir, fileName, and contentBase64
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to VmFileWriteResult
 */
export async function uploadVmFile(
  id: string,
  options: UploadVmFileRequest,
  fetchFn: typeof fetch = fetch
): Promise<VmFileWriteResult> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files`;
    response = await fetchFn(url, {
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
    await handleApiError(response);
  }

  const data = (await response.json()) as VmFileWriteResult;
  return data;
}

/**
 * Creates a directory inside a microVM via POST /api/vms/:id/files/mkdir.
 *
 * @param id - MicroVM identifier
 * @param options - Directory creation options including target path
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to VmFileMkdirResult
 */
export async function createVmDirectory(
  id: string,
  options: CreateVmDirectoryRequest,
  fetchFn: typeof fetch = fetch
): Promise<VmFileMkdirResult> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files/mkdir`;
    response = await fetchFn(url, {
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
    await handleApiError(response);
  }

  const data = (await response.json()) as VmFileMkdirResult;
  return data;
}

/**
 * Deletes a file or empty directory in a microVM via DELETE /api/vms/:id/files?path=...
 *
 * @param id - MicroVM identifier
 * @param path - Filesystem path of the item to delete
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to VmFileDeleteResult
 */
export async function deleteVmFile(
  id: string,
  path: string,
  fetchFn: typeof fetch = fetch
): Promise<VmFileDeleteResult> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files?path=${encodeURIComponent(path)}`;
    response = await fetchFn(url, {
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
    await handleApiError(response);
  }

  const data = (await response.json()) as VmFileDeleteResult;
  return data;
}

/**
 * Downloads a file from a microVM via GET /api/vms/:id/files/download?path=...
 *
 * @param id - MicroVM identifier
 * @param path - Filesystem path of the file to download
 * @param fetchFn - Optional custom fetch implementation
 * @returns Promise resolving to the binary Blob
 */
export async function downloadVmFile(
  id: string,
  path: string,
  fetchFn: typeof fetch = fetch
): Promise<Blob> {
  let response: Response;
  try {
    const url = `/api/vms/${encodeURIComponent(id)}/files/download?path=${encodeURIComponent(path)}`;
    response = await fetchFn(url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.blob();
}
