import { api } from "../../lib/api";
import type { Shop } from "./shop.types";

export const shopApi = {
  getCurrentShop: async (): Promise<Shop> => {
    return api.get<Shop>("/shop");
  },

  updateShop: async (data: Partial<Shop>): Promise<Shop> => {
    return api.patch<Shop>("/shop", data);
  },
};
