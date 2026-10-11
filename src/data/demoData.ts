import { Incident, FireObservation, AlertItem } from '../types/incident';
import { WeatherData } from '../types/weather';
import { ForecastRun, PerimeterFeature } from '../types/forecast';
import { computeConvexHull, generateWindSpreadHull } from '../utils/geo';

export interface IncidentBundle {
  incident: Incident;
  hotspots: FireObservation[];
  currentPerimeter: PerimeterFeature;
  forecast6h: ForecastRun;
  forecast12h: ForecastRun;
  weather: WeatherData;
  alerts: AlertItem[];
}

// Generate organic hotspot clusters for Central Kalimantan
function generateKalimantanHotspots(): FireObservation[] {
  const baseLat = -2.5;
  const baseLon = 114.0;
  const count = 75; // representative density matching the screenshot
  const hotspots: FireObservation[] = [];

  // Deterministic cluster generation
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const rX = 0.55 * Math.cos(angle) + 0.15 * Math.sin(angle * 3);
    const rY = 0.28 * Math.sin(angle) + 0.08 * Math.cos(angle * 2);

    const lat = baseLat + rY + (Math.sin(i * 1.7) * 0.12);
    const lon = baseLon + rX + (Math.cos(i * 2.3) * 0.15);

    hotspots.push({
      id: `hs-kal-${i + 1}`,
      incident_id: 'LIVE-ID',
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      brightness: Math.round(330 + (Math.sin(i * 0.8) * 45) * 10) / 10,
      frp: Math.round(15 + Math.abs(Math.sin(i * 1.3)) * 80),
      confidence: i % 4 === 0 ? 'high' : 'nominal',
      observed_at: '2026-10-10T23:45:00Z',
      source: 'NASA FIRMS VIIRS_SNPP_NRT',
      is_simulated: true,
    });
  }

  return hotspots;
}

const kalimantanHotspots = generateKalimantanHotspots();
const kalimantanHullCoords = computeConvexHull(
  kalimantanHotspots.map((h) => [h.longitude, h.latitude])
);

const kalimantan6hCoords = generateWindSpreadHull(
  kalimantanHullCoords,
  -2.5,
  114.0,
  168, // Wind from South (168°) blowing North
  10.3,
  6
);

const kalimantan12hCoords = generateWindSpreadHull(
  kalimantanHullCoords,
  -2.5,
  114.0,
  168,
  10.3,
  12
);

