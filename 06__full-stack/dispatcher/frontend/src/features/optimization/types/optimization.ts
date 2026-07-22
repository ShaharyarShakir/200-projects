export type StopCategory =
  | 'Fuel'
  | 'Truck Stop'
  | 'Rest Area'
  | 'Parking'
  | 'Hotel'
  | 'Food'
  | 'Maintenance';

export interface StopMetadata {
  rating?: number;
  truck_friendly?: boolean;
  open_24h?: boolean;
  parking_spots?: number;
  fuel_price?: number;
  city_state?: string;
  amenities?: string[];
  notes?: string;
}

export interface Stop {
  id: string;
  trip?: string;
  name: string;
  category: StopCategory;
  latitude: number;
  longitude: number;
  distance_from_start: number;
  arrival_time: string;
  departure_time: string;
  duration: number; // in hours
  priority: number; // 0..100
  source: string;
  is_locked: boolean;
  is_custom: boolean;
  order: number;
  metadata: StopMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface FuelSummary {
  distance_miles: number;
  mpg: number;
  tank_capacity_gallons: number;
  effective_fuel_range_miles: number;
  gallons_needed: number;
  estimated_fuel_cost: number;
  fuel_stops_needed: number;
  avg_price_per_gallon: number;
}

export interface RestSummary {
  driving_duration_hours: number;
  breaks_30m_needed: number;
  sleeps_10h_needed: number;
  restarts_needed: number;
  break_milestones_miles: number[];
  sleep_milestones_miles: number[];
}

export interface RouteComparisonData {
  original: {
    distance_miles: number;
    time_hours: number;
    fuel_stops: number;
    fuel_cost: number;
  };
  optimized: {
    distance_miles: number;
    time_hours: number;
    fuel_stops: number;
    fuel_cost: number;
  };
  savings: {
    time_saved_minutes: number;
    fuel_stops_reduced: number;
    cost_saved_dollars: number;
  };
}

export interface AlternativeRoute {
  id: string;
  name: string;
  tag: string;
  distance_miles: number;
  time_hours: number;
  fuel_stops: number;
  estimated_cost: number;
  score_percent: number;
}

export interface OptimizationResult {
  optimization_score: number;
  total_distance_miles: number;
  total_driving_hours: number;
  total_trip_hours: number;
  fuel_summary: FuelSummary;
  rest_summary: RestSummary;
  route_comparison: RouteComparisonData;
  alternative_routes: AlternativeRoute[];
  optimized_stops: Stop[];
}

export interface DriverPreferences {
  preferred_chains?: string[];
  max_drive_block_hours?: number;
  fuel_threshold_percent?: number;
  avoid_tolls?: boolean;
  avoid_ferries?: boolean;
  prefer_highways?: boolean;
}

export interface OptimizeRequest {
  tripId?: string;
  current_location?: string;
  pickup_location?: string;
  dropoff_location?: string;
  current_cycle_used?: number;
  start_time?: string;
  driver_preferences?: DriverPreferences;
}
