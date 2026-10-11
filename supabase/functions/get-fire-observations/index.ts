// Supabase Edge Function: get-fire-observations
// NASA FIRMS Satellite Fire & Thermal Anomaly Ingestion

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
    const { latitude, longitude, radiusKm = 25 } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(
        JSON.stringify({ error: "Valid latitude and longitude are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firmsKey = Deno.env.get("FIRMS_MAP_KEY");

    // If FIRMS key is configured, call NASA FIRMS API
    if (firmsKey && firmsKey.trim() !== "") {
      const deltaDeg = (radiusKm || 25) / 111.0;
      const minLon = (longitude - deltaDeg).toFixed(3);
      const minLat = (latitude - deltaDeg).toFixed(3);
      const maxLon = (longitude + deltaDeg).toFixed(3);
      const maxLat = (latitude + deltaDeg).toFixed(3);

      const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_SNPP_NRT/${minLon},${minLat},${maxLon},${maxLat}/1`;

      const firmsRes = await fetch(firmsUrl);
      if (firmsRes.ok) {
        const csvText = await firmsRes.text();
        const lines = csvText.trim().split("\n");
        const headers = lines[0].split(",");

        const latIdx = headers.indexOf("latitude");
        const lonIdx = headers.indexOf("longitude");
        const brightIdx = headers.indexOf("bright_ti4");
        const frpIdx = headers.indexOf("frp");
        const timeIdx = headers.indexOf("acq_time");
        const dateIdx = headers.indexOf("acq_date");
        const confIdx = headers.indexOf("confidence");

        const observations = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length > latIdx && cols[latIdx]) {
            observations.push({
              latitude: parseFloat(cols[latIdx]),
              longitude: parseFloat(cols[lonIdx]),
              brightness: brightIdx >= 0 ? parseFloat(cols[brightIdx]) : 330,
              frp: frpIdx >= 0 ? parseFloat(cols[frpIdx]) : 40,
              confidence: confIdx >= 0 ? cols[confIdx] : "nominal",
              observed_at: `${cols[dateIdx]}T${cols[timeIdx]}:00Z`,
              source: "NASA FIRMS VIIRS (S-NPP)",
              is_simulated: false,
            });
          }
        }

        return new Response(
          JSON.stringify({
            observations,
            source: "NASA FIRMS Live Feed",
            count: observations.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: If no key or service unavailable, return structured sample thermal detections
    return new Response(
      JSON.stringify({
        observations: [
          {
            latitude: latitude + 0.015,
            longitude: longitude - 0.012,
            brightness: 368.5,
            frp: 185.0,
            confidence: "high",
            observed_at: new Date().toISOString(),
            source: "NASA FIRMS Simulated VIIRS NOAA-20",
            is_simulated: true,
          },
          {
            latitude: latitude + 0.022,
            longitude: longitude + 0.006,
            brightness: 382.4,
            frp: 242.0,
            confidence: "high",
            observed_at: new Date().toISOString(),
            source: "NASA FIRMS Simulated VIIRS NOAA-20",
            is_simulated: true,
          },
        ],
        source: "NASA FIRMS Demonstration Mode (FIRMS_MAP_KEY secret not set)",
        count: 2,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
