import { useContext } from "react";
import { ShopContext } from "./shop-context";
import type { ShopContextValue } from "./shop-context";

export function useShop(): ShopContextValue {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
