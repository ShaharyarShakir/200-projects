import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? ((import.meta as any).env?.VITE_API_URL || "http://localhost:3001")
    : "http://localhost:3001",
});
