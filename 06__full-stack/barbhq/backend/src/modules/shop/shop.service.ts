import { shopRepository, ShopRepository } from './shop.repository';
import type { CreateShopDto, UpdateShopDto } from './shop.types';
import { ApiError } from '../../utils/ApiError';
import type { IShop } from '../../models/shop.model';

export class ShopService {
  constructor(private repository: ShopRepository = shopRepository) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async createShop(dto: CreateShopDto): Promise<IShop> {
    const slug = dto.slug ? dto.slug.toLowerCase().trim() : this.generateSlug(dto.name);

    const existingShop = await this.repository.findBySlug(slug);
    if (existingShop) {
      throw new ApiError(400, `Shop with slug '${slug}' already exists`);
    }

    return this.repository.create({
      ...dto,
      slug,
    });
  }

  async getShopById(id: string): Promise<IShop> {
    const shop = await this.repository.findById(id);
    if (!shop) {
      throw new ApiError(404, 'Shop not found');
    }
    return shop;
  }

  async updateShop(id: string, dto: UpdateShopDto): Promise<IShop> {
    const shop = await this.repository.update(id, dto);
    if (!shop) {
      throw new ApiError(404, 'Shop not found');
    }
    return shop;
  }
}

export const shopService = new ShopService();
