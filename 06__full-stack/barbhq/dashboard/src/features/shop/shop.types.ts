export interface Shop {
  id: string;
  name: string;
  logo?: string;
  currency: string;
  timezone: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ShopState {
  shop: Shop | null;
  isLoading: boolean;
  error: string | null;
}
