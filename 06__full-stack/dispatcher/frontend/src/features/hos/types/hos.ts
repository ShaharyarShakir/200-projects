export type HOSEventType = 'pickup' | 'drive' | 'break' | 'fuel' | 'sleep' | 'dropoff' | 'off_duty';

export interface HOSEvent {
  order: number;
  type: HOSEventType;
  hours: number;
  minutes: number;
  start_time: string;
  end_time: string;
  distance: number;
  location: string;
  notes: string;
}

export interface HOSStatus {
  remaining_drive: number;
  remaining_duty: number;
  remaining_until_break: number;
  remaining_cycle: number;
  max_allowed_drive_now: number;
}

export interface HOSGeneratePayload {
  distance?: number;
  duration?: number;
  cycle_used?: number;
  trip_id?: string;
  start_time?: string;
}

export interface HOSScheduleResponse {
  trip_id?: string;
  distance: number;
  duration: number;
  initial_cycle_used: number;
  final_cycle_used: number;
  total_trip_elapsed_hours: number;
  start_time: string;
  end_time: string;
  status: HOSStatus;
  events: HOSEvent[];
}

export interface TripScheduleResponse {
  trip_id: string;
  events: HOSEvent[];
}
