export type IncidentStatus = 'Active' | 'Contained' | 'Monitoring' | 'Out of Control';
export type DataMode = 'LIVE' | 'SAMPLE' | 'STALE' | 'ERROR' | 'LOADING';

export interface Incident {
  id: string;
  incident_code: string;
  name: string;
  hazard_type: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  data_mode: DataMode;
  created_at?: string;
  // UI helper fields
  location_name?: string;
  acres_burned?: number;
  containment_pct?: number;
  fuel_type?: string;
  jurisdiction?: string;
}

export interface FireObservation {
  id: string;
  incident_id: string;
  latitude: number;
  longitude: number;
  brightness?: number; // Kelvin or FRP
  frp?: number; // Fire Radiative Power (MW)
  confidence?: 'low' | 'nominal' | 'high' | number;
  observed_at?: string;
  source: string; // 'VIIRS NOAA-20' | 'VIIRS Suomi-NPP' | 'MODIS Terra/Aqua'
  is_simulated: boolean;
  created_at?: string;
}

export interface AlertItem {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  severity: 'Extreme' | 'Critical' | 'High' | 'Moderate' | 'Advisory';
  source: string;
  is_simulated: boolean;
  suggested_precautions?: string[];
  affected_areas?: string[];
  created_at?: string;
}
