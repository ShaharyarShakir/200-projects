export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 10000,
  tokenStorageKey: "barbhq_token",
  userStorageKey: "barbhq_user",
  shopStorageKey: "barbhq_shop",
};
