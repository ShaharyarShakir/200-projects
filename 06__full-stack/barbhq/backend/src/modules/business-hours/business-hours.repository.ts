import { BusinessHours, type IBusinessHours } from '../../models/business-hours.model';
import type { UpdateBusinessHoursDto } from './business-hours.types';

export class BusinessHoursRepository {
  async findByShopId(shopId: string): Promise<IBusinessHours | null> {
    return BusinessHours.findOne({ shopId });
  }

  async createDefaultHours(shopId: string): Promise<IBusinessHours> {
    const hours = new BusinessHours({ shopId });
    return hours.save();
  }

  async update(shopId: string, data: UpdateBusinessHoursDto): Promise<IBusinessHours | null> {
    return BusinessHours.findOneAndUpdate(
      { shopId },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );
  }
}

export const businessHoursRepository = new BusinessHoursRepository();
