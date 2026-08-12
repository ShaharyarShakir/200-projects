import { shopSettingsRepository, ShopSettingsRepository } from './shop-settings.repository';
import type { UpdateShopSettingsDto } from './shop-settings.types';
import type { IShopSettings } from '../../models/shop-settings.model';

export class ShopSettingsService {
  constructor(private repository: ShopSettingsRepository = shopSettingsRepository) {}

  async getSettingsByShopId(shopId: string): Promise<IShopSettings> {
    let settings = await this.repository.findByShopId(shopId);
    if (!settings) {
      settings = await this.repository.createDefaultSettings(shopId);
    }
    return settings;
  }

  async updateSettings(shopId: string, dto: UpdateShopSettingsDto): Promise<IShopSettings> {
    const updated = await this.repository.update(shopId, dto);
    return updated!;
  }
}

export const shopSettingsService = new ShopSettingsService();
