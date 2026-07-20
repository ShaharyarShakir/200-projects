export type CoordinatePair = [number, number]; // [longitude, latitude]
export type LatLngPair = [number, number]; // [latitude, longitude]

export interface GeocodeRequest {
  address: string;
}

export interface GeocodeResponse {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: CoordinatePair;
  pickup: CoordinatePair;
  dropoff: CoordinatePair;
}

export interface RouteResponse {
  duration_seconds(duration_seconds: any): unknown;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: LatLngPair[]; // array of [lat, lng]
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
