-- =========================================================================
-- FireCast AI — Complete Database Schema & Seed Data
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cfjzoidtfkvxukjyehyr/sql
-- =========================================================================

-- Enable UUID extension
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
    location_name TEXT NULL,
    acres_burned NUMERIC NULL DEFAULT 42000,
    containment_pct NUMERIC NULL DEFAULT 18,
    fuel_type TEXT NULL,
    jurisdiction TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FIRE OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.fire_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    brightness NUMERIC NULL,
    frp NUMERIC NULL DEFAULT 50,
    confidence TEXT NULL DEFAULT 'nominal',
    observed_at TIMESTAMPTZ NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'NASA FIRMS VIIRS (375m)',
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
    wind_gusts NUMERIC NULL,
    forecast_time TIMESTAMPTZ NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'Open-Meteo High-Resolution Engine',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FORECAST RUNS TABLE
CREATE TABLE IF NOT EXISTS public.forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    forecast_horizon_hours INTEGER NOT NULL CHECK (forecast_horizon_hours IN (6, 12)),
    risk_level TEXT NOT NULL DEFAULT 'Critical',
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
    severity TEXT NOT NULL DEFAULT 'Critical',
    source TEXT NOT NULL DEFAULT 'FireCast Tactical Risk Pipeline',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_fire_observations_incident ON public.fire_observations(incident_id);
CREATE INDEX IF NOT EXISTS idx_weather_observations_incident ON public.weather_observations(incident_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_incident ON public.forecast_runs(incident_id);
CREATE INDEX IF NOT EXISTS idx_alerts_incident ON public.alerts(incident_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: Public Read Access
DROP POLICY IF EXISTS "Allow public read access to incidents" ON public.incidents;
CREATE POLICY "Allow public read access to incidents" ON public.incidents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to fire_observations" ON public.fire_observations;
CREATE POLICY "Allow public read access to fire_observations" ON public.fire_observations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to weather_observations" ON public.weather_observations;
CREATE POLICY "Allow public read access to weather_observations" ON public.weather_observations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to forecast_runs" ON public.forecast_runs;
CREATE POLICY "Allow public read access to forecast_runs" ON public.forecast_runs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to alerts" ON public.alerts;
CREATE POLICY "Allow public read access to alerts" ON public.alerts FOR SELECT USING (true);

-- =========================================================================
-- SEED DATA (Realistic Incident Scenarios)
-- =========================================================================

-- Incident 1: Creek Fire Complex
INSERT INTO public.incidents (id, incident_code, name, hazard_type, latitude, longitude, status, data_mode, location_name, acres_burned, containment_pct, fuel_type, jurisdiction)
VALUES 
('a0000001-0000-0000-0000-000000000001', 'CA-SNF-001942', 'Creek Fire Complex', 'Timber & Heavy Slash Wildfire', 37.195, -119.262, 'Active', 'SAMPLE', 'Sierra National Forest, Fresno County, CA', 42350, 18, 'Timber, Chaparral, Dead beetle-kill pine', 'CAL FIRE / USFS Incident Management Team 1'),
('a0000002-0000-0000-0000-000000000002', 'NM-SNF-000288', 'Hermits Peak Fire', 'Ponderosa Pine & Mixed Conifer', 35.733, -105.421, 'Active', 'SAMPLE', 'Santa Fe National Forest, San Miguel County, NM', 312000, 35, 'Ponderosa Pine, Piñon-Juniper, Heavy Dead Downed', 'Southwest Incident Management Team 3'),
('a0000003-0000-0000-0000-000000000003', 'BCWS-K52767', 'McDougall Creek Wildfire', 'Mountain Conifer & Steep Valley', 49.983, -119.575, 'Active', 'SAMPLE', 'West Kelowna, Okanagan Valley, British Columbia, Canada', 34500, 22, 'Douglas-fir, Lodgepole pine, Ponderosa pine', 'BC Wildfire Service (BCWS) Incident Management')
ON CONFLICT (incident_code) DO NOTHING;

-- Creek Fire Hotspots
INSERT INTO public.fire_observations (incident_id, latitude, longitude, brightness, frp, confidence, observed_at, source, is_simulated)
VALUES
('a0000001-0000-0000-0000-000000000001', 37.207, -119.270, 367.4, 184.2, 'high', NOW() - INTERVAL '25 minutes', 'VIIRS NOAA-20 (375m I-Band)', true),
('a0000001-0000-0000-0000-000000000001', 37.214, -119.258, 382.1, 245.8, 'high', NOW() - INTERVAL '25 minutes', 'VIIRS NOAA-20 (375m I-Band)', true),
('a0000001-0000-0000-0000-000000000001', 37.222, -119.248, 351.0, 120.5, 'nominal', NOW() - INTERVAL '48 minutes', 'VIIRS Suomi-NPP (375m)', true),
('a0000001-0000-0000-0000-000000000001', 37.190, -119.278, 334.8, 68.2, 'nominal', NOW() - INTERVAL '50 minutes', 'VIIRS Suomi-NPP (375m)', true),
('a0000001-0000-0000-0000-000000000001', 37.230, -119.241, 389.6, 312.0, 'high', NOW() - INTERVAL '15 minutes', 'MODIS Aqua (1km Thermal)', true),
('a0000001-0000-0000-0000-000000000001', 37.203, -119.243, 342.3, 94.7, 'nominal', NOW() - INTERVAL '30 minutes', 'VIIRS NOAA-20 (375m I-Band)', true);

-- Creek Fire Alerts
INSERT INTO public.alerts (incident_id, title, description, severity, source, is_simulated)
VALUES
('a0000001-0000-0000-0000-000000000001', 'Rapid Rate of Spread Warning — NE Flank', 'Sustained SW winds exceeding 28 km/h coupled with critically low relative humidity (13%) are driving rapid crown fire propagation along the San Joaquin river canyon.', 'Extreme', 'FireCast Automated Meteorological Risk Pipeline', true),
('a0000001-0000-0000-0000-000000000001', 'High Ember Lofting & Long-Distance Spotting Threat', 'Atmospheric instability (Haines Index 6) indicates intense pyrocumulus column collapse risk and spotting potential up to 2.0 km ahead of active flaming front.', 'Critical', 'FireCast Spotting Detection Model', true);
