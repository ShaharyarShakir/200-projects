export interface DayScheduleDto {
  enabled: boolean;
  open?: string;
  close?: string;
}

export interface UpdateBusinessHoursDto {
  monday?: DayScheduleDto;
  tuesday?: DayScheduleDto;
  wednesday?: DayScheduleDto;
  thursday?: DayScheduleDto;
  friday?: DayScheduleDto;
  saturday?: DayScheduleDto;
  sunday?: DayScheduleDto;
}
