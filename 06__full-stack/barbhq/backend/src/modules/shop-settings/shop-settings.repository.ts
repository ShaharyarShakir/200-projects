import { ShopSettings, type IShopSettings } from '../../models/shop-settings.model';
import type { UpdateShopSettingsDto } from './shop-settings.types';

export class ShopSettingsRepository {
  async findByShopId(shopId: string): Promise<IShopSettings | null> {
    return ShopSettings.findOne({ shopId });
  }

  async createDefaultSettings(shopId: string): Promise<IShopSettings> {
    const settings = new ShopSettings({ shopId });
    return settings.save();
  }

  async update(shopId: string, data: UpdateShopSettingsDto): Promise<IShopSettings | null> {
    return ShopSettings.findOneAndUpdate(
      { shopId },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );
  }
}

export const shopSettingsRepository = new ShopSettingsRepository();
