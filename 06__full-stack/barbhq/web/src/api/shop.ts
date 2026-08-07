import api from "./axios";
import type { Shop } from "../types";

export const shopApi = {
  getShopSettings: async (): Promise<Shop> => {
    const { data } = await api.get<Shop>("/shop");
    return data;
  },

  updateShopSettings: async (settings: Partial<Shop>): Promise<Shop> => {
    const { data } = await api.put<Shop>("/shop", settings);
    return data;
  },

  getShopSummary: async (): Promise<unknown> => {
    const { data } = await api.get("/shop/summary");
    return data;
  },
};
