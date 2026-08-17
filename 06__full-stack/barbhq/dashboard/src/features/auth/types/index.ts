import type { User } from "../../../types";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
