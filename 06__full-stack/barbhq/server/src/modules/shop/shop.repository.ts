import { ShopModel } from './shop.model';
import type { IShopDocument } from './shop.model';
import type { IShop } from './shop.types';

export class ShopRepository {
  async create(shopData: Partial<IShop>): Promise<IShopDocument> {
    return await ShopModel.create(shopData);
  }

  async findById(id: string): Promise<IShopDocument | null> {
    return await ShopModel.findById(id);
  }

  async findBySlug(slug: string): Promise<IShopDocument | null> {
    return await ShopModel.findOne({ slug: slug.toLowerCase() });
  }

  async findByEmail(email: string): Promise<IShopDocument | null> {
    return await ShopModel.findOne({ email: email.toLowerCase() });
  }
}
