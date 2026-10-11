export type ForecastHorizon = 0 | 6 | 12;

export interface ForecastRun {
  id: string;
  incident_id: string;
  forecast_horizon_hours: number; // 6 or 12
  risk_level: 'Extreme' | 'Critical' | 'High' | 'Moderate' | 'Low';
  forecast_geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | any;
  model_type: string;
  assumptions: string;
  is_simulated: boolean;
  spread_rate_kmh?: number;
  projected_area_ha?: number;
  spread_direction_deg?: number;
  created_at: string;
}

export interface PerimeterFeature {
  type: 'Feature';
  properties: {
    id: string;
    incident_id: string;
    type: 'observed_perimeter' | 'estimated_perimeter' | 'forecast_6h' | 'forecast_12h';
    label: string;
    status: string;
    area_hectares: number;
    updated_at: string;
    is_simulated: boolean;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}
