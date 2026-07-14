import axios from "axios";

export const api = axios.create({
  baseURL: typeof window !== "undefined"
    ? (import.meta.env.VITE_API_URL || "")
    : (process.env.VITE_API_URL || "http://localhost:3001"),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});