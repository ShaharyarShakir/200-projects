import axios from "axios";
import { API_CONFIG } from "./config";
import { parseApiError } from "./errors";

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorizedCallback: (() => void) | null = null;

export const registerUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(API_CONFIG.tokenStorageKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(API_CONFIG.tokenStorageKey);
      localStorage.removeItem(API_CONFIG.userStorageKey);
      localStorage.removeItem(API_CONFIG.shopStorageKey);
      const url = error.config?.url || "";
      if (!url.includes("/auth/logout") && !url.includes("/auth/login") && onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    try {
      const response = await apiClient.get(url, { params });
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await apiClient.post(url, data);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await apiClient.put(url, data);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  patch: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await apiClient.patch(url, data);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },

  delete: async <T>(url: string): Promise<T> => {
    try {
      const response = await apiClient.delete(url);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  },
};

export default apiClient;
