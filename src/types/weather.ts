export interface WeatherObservation {
  id?: string;
  incident_id?: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_gusts_kmh?: number;
  dew_point_c?: number;
  surface_pressure_hpa?: number;
  forecast_time: string;
  source: string;
  is_simulated: boolean;
  created_at?: string;
}

export interface HourlyForecastPoint {
  time: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_probability_pct?: number;
}

export interface WeatherData {
  current: WeatherObservation;
  hourly: HourlyForecastPoint[];
  last_updated: string;
  is_live: boolean;
  source_name: string;
}
