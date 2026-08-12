import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to inject token from localStorage directly
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("barbhq_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Subscriber slot to trigger logout from the store dynamically without circular imports
let onUnauthorizedCallback: (() => void) | null = null;

export const registerUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Response Interceptor to handle unauthenticated requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("barbhq_token");
      const url = error.config?.url || "";
      if (!url.includes("/auth/logout") && !url.includes("/auth/login") && onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
