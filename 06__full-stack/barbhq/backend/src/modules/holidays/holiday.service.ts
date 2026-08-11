import { holidayRepository, HolidayRepository } from './holiday.repository';
import type { CreateHolidayDto, UpdateHolidayDto } from './holiday.types';
import type { IShopHoliday } from '../../models/holiday.model';
import { ApiError } from '../../utils/ApiError';

export class HolidayService {
  constructor(private repository: HolidayRepository = holidayRepository) {}

  async createHoliday(shopId: string, dto: CreateHolidayDto): Promise<IShopHoliday> {
    const existing = await this.repository.findByDateAndShop(dto.date, shopId);
    if (existing) {
      throw new ApiError(400, `A holiday for date '${dto.date}' already exists`);
    }
    return this.repository.create(shopId, dto);
  }

  async getHolidaysByShop(shopId: string): Promise<IShopHoliday[]> {
    return this.repository.findByShopId(shopId);
  }

  async updateHoliday(id: string, shopId: string, dto: UpdateHolidayDto): Promise<IShopHoliday> {
    if (dto.date) {
      const existing = await this.repository.findByDateAndShop(dto.date, shopId);
      if (existing && existing._id.toString() !== id) {
        throw new ApiError(400, `A holiday for date '${dto.date}' already exists`);
      }
    }

    const updated = await this.repository.update(id, shopId, dto);
    if (!updated) {
      throw new ApiError(404, 'Holiday not found');
    }
    return updated;
  }

  async deleteHoliday(id: string, shopId: string): Promise<void> {
    const deleted = await this.repository.delete(id, shopId);
    if (!deleted) {
      throw new ApiError(404, 'Holiday not found');
    }
  }
}

export const holidayService = new HolidayService();