export const DEMO_INCIDENTS: Record<string, IncidentBundle> = {
  'LIVE-ID': {
    incident: {
      id: 'LIVE-ID',
      incident_code: 'LIVE-ID',
      name: 'LIVE-ID — Central Kalimantan, Indonesia (live region)',
      hazard_type: 'wildfire',
      latitude: -2.5000,
      longitude: 114.0000,
      status: 'Monitoring',
      data_mode: 'SAMPLE',
      location_name: 'Central Kalimantan, Indonesia (live region)',
      acres_burned: 48500,
      containment_pct: 12,
      fuel_type: 'Tropical Peatland & Secondary Forest',
      jurisdiction: 'BPBD Kalimantan Tengah / Manggala Agni',
      created_at: '2026-10-10T23:45:00Z',
    },
    hotspots: kalimantanHotspots,
    currentPerimeter: {
      type: 'Feature',
      properties: {
        id: 'perim-kal-current',
        incident_id: 'LIVE-ID',
        type: 'estimated_perimeter',
        label: 'Estimated outline (not mapped)',
        status: 'Active Fire Cluster',
        area_hectares: 24500,
        updated_at: '2026-10-10T23:45:00Z',
        is_simulated: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [kalimantanHullCoords],
      },
    },
    forecast6h: {
      id: 'fc-kal-6h',
      incident_id: 'LIVE-ID',
      forecast_horizon_hours: 6,
      risk_level: 'Moderate',
      forecast_geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 'poly-kal-6h',
              risk_level: 'Moderate',
              horizon_hours: 6,
              label: 'Projected risk zone (demo model)',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [kalimantan6hCoords],
            },
          },
        ],
      },
      model_type: 'demo-wind-ellipse-v1',
      assumptions: 'Spread direction follows surface wind S (168°). Ignores terrain and peat smoldering dynamics.',
      spread_rate_kmh: 0.45,
      projected_area_ha: 31200,
      spread_direction_deg: 348,
      is_simulated: true,
      created_at: new Date().toISOString(),
    },
    forecast12h: {
      id: 'fc-kal-12h',
      incident_id: 'LIVE-ID',
      forecast_horizon_hours: 12,
      risk_level: 'Moderate',
      forecast_geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 'poly-kal-12h',
              risk_level: 'Moderate',
              horizon_hours: 12,
              label: 'Projected risk zone (demo model)',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [kalimantan12hCoords],
            },
          },
        ],
      },
      model_type: 'demo-wind-ellipse-v1',
      assumptions: '12-hour downwind buffer envelope. Ignores terrain, fuel moisture, suppression.',
      spread_rate_kmh: 0.52,
      projected_area_ha: 38900,
      spread_direction_deg: 348,
      is_simulated: true,
      created_at: new Date().toISOString(),
    },
    weather: {
      current: {
        temperature_c: 32.3,
        relative_humidity: 50,
        wind_speed_kmh: 10.3,
        wind_direction_deg: 168, // S (168°)
        wind_gusts_kmh: 16.5,
        dew_point_c: 21.0,
        surface_pressure_hpa: 1009,
        forecast_time: '2026-10-11T15:28:00Z',
        source: 'Open-Meteo Forecast API',
        is_simulated: false,
      },
      hourly: [
        { time: '02 PM', temperature_c: 32.3, relative_humidity: 50, wind_speed_kmh: 10.3, wind_direction_deg: 168 },
        { time: '06 PM', temperature_c: 29.0, relative_humidity: 72, wind_speed_kmh: 8.5, wind_direction_deg: 165 },
        { time: '10 PM', temperature_c: 26.5, relative_humidity: 84, wind_speed_kmh: 6.8, wind_direction_deg: 160 },
        { time: '02 AM', temperature_c: 24.5, relative_humidity: 90, wind_speed_kmh: 5.2, wind_direction_deg: 155 },
        { time: '06 AM', temperature_c: 24.0, relative_humidity: 88, wind_speed_kmh: 6.0, wind_direction_deg: 160 },
        { time: '10 AM', temperature_c: 28.5, relative_humidity: 60, wind_speed_kmh: 8.9, wind_direction_deg: 165 },
        { time: '02 PM', temperature_c: 32.0, relative_humidity: 48, wind_speed_kmh: 10.5, wind_direction_deg: 170 },
      ],
      last_updated: '2026-10-11T15:28:00Z',
      is_live: true,
      source_name: 'Open-Meteo Forecast API',
    },
    alerts: [
      {
        id: 'alt-kal-01',
        incident_id: 'LIVE-ID',
        title: 'Downwind settlements',
        description: 'Projected risk zone extends toward populated edge under forecast winds.',
        severity: 'Moderate',
        source: 'FireCast sample dataset (simulated)',
        is_simulated: true,
        suggested_precautions: [
          'Pre-position resources; brief crews on downwind access routes.'
        ],
        created_at: new Date().toISOString(),
      },
    ],
  },

  'CA-SNF-001942': {
    incident: {
      id: 'CA-SNF-001942',
      incident_code: 'CA-SNF-001942',
      name: 'CA-SNF-001942 — Creek Fire Complex, California',
      hazard_type: 'wildfire',
      latitude: 37.195,
      longitude: -119.262,
      status: 'Active',
      data_mode: 'SAMPLE',
      location_name: 'Sierra National Forest, Fresno County, CA',
      acres_burned: 42350,
      containment_pct: 18,
      fuel_type: 'Timber & Heavy Slash',
      jurisdiction: 'CAL FIRE / USFS',
      created_at: '2026-10-10T23:45:00Z',
    },
    hotspots: kalimantanHotspots.map((h, i) => ({
      ...h,
      id: `hs-cr-${i}`,
      latitude: 37.195 + (h.latitude - (-2.5)),
      longitude: -119.262 + (h.longitude - 114.0),
    })),
    currentPerimeter: {
      type: 'Feature',
      properties: {
        id: 'perim-cr-current',
        incident_id: 'CA-SNF-001942',
        type: 'estimated_perimeter',
        label: 'Estimated outline (not mapped)',
        status: 'Active Fire Cluster',
        area_hectares: 17140,
        updated_at: new Date().toISOString(),
        is_simulated: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          kalimantanHullCoords.map((pt) => [
            -119.262 + (pt[0] - 114.0),
            37.195 + (pt[1] - (-2.5)),
          ]),
        ],
      },
    },
    forecast6h: {
      id: 'fc-cr-6h',
      incident_id: 'CA-SNF-001942',
      forecast_horizon_hours: 6,
      risk_level: 'Critical',
      forecast_geojson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { id: 'poly-cr-6h', label: 'Projected risk zone (demo model)' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              kalimantan6hCoords.map((pt) => [
                -119.262 + (pt[0] - 114.0),
                37.195 + (pt[1] - (-2.5)),
              ]),
            ],
          },
        }],
      },
      model_type: 'demo-wind-ellipse-v1',
      assumptions: 'Assumes SW winds driving rapid front advancement along canyon slope.',
      spread_rate_kmh: 0.75,
      projected_area_ha: 26300,
      spread_direction_deg: 40,
      is_simulated: true,
      created_at: new Date().toISOString(),
    },
    forecast12h: {
      id: 'fc-cr-12h',
      incident_id: 'CA-SNF-001942',
      forecast_horizon_hours: 12,
      risk_level: 'Extreme',
      forecast_geojson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { id: 'poly-cr-12h', label: 'Projected risk zone (demo model)' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              kalimantan12hCoords.map((pt) => [
                -119.262 + (pt[0] - 114.0),
                37.195 + (pt[1] - (-2.5)),
              ]),
            ],
          },
        }],
      },
      model_type: 'demo-wind-ellipse-v1',
      assumptions: 'Assumes diurnal acceleration and thermal spotting up to 1.8 km.',
      spread_rate_kmh: 0.88,
      projected_area_ha: 38900,
      spread_direction_deg: 35,
      is_simulated: true,
      created_at: new Date().toISOString(),
    },
    weather: {
      current: {
        temperature_c: 34.8,
        relative_humidity: 14,
        wind_speed_kmh: 28.0,
        wind_direction_deg: 220,
        wind_gusts_kmh: 44.0,
        forecast_time: new Date().toISOString(),
        source: 'Open-Meteo Forecast API',
        is_simulated: false,
      },
      hourly: [
        { time: '02 PM', temperature_c: 34.8, relative_humidity: 14, wind_speed_kmh: 28.0, wind_direction_deg: 220 },
        { time: '06 PM', temperature_c: 32.5, relative_humidity: 16, wind_speed_kmh: 24.0, wind_direction_deg: 220 },
        { time: '10 PM', temperature_c: 28.0, relative_humidity: 22, wind_speed_kmh: 18.0, wind_direction_deg: 215 },
        { time: '02 AM', temperature_c: 24.0, relative_humidity: 30, wind_speed_kmh: 14.0, wind_direction_deg: 210 },
        { time: '06 AM', temperature_c: 22.0, relative_humidity: 35, wind_speed_kmh: 12.0, wind_direction_deg: 205 },
        { time: '10 AM', temperature_c: 29.0, relative_humidity: 20, wind_speed_kmh: 20.0, wind_direction_deg: 215 },
        { time: '02 PM', temperature_c: 35.0, relative_humidity: 13, wind_speed_kmh: 30.0, wind_direction_deg: 225 },
      ],
      last_updated: new Date().toISOString(),
      is_live: true,
      source_name: 'Open-Meteo Forecast API',
    },
    alerts: [
      {
        id: 'alt-cr-01',
        incident_id: 'CA-SNF-001942',
        title: 'Downwind settlements',
        description: 'Sustained winds pushing active flank towards canyon settlements.',
        severity: 'Critical',
        source: 'FireCast sample dataset (simulated)',
        is_simulated: true,
        suggested_precautions: ['Pre-position resources; brief crews on downwind access routes.'],
        created_at: new Date().toISOString(),
      },
    ],
  },
};
