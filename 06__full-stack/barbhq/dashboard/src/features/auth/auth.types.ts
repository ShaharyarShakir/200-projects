export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shopId: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  pinCode?: string;
}

export interface RegisterCredentials {
  shopName: string;
  shopSlug?: string;
  shopEmail?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  shop?: any;
}

