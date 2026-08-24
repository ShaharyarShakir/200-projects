import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ShopContext } from "./shop-context";
import type { ShopContextValue } from "./shop-context";
import type { Shop, ShopState } from "./shop.types";
import { shopApi } from "./shop.api";
import { useAuth } from "../auth";
import { API_CONFIG } from "../../lib/api";

const DEFAULT_SHOP: Shop = {
  id: "shop-001",
  name: "BarbHQ Signature Salon",
  currency: "PKR",
  timezone: "Asia/Karachi",
};

interface ShopProviderProps {
  children: React.ReactNode;
}

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<ShopState>(() => {
    const savedShopJson = localStorage.getItem(API_CONFIG.shopStorageKey);
    let savedShop: Shop | null = DEFAULT_SHOP;
    if (savedShopJson) {
      try {
        savedShop = JSON.parse(savedShopJson);
      } catch {
        savedShop = DEFAULT_SHOP;
      }
    }
    return {
      shop: savedShop,
      isLoading: false,
      error: null,
    };
  });

  const refetchShop = useCallback(async () => {
    if (!isAuthenticated) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const fetchedShop = await shopApi.getCurrentShop();
      const activeShop = fetchedShop || DEFAULT_SHOP;
      localStorage.setItem(API_CONFIG.shopStorageKey, JSON.stringify(activeShop));
      setState({
        shop: activeShop,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        shop: prev.shop || DEFAULT_SHOP,
        isLoading: false,
        error: err?.message || "Failed to load shop details",
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refetchShop();
    }
  }, [isAuthenticated, refetchShop]);

  const updateShop = useCallback(async (data: Partial<Shop>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const updated = await shopApi.updateShop(data);
      const newShop = updated || { ...state.shop, ...data } as Shop;
      localStorage.setItem(API_CONFIG.shopStorageKey, JSON.stringify(newShop));
      setState({
        shop: newShop,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || "Failed to update shop",
      }));
      throw err;
    }
  }, [state.shop]);

  const value: ShopContextValue = useMemo(
    () => ({
      ...state,
      refetchShop,
      updateShop,
    }),
    [state, refetchShop, updateShop]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
