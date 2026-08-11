export interface CreateHolidayDto {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface UpdateHolidayDto {
  date?: string;
  name?: string;
}
