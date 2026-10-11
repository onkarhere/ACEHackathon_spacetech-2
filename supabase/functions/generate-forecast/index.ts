// Supabase Edge Function: generate-forecast
// Near-Real-Time Disaster Perimeter & Spread Forecasting (Demonstration Model)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEllipseGeoJson(
  centerLat: number,
  centerLon: number,
  baseRadiusKm: number,
  spreadKm: number,
  windDirectionDeg: number,
  numPoints: number = 28
) {
  const spreadBearingDeg = (windDirectionDeg + 180) % 360;
  const spreadRad = (spreadBearingDeg * Math.PI) / 180;
  const shiftKm = spreadKm * 0.45;
  const latOffsetShift = (shiftKm * Math.cos(spreadRad)) / 111.0;
  const lonOffsetShift = (shiftKm * Math.sin(spreadRad)) / (111.0 * Math.cos((centerLat * Math.PI) / 180));

  const shiftedLat = centerLat + latOffsetShift;
  const shiftedLon = centerLon + lonOffsetShift;
  const coords: number[][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const rel = angle - spreadRad;
    const a = baseRadiusKm + spreadKm;
    const b = baseRadiusKm + spreadKm * 0.45;
    const r = (a * b) / Math.sqrt(Math.pow(b * Math.cos(rel), 2) + Math.pow(a * Math.sin(rel), 2));
    const dLat = (r * Math.cos(angle)) / 111.0;
    const dLon = (r * Math.sin(angle)) / (111.0 * Math.cos((shiftedLat * Math.PI) / 180));
    coords.push([shiftedLon + dLon, shiftedLat + dLat]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          spread_bearing_deg: spreadBearingDeg,
          spread_km: spreadKm,
        },
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    ],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { incidentId, horizonHours = 6, options = {} } = await req.json();

    if (horizonHours !== 6 && horizonHours !== 12) {
      return new Response(
        JSON.stringify({ error: "Only 6-hour and 12-hour forecast horizons are supported." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseLat = options.latitude ?? 37.195;
    const baseLon = options.longitude ?? -119.262;
    const windSpeed = options.windSpeedKmh ?? 28;
    const windDir = options.windDirectionDeg ?? 220;

    const baseRateKmH = 0.35 + (windSpeed / 100) * 0.9;
    const spreadKm = baseRateKmH * (horizonHours === 6 ? 4.5 : 8.5);

    const geojson = buildEllipseGeoJson(baseLat, baseLon, 3.2, spreadKm, windDir);

    const downwind = (windDir + 180) % 360;
    const riskLevel = horizonHours === 6 ? "Critical" : "Extreme";

    const responsePayload = {
      id: `fc-run-${incidentId}-${horizonHours}h-${Date.now()}`,
      incident_id: incidentId,
      forecast_horizon_hours: horizonHours,
      risk_level: riskLevel,
      forecast_geojson: geojson,
      model_type: "Empirical Wind-Terrain Vector Spread (Demonstration Prototype)",
      assumptions: `Assumes sustained wind ${windSpeed} km/h from ${windDir}° advancing toward ${Math.round(downwind)}°. Demonstration model only; unvalidated for official life-safety directives.`,
      spread_rate_kmh: Math.round(baseRateKmH * 100) / 100,
      projected_area_ha: horizonHours === 6 ? 26000 : 41000,
      spread_direction_deg: Math.round(downwind),
      is_simulated: true,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
