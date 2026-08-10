import { businessHoursRepository, BusinessHoursRepository } from './business-hours.repository';
import type { UpdateBusinessHoursDto, DayScheduleDto } from './business-hours.types';
import type { IBusinessHours } from '../../models/business-hours.model';
import { ApiError } from '../../utils/ApiError';

export class BusinessHoursService {
  constructor(private repository: BusinessHoursRepository = businessHoursRepository) {}

  private validateDaySchedule(dayName: string, schedule?: DayScheduleDto): void {
    if (!schedule || !schedule.enabled) return;

    if (!schedule.open || !schedule.close) {
      throw new ApiError(400, `${dayName} is enabled but missing open or close time`);
    }

    if (schedule.open >= schedule.close) {
      throw new ApiError(400, `Invalid business hours for ${dayName}: open time (${schedule.open}) must be before close time (${schedule.close})`);
    }
  }

  async getHoursByShopId(shopId: string): Promise<IBusinessHours> {
    let hours = await this.repository.findByShopId(shopId);
    if (!hours) {
      hours = await this.repository.createDefaultHours(shopId);
    }
    return hours;
  }

  async updateHours(shopId: string, dto: UpdateBusinessHoursDto): Promise<IBusinessHours> {
    const days: (keyof UpdateBusinessHoursDto)[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    for (const day of days) {
      if (dto[day]) {
        this.validateDaySchedule(day, dto[day]);
      }
    }

    const updated = await this.repository.update(shopId, dto);
    return updated!;
  }
}

export const businessHoursService = new BusinessHoursService();
