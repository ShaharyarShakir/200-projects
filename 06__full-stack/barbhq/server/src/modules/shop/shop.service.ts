import { ShopRepository } from './shop.repository';
import type { IShopDocument } from './shop.model';
import type { IShop } from './shop.types';
import { ApiError } from '../../utils/ApiError';

export class ShopService {
  private shopRepository: ShopRepository;

  constructor() {
    this.shopRepository = new ShopRepository();
  }

  async getShopById(id: string): Promise<IShopDocument> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new ApiError(404, 'Shop not found');
    }
    return shop;
  }

  async createShop(shopData: Partial<IShop>): Promise<IShopDocument> {
    if (!shopData.slug) {
      throw new ApiError(400, 'Shop slug is required');
    }

    const existingShop = await this.shopRepository.findBySlug(shopData.slug);
    if (existingShop) {
      throw new ApiError(400, 'Shop slug is already in use');
    }

    return await this.shopRepository.create(shopData);
  }
}
