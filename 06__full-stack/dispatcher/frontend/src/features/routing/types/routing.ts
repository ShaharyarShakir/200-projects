export type CoordinatePair = [number, number]; // [longitude, latitude]
export type LatLngPair = [number, number]; // [latitude, longitude]

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface GeocodeRequest {
  address: string;
}

export interface GeocodeResponse {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  current?: LocationPoint | CoordinatePair;
  origin?: LocationPoint | CoordinatePair;
  pickup: LocationPoint | CoordinatePair;
  dropoff: LocationPoint | CoordinatePair;
}

export interface DirectionStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  type: number;
  name: string;
  segment?: number;
}

export interface RouteSummaryDetails {
  distance_km: number;
  duration_hours: number;
}

export interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: LatLngPair[]; // array of [lat, lng]
  bbox?: number[];
  summary?: RouteSummaryDetails;
  steps?: DirectionStep[];
  trip_id?: string;
  cached?: boolean;
}

export interface TripLocationState {
  address: string;
  coords: CoordinatePair | null;
}

export interface TripFormValues {
  origin: TripLocationState;
  pickup: TripLocationState;
  dropoff: TripLocationState;
}
