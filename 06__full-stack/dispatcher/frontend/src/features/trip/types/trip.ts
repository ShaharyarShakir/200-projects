export type TripStatus = 'Draft' | 'Planning' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  user?: number | string;
  user_email?: string;
  current_location: string;
  current_location_name?: string;
  current_lat?: number | null;
  current_lng?: number | null;

  pickup_location: string;
  pickup_name?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;

  dropoff_location: string;
  dropoff_name?: string;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;

  current_cycle_used: number;
  status: TripStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTripPayload {
  current_location: string;
  current_location_name?: string;
  current_lat?: number | null;
  current_lng?: number | null;

  pickup_location: string;
  pickup_name?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;

  dropoff_location: string;
  dropoff_name?: string;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;

  current_cycle_used: number;
  status?: TripStatus;
  notes?: string;
}


export type UpdateTripPayload = Partial<CreateTripPayload>;

export interface TripQueryParams {
  status?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export interface PaginatedTripResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Trip[];
}
