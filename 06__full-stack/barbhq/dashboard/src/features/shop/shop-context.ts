import { createContext } from "react";
import type { Shop, ShopState } from "./shop.types";

export interface ShopContextValue extends ShopState {
  refetchShop: () => Promise<void>;
  updateShop: (data: Partial<Shop>) => Promise<void>;
}

export const ShopContext = createContext<ShopContextValue | undefined>(undefined);
