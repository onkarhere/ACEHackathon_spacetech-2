import { ForecastRun } from '../types/forecast';
import { supabase, isSupabaseConfigured } from './supabase';
import { DEMO_INCIDENTS } from '../data/demoData';
import { computeConvexHull, generateWindSpreadHull } from '../utils/geo';

export async function generateForecastRun(
  incidentId: string,
  horizon: 6 | 12,
  options?: {
    latitude?: number;
    longitude?: number;
    windSpeedKmh?: number;
    windDirectionDeg?: number;
  }
): Promise<ForecastRun> {
  // 1. If Supabase configured, attempt edge function invocation
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-forecast', {
        body: { incidentId, horizonHours: horizon, options },
      });
      if (!error && data?.forecast_geojson) {
        return data as ForecastRun;
      }
    } catch {
      // Fallback
    }
  }

  // 2. Dynamic convex hull wind spread computation
  const bundle = DEMO_INCIDENTS[incidentId] || DEMO_INCIDENTS['LIVE-ID'] || DEMO_INCIDENTS['CA-SNF-001942'];
  const baseLat = options?.latitude ?? bundle.incident.latitude;
  const baseLon = options?.longitude ?? bundle.incident.longitude;
  const windDir = options?.windDirectionDeg ?? bundle.weather.current.wind_direction_deg;
  const windSpeed = options?.windSpeedKmh ?? bundle.weather.current.wind_speed_kmh;

  const points: [number, number][] = bundle.hotspots.map((h) => [h.longitude, h.latitude]);
  const baseHull = computeConvexHull(points);
  const spreadHull = generateWindSpreadHull(
    baseHull,
    baseLat,
    baseLon,
    windDir,
    windSpeed,
    horizon
  );

  const downwindBearing = Math.round((windDir + 180) % 360);
  const riskLevel = horizon === 6 ? 'Moderate' : 'Moderate';
  const projectedAreaHa = Math.round(
    (horizon === 6 ? 31200 : 38900) * (1 + (windSpeed - 10) / 40)
  );

  return {
    id: `fc-dynamic-${incidentId}-${horizon}h`,
    incident_id: incidentId,
    forecast_horizon_hours: horizon,
    risk_level: riskLevel,
    forecast_geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: `poly-${incidentId}-${horizon}h`,
            risk_level: riskLevel,
            horizon_hours: horizon,
            label: `Projected risk zone (demo model)`,
            burn_probability: horizon === 6 ? 0.72 : 0.58,
            area_ha: projectedAreaHa,
            wind_driven_kmh: windSpeed,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [spreadHull],
          },
        },
      ],
    },
    model_type: 'demo-wind-ellipse-v1',
    assumptions: `Spread direction follows surface wind (${Math.round(windDir)}°). Ignores terrain, fuel type, suppression.`,
    spread_rate_kmh: Math.round((0.35 + (windSpeed / 100) * 0.9) * 100) / 100,
    projected_area_ha: projectedAreaHa,
    spread_direction_deg: downwindBearing,
    is_simulated: true,
    created_at: new Date().toISOString(),
  };
}
