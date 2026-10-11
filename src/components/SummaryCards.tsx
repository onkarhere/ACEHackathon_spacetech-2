import React from 'react';
import { Incident } from '../types/incident';
import { WeatherData } from '../types/weather';
import { Flame, AlertCircle, Thermometer, Droplets, Wind } from 'lucide-react';

interface SummaryCardsProps {
  incident: Incident;
  hotspotCount: number;
  weather: WeatherData;
  isLive: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  incident,
  hotspotCount,
  weather,
  isLive,
}) => {
  const { current } = weather;

  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  };

  const windDirCardinal = getCardinal(current.wind_direction_deg);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      
      {/* 1. HOTSPOTS */}
      <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="tracking-wider uppercase text-[11px]">HOTSPOTS</span>
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {hotspotCount}
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {isLive ? 'LIVE' : 'SAMPLE'}
        </div>
      </div>

      {/* 2. STATUS */}
      <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="tracking-wider uppercase text-[11px]">STATUS</span>
          <AlertCircle className="w-4 h-4 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {incident.status || 'Monitoring'}
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {incident.incident_code || 'LIVE-ID'}
        </div>
      </div>

      {/* 3. TEMPERATURE */}
      <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="tracking-wider uppercase text-[11px]">TEMPERATURE</span>
          <Thermometer className="w-4 h-4 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {Math.round(current.temperature_c)}°C
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {isLive ? 'LIVE' : 'SAMPLE'}
        </div>
      </div>

      {/* 4. HUMIDITY */}
      <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="tracking-wider uppercase text-[11px]">HUMIDITY</span>
          <Droplets className="w-4 h-4 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {Math.round(current.relative_humidity)}%
          </div>
        </div>
        <div className="text-[11px] font-normal text-slate-400 lowercase">
          relative
        </div>
      </div>

      {/* 5. WIND */}
      <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="tracking-wider uppercase text-[11px]">WIND</span>
          <Wind className="w-4 h-4 text-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {Math.round(current.wind_speed_kmh)} km/h
          </div>
        </div>
        <div className="text-[11px] font-normal text-slate-400">
          from {windDirCardinal} ({current.wind_direction_deg}°)
        </div>
      </div>

    </div>
  );
};
