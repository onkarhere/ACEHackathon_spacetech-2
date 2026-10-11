import { WeatherData, HourlyForecastPoint } from '../types/weather';
import { supabase, isSupabaseConfigured } from './supabase';
import { DEMO_INCIDENTS } from '../data/demoData';

export async function fetchWeatherForLocation(
  incidentId: string,
  latitude: number,
  longitude: number
): Promise<{ data: WeatherData; status: 'LIVE' | 'SAMPLE' | 'STALE' | 'ERROR' }> {
  // 1. Try Supabase Edge Function if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude, incidentId },
      });
      if (!error && data?.current) {
        return {
          data: {
            current: {
              ...data.current,
              is_simulated: false,
            },
            hourly: data.hourly || [],
            last_updated: new Date().toISOString(),
            is_live: true,
            source_name: 'Open-Meteo (via Supabase Edge Function)',
          },
          status: 'LIVE',
        };
      }
    } catch {
      // Gracefully continue to direct Open-Meteo fallback
    }
  }

  // 2. Direct Open-Meteo API call (public high-resolution meteorological data)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability&forecast_days=2`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) {
      throw new Error(`Open-Meteo response status ${response.status}`);
    }

    const json = await response.json();
    const current = json.current;
    const hourly = json.hourly;

    const hourlyPoints: HourlyForecastPoint[] = [];
    if (hourly && hourly.time) {
      // Grab next 12 hours
      const now = new Date();
      const startIndex = hourly.time.findIndex((t: string) => new Date(t) >= now) || 0;
      const validStart = startIndex >= 0 ? startIndex : 0;
      
      for (let i = validStart; i < Math.min(validStart + 12, hourly.time.length); i++) {
        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const formattedHour = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        hourlyPoints.push({
          time: formattedHour,
          temperature_c: Math.round((hourly.temperature_2m?.[i] ?? 0) * 10) / 10,
          relative_humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
          wind_speed_kmh: Math.round((hourly.wind_speed_10m?.[i] ?? 0) * 10) / 10,
          wind_direction_deg: Math.round(hourly.wind_direction_10m?.[i] ?? 0),
          precipitation_probability_pct: hourly.precipitation_probability?.[i] ?? 0,
        });
      }
    }

    const weatherData: WeatherData = {
      current: {
        temperature_c: Math.round((current.temperature_2m ?? 25) * 10) / 10,
        relative_humidity: Math.round(current.relative_humidity_2m ?? 20),
        wind_speed_kmh: Math.round((current.wind_speed_10m ?? 15) * 10) / 10,
        wind_direction_deg: Math.round(current.wind_direction_10m ?? 0),
        wind_gusts_kmh: Math.round((current.wind_gusts_10m ?? 25) * 10) / 10,
        surface_pressure_hpa: Math.round(current.surface_pressure ?? 1013),
        forecast_time: current.time || new Date().toISOString(),
        source: 'Open-Meteo Live High-Resolution API',
        is_simulated: false,
      },
      hourly: hourlyPoints.length > 0 ? hourlyPoints : DEMO_INCIDENTS[incidentId]?.weather.hourly || [],
      last_updated: new Date().toISOString(),
      is_live: true,
      source_name: 'Open-Meteo Direct Live Connection',
    };

    return { data: weatherData, status: 'LIVE' };
  } catch {
    // 3. Fallback to sample data for this incident
    const fallback = DEMO_INCIDENTS[incidentId]?.weather || DEMO_INCIDENTS['inc-creek-fire'].weather;
    return {
      data: {
        ...fallback,
        is_live: false,
        source_name: 'Open-Meteo (Simulated Demo Fallback)',
      },
      status: 'SAMPLE',
    };
  }
}
