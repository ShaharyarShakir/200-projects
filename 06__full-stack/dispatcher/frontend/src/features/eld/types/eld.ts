export type DutyStatus = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY';

export interface DutyEvent {
  id?: string;
  type: DutyStatus;
  type_display?: string;
  start_time: string;
  end_time: string;
  duration: number;
  location: string;
  notes: string;
}

export interface ELDGraphSegment {
  status: DutyStatus;
  start_hour: number;
  end_hour: number;
  duration: number;
  location: string;
  notes: string;
}

export interface ELDSummary {
  driving_hours: number;
  duty_hours: number;
  sleeper_hours: number;
  off_duty_hours: number;
  total_hours: number;
  total_distance: number;
  fuel_stops: number;
  rest_stops: number;
  cycle_used: number;
}

export interface ELDDriverInfo {
  name: string;
  license: string;
  carrier: string;
  home_terminal: string;
  vehicle_number: string;
  trailer_number: string;
}

export interface ELDTripInfo {
  origin: string;
  pickup: string;
  dropoff: string;
  distance: number;
  duration: number;
}

export interface DailyLog {
  id?: string;
  day_number: number;
  date: string;
  total_distance: number;
  driving_hours: number;
  duty_hours: number;
  sleeper_hours: number;
  off_duty_hours: number;
  cycle_hours: number;
  graph_data: ELDGraphSegment[];
  summary: ELDSummary;
  driver_info: ELDDriverInfo;
  trip_info: ELDTripInfo;
  duty_events: DutyEvent[];
}

export interface ELDGeneratePayload {
  trip_id?: string;
  distance?: number;
  duration?: number;
  cycle_used?: number;
  start_time?: string;
  driver_name?: string;
  carrier?: string;
  vehicle_number?: string;
  trailer_number?: string;
}

export interface ELDGenerateResponse {
  trip_id?: string | null;
  total_days: number;
  logs: DailyLog[];
}
