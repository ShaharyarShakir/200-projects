import { AxiosError } from "axios";

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[] | string>;
  code?: string;
  statusCode?: number;
}

export function parseApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    if (responseData?.message) {
      return responseData.message;
    }
    if (error.response?.status === 401) {
      return "Session expired. Please log in again.";
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.response?.status === 404) {
      return "Requested resource not found.";
    }
    if (error.response?.status === 409) {
      return "Conflict detected. The resource already exists or state conflicts.";
    }
    if (error.response?.status === 422) {
      return "Validation error. Please check your inputs.";
    }
    if (error.response?.status && error.response.status >= 500) {
      return "Server error. Please try again later.";
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}
