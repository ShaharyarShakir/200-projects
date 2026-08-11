import { ShopHoliday, type IShopHoliday } from '../../models/holiday.model';
import type { CreateHolidayDto, UpdateHolidayDto } from './holiday.types';

export class HolidayRepository {
  async create(shopId: string, data: CreateHolidayDto): Promise<IShopHoliday> {
    const holiday = new ShopHoliday({ ...data, shopId });
    return holiday.save();
  }

  async findByShopId(shopId: string): Promise<IShopHoliday[]> {
    return ShopHoliday.find({ shopId }).sort({ date: 1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IShopHoliday | null> {
    return ShopHoliday.findOne({ _id: id, shopId });
  }

  async findByDateAndShop(date: string, shopId: string): Promise<IShopHoliday | null> {
    return ShopHoliday.findOne({ shopId, date });
  }

  async update(id: string, shopId: string, data: UpdateHolidayDto): Promise<IShopHoliday | null> {
    return ShopHoliday.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string, shopId: string): Promise<IShopHoliday | null> {
    return ShopHoliday.findOneAndDelete({ _id: id, shopId });
  }
}

export const holidayRepository = new HolidayRepository();
