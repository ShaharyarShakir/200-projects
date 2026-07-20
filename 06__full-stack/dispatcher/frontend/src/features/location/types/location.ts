export interface LocationItem {
  display_name: string;
  name?: string;
  lat: number;
  lng: number;
  place_id: string;
}

export interface GeocodeSearchResponse {
  results: LocationItem[];
}
