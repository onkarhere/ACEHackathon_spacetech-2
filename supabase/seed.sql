-- Seed data for FireCast AI Demonstration

INSERT INTO public.incidents (id, incident_code, name, hazard_type, latitude, longitude, status, data_mode)
VALUES 
('a0000001-0000-0000-0000-000000000001', 'CA-SNF-001942', 'Creek Fire Complex', 'Timber & Heavy Slash Wildfire', 37.195, -119.262, 'Active', 'SAMPLE'),
('a0000002-0000-0000-0000-000000000002', 'NM-SNF-000288', 'Hermits Peak Fire', 'Ponderosa Pine & High-Elevation Mixed Conifer', 35.733, -105.421, 'Active', 'SAMPLE'),
('a0000003-0000-0000-0000-000000000003', 'BCWS-K52767', 'McDougall Creek Wildfire', 'Mountain Conifer & Steep Valley Slope', 49.983, -119.575, 'Active', 'SAMPLE')
ON CONFLICT (incident_code) DO NOTHING;

INSERT INTO public.fire_observations (incident_id, latitude, longitude, brightness, observed_at, source, is_simulated)
VALUES
('a0000001-0000-0000-0000-000000000001', 37.207, -119.270, 367.4, NOW() - INTERVAL '25 minutes', 'VIIRS NOAA-20 (375m I-Band)', true),
('a0000001-0000-0000-0000-000000000001', 37.214, -119.258, 382.1, NOW() - INTERVAL '25 minutes', 'VIIRS NOAA-20 (375m I-Band)', true),
('a0000001-0000-0000-0000-000000000001', 37.222, -119.248, 351.0, NOW() - INTERVAL '48 minutes', 'VIIRS Suomi-NPP (375m)', true),
('a0000001-0000-0000-0000-000000000001', 37.190, -119.278, 334.8, NOW() - INTERVAL '50 minutes', 'VIIRS Suomi-NPP (375m)', true);

INSERT INTO public.weather_observations (incident_id, temperature_c, relative_humidity, wind_speed, wind_direction, forecast_time, source, is_simulated)
VALUES
('a0000001-0000-0000-0000-000000000001', 34.8, 13.5, 28.4, 220, NOW(), 'Open-Meteo High-Resolution Forecast Engine', true);

INSERT INTO public.alerts (incident_id, title, description, severity, source, is_simulated)
VALUES
('a0000001-0000-0000-0000-000000000001', 'Rapid Rate of Spread Warning — NE Flank', 'Sustained SW winds exceeding 28 km/h coupled with critically low relative humidity (13%) are driving rapid crown fire propagation along the San Joaquin river canyon.', 'Extreme', 'FireCast Automated Meteorological Risk Pipeline', true),
('a0000001-0000-0000-0000-000000000001', 'High Ember Lofting Threat', 'Atmospheric instability Haines Index 6 indicates intense pyrocumulus column collapse risk and spotting potential up to 2.0 km ahead of active flaming front.', 'Critical', 'FireCast Spotting Detection Model', true);
