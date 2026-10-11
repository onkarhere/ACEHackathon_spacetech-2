import React, { useState, useEffect, useCallback } from 'react';
import { DEMO_INCIDENTS, IncidentBundle } from '../data/demoData';
import { Incident, FireObservation, AlertItem } from '../types/incident';
import { WeatherData } from '../types/weather';
import { ForecastHorizon, ForecastRun, PerimeterFeature } from '../types/forecast';
import { fetchWeatherForLocation } from '../services/weatherApi';
import { fetchFireObservations } from '../services/fireApi';
import { generateForecastRun } from '../services/forecastApi';
import { supabase, isSupabaseConfigured } from '../services/supabase';

import { Header } from '../components/Header';
import { SummaryCards } from '../components/SummaryCards';
import { MapView } from '../components/MapView';
import { ForecastControls } from '../components/ForecastControls';
import { IncidentPanel } from '../components/IncidentPanel';
import { WeatherPanel } from '../components/WeatherPanel';
import { AlertsPanel } from '../components/AlertsPanel';
import { ModelAssumptions } from '../components/ModelAssumptions';

export const Dashboard: React.FC = () => {
  const allIncidents = Object.values(DEMO_INCIDENTS).map((b) => b.incident);

  // Default to Central Kalimantan, Indonesia matching screenshot
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('LIVE-ID');
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>(0);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Oct 11, 03:28 PM');
  const [showLovableBadge, setShowLovableBadge] = useState<boolean>(true);

  // Active dataset
  const currentBundle: IncidentBundle = DEMO_INCIDENTS[selectedIncidentId] || DEMO_INCIDENTS['LIVE-ID'];
  const [incident, setIncident] = useState<Incident>(currentBundle.incident);
  const [hotspots, setHotspots] = useState<FireObservation[]>(currentBundle.hotspots);
  const [currentPerimeter, setCurrentPerimeter] = useState<PerimeterFeature>(currentBundle.currentPerimeter);
  const [weather, setWeather] = useState<WeatherData>(currentBundle.weather);
  const [alerts, setAlerts] = useState<AlertItem[]>(currentBundle.alerts);
  const [forecastRun, setForecastRun] = useState<ForecastRun>(currentBundle.forecast6h);
  const [hotspotDisplayCount, setHotspotDisplayCount] = useState<number>(500);

  // Load / Refresh incident data
  const loadIncidentData = useCallback(
    async (incId: string, forceLive: boolean = true) => {
      const bundle = DEMO_INCIDENTS[incId] || DEMO_INCIDENTS['LIVE-ID'];
      setIsRefreshing(true);

      setIncident(bundle.incident);
      setCurrentPerimeter(bundle.currentPerimeter);
      setAlerts(bundle.alerts);

      try {
        // Query Supabase tables if configured
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: dbIncidents } = await supabase.from('incidents').select('*');
            if (dbIncidents && dbIncidents.length > 0) {
              const matched = dbIncidents.find(
                (i: any) => i.id === incId || i.incident_code === bundle.incident.incident_code
              );
              if (matched) {
                setIncident((prev) => ({ ...prev, ...matched }));
              }
            }
          } catch {
            // Continue cleanly
          }
        }

        // Fetch Weather
        const weatherRes = await fetchWeatherForLocation(
          incId,
          bundle.incident.latitude,
          bundle.incident.longitude
        );
        setWeather(weatherRes.data);

        // Fetch Fire Observations via server proxy
        if (forceLive) {
          const fireRes = await fetchFireObservations(
            incId,
            bundle.incident.latitude,
            bundle.incident.longitude
          );
          if (fireRes.observations.length > 0) {
            setHotspots(fireRes.observations);
            setHotspotDisplayCount(Math.max(500, fireRes.observations.length));
          } else {
            setHotspots(bundle.hotspots);
            setHotspotDisplayCount(500);
          }
        } else {
          setHotspots(bundle.hotspots);
          setHotspotDisplayCount(500);
        }

        // Forecast
        const horizonToUse = selectedHorizon === 0 ? 6 : selectedHorizon;
        const forecast = await generateForecastRun(incId, horizonToUse, {
          latitude: bundle.incident.latitude,
          longitude: bundle.incident.longitude,
          windSpeedKmh: weatherRes.data.current.wind_speed_kmh,
          windDirectionDeg: weatherRes.data.current.wind_direction_deg,
        });
        setForecastRun(forecast);

        // Format timestamp matching screenshot
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setLastUpdatedText(`${dateStr}, ${timeStr}`);
      } catch {
        // Fallback to static sample bundle
        setHotspots(bundle.hotspots);
        setWeather(bundle.weather);
        setForecastRun(selectedHorizon === 12 ? bundle.forecast12h : bundle.forecast6h);
        setHotspotDisplayCount(500);
      } finally {
        setIsRefreshing(false);
      }
    },
    [selectedHorizon]
  );

  // Switch Incident
  const handleSelectIncident = (incId: string) => {
    setSelectedIncidentId(incId);
    setSelectedHorizon(0);
    loadIncidentData(incId, isLiveMode);
  };

  // Switch Horizon
  const handleChangeHorizon = async (h: ForecastHorizon) => {
    setSelectedHorizon(h);
    if (h === 0) return;

    try {
      const forecast = await generateForecastRun(selectedIncidentId, h, {
        latitude: incident.latitude,
        longitude: incident.longitude,
        windSpeedKmh: weather.current.wind_speed_kmh,
        windDirectionDeg: weather.current.wind_direction_deg,
      });
      setForecastRun(forecast);
    } catch {
      const bundle = DEMO_INCIDENTS[selectedIncidentId] || DEMO_INCIDENTS['LIVE-ID'];
      setForecastRun(h === 12 ? bundle.forecast12h : bundle.forecast6h);
    }
  };

  // Initial load
  useEffect(() => {
    loadIncidentData('LIVE-ID', true);
  }, []);

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      
      {/* 1. Header */}
      <Header
        currentIncident={incident}
        allIncidents={allIncidents}
        onSelectIncident={handleSelectIncident}
        isLiveMode={isLiveMode}
        onFetchLive={() => {
          setIsLiveMode(true);
          loadIncidentData(selectedIncidentId, true);
        }}
        onUseSample={() => {
          setIsLiveMode(false);
          loadIncidentData(selectedIncidentId, false);
        }}
        isRefreshing={isRefreshing}
        lastUpdatedTimeText={lastUpdatedText}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 lg:px-6 py-4 space-y-3.5">
        
        {/* 2. Top Summary Cards (5 columns) */}
        <SummaryCards
          incident={incident}
          hotspotCount={hotspotDisplayCount}
          weather={weather}
          isLive={isLiveMode}
        />

        {/* 3. Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          
          {/* Left Column (~68% width) */}
          <div className="lg:col-span-8 space-y-3.5">
            
            {/* Interactive Leaflet Map */}
            <MapView
              incident={incident}
              hotspots={hotspots}
              currentPerimeter={currentPerimeter}
              forecastRun={forecastRun}
              horizon={selectedHorizon}
              windSpeedKmh={weather.current.wind_speed_kmh}
              windDirectionDeg={weather.current.wind_direction_deg}
            />

            {/* Forecast Timeline Bar */}
            <ForecastControls
              selectedHorizon={selectedHorizon}
              onChangeHorizon={handleChangeHorizon}
              validTimeText={lastUpdatedText}
            />

            {/* Alerts Box */}
            <AlertsPanel alerts={alerts} isLive={isLiveMode} />

            {/* Model Assumptions Box */}
            <ModelAssumptions />

          </div>

          {/* Right Column (~32% width) */}
          <div className="lg:col-span-4 space-y-3.5">
            
            {/* Incident Details Card */}
            <IncidentPanel
              incident={incident}
              latestObsText="Oct 10, 11:45 PM"
              freshnessText="16 h ago"
            />

            {/* Weather Card with 24h Trend Chart */}
            <WeatherPanel
              weather={weather}
              updatedTimeText={lastUpdatedText}
            />

          </div>

        </div>

      </main>

      {/* Lovable watermark badge in bottom-right corner matching screenshot */}
      {showLovableBadge && (
        <div className="fixed bottom-3 right-3 z-50 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#111622] text-white border border-[#242F44] shadow-2xl hover:border-slate-500 transition">
            <span>Edit with</span>
            <span className="font-bold text-rose-500">Lovable</span>
            <button
              onClick={() => setShowLovableBadge(false)}
              className="text-slate-400 hover:text-white ml-1 text-xs cursor-pointer font-bold"
              title="Close badge"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
