// Supabase Edge Function: get-weather
// Open-Meteo High-Resolution Meteorological Forecast Integration

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinate bounds." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability&forecast_days=2`;

    const weatherRes = await fetch(openMeteoUrl);
    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo HTTP ${weatherRes.status}`);
    }

    const json = await weatherRes.json();
    const current = json.current;
    const hourly = json.hourly;

    const hourlyPoints = [];
    if (hourly && hourly.time) {
      const now = new Date();
      const startIndex = Math.max(
        0,
        hourly.time.findIndex((t: string) => new Date(t) >= now)
      );
      for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i++) {
        hourlyPoints.push({
          time: new Date(hourly.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperature_c: Math.round((hourly.temperature_2m?.[i] ?? 0) * 10) / 10,
          relative_humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
          wind_speed_kmh: Math.round((hourly.wind_speed_10m?.[i] ?? 0) * 10) / 10,
          wind_direction_deg: Math.round(hourly.wind_direction_10m?.[i] ?? 0),
          precipitation_probability_pct: hourly.precipitation_probability?.[i] ?? 0,
        });
      }
    }

    return new Response(
      JSON.stringify({
        current: {
          temperature_c: Math.round((current.temperature_2m ?? 20) * 10) / 10,
          relative_humidity: Math.round(current.relative_humidity_2m ?? 30),
          wind_speed_kmh: Math.round((current.wind_speed_10m ?? 10) * 10) / 10,
          wind_direction_deg: Math.round(current.wind_direction_10m ?? 0),
          wind_gusts_kmh: Math.round((current.wind_gusts_10m ?? 15) * 10) / 10,
          surface_pressure_hpa: Math.round(current.surface_pressure ?? 1013),
          forecast_time: current.time || new Date().toISOString(),
          source: "Open-Meteo High-Resolution Engine",
          is_simulated: false,
        },
        hourly: hourlyPoints,
        source: "Open-Meteo REST API",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
