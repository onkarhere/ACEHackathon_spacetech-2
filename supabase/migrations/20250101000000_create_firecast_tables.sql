-- =========================================================================
-- FireCast AI — Database Schema Migration
-- Near-Real-Time Disaster Perimeter & Spread Forecasting
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    hazard_type TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    data_mode TEXT NOT NULL DEFAULT 'SAMPLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FIRE OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.fire_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    brightness NUMERIC NULL,
    observed_at TIMESTAMPTZ NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'NASA FIRMS VIIRS',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WEATHER OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    temperature_c NUMERIC NULL,
    relative_humidity NUMERIC NULL,
    wind_speed NUMERIC NULL,
    wind_direction NUMERIC NULL,
    forecast_time TIMESTAMPTZ NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'Open-Meteo',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FORECAST RUNS TABLE
CREATE TABLE IF NOT EXISTS public.forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    forecast_horizon_hours INTEGER NOT NULL CHECK (forecast_horizon_hours IN (6, 12)),
    risk_level TEXT NOT NULL DEFAULT 'High',
    forecast_geojson JSONB NULL,
    model_type TEXT NOT NULL DEFAULT 'Empirical Wind-Terrain Vector Spread (Demonstration Prototype)',
    assumptions TEXT NULL,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'High',
    source TEXT NOT NULL DEFAULT 'FireCast Risk Pipeline',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_fire_observations_incident ON public.fire_observations(incident_id);
CREATE INDEX IF NOT EXISTS idx_weather_observations_incident ON public.weather_observations(incident_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_incident ON public.forecast_runs(incident_id);
CREATE INDEX IF NOT EXISTS idx_alerts_incident ON public.alerts(incident_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- POLICIES: Public Demo Read Access
CREATE POLICY "Allow public read access to incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public read access to fire_observations" ON public.fire_observations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to weather_observations" ON public.weather_observations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to forecast_runs" ON public.forecast_runs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to alerts" ON public.alerts FOR SELECT USING (true);

-- Restrict write/update/delete to service role only
CREATE POLICY "Service role insert incidents" ON public.incidents FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert fire_observations" ON public.fire_observations FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert weather_observations" ON public.weather_observations FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert forecast_runs" ON public.forecast_runs FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert alerts" ON public.alerts FOR INSERT WITH CHECK (auth.role() = 'service_role');
