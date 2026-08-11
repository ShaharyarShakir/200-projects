import { Shop, type IShop } from '../../models/shop.model';
import type { CreateShopDto, UpdateShopDto } from './shop.types';

export class ShopRepository {
  async create(data: CreateShopDto): Promise<IShop> {
    const shop = new Shop(data);
    return shop.save();
  }

  async findById(id: string): Promise<IShop | null> {
    return Shop.findById(id);
  }

  async findBySlug(slug: string): Promise<IShop | null> {
    return Shop.findOne({ slug: slug.toLowerCase() });
  }

  async update(id: string, data: UpdateShopDto): Promise<IShop | null> {
    return Shop.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IShop | null> {
    return Shop.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

export const shopRepository = new ShopRepository();
