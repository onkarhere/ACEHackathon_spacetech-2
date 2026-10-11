import React from 'react';
import { DataMode } from '../types/incident';
import { Radio, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface DataStatusProps {
  status: DataMode;
  lastUpdated: string;
  sourceLabel?: string;
  isLiveWeather?: boolean;
}

export const DataStatusBadge: React.FC<DataStatusProps> = ({
  status,
  lastUpdated,
  sourceLabel,
  isLiveWeather,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: Radio,
          label: 'LIVE SENSOR FEED',
        };
      case 'SAMPLE':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          icon: CheckCircle2,
          label: 'DEMO / SAMPLE DATA',
        };
      case 'STALE':
        return {
          bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
          dot: 'bg-yellow-400',
          icon: AlertTriangle,
          label: 'STALE DATA',
        };
      case 'ERROR':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          icon: AlertCircle,
          label: 'FEED ERROR',
        };
      case 'LOADING':
        return {
          bg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
          dot: 'bg-sky-400',
          icon: RefreshCw,
          label: 'SYNCHRONIZING...',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary Status Pill */}
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} tracking-wide`}
        title={`Status: ${config.label}. Last synced: ${new Date(lastUpdated).toLocaleTimeString()}`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'LIVE' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
        <Icon className={`w-3.5 h-3.5 ${status === 'LOADING' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </div>

      {/* Weather Live Pill */}
      {isLiveWeather && (
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Open-Meteo Live</span>
        </div>
      )}

      {/* Supabase status indicator */}
      <div
        className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700"
        title={isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Supabase credentials not detected; local resilient prototype engine active.'}
      >
        <Database className={`w-3 h-3 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Supabase: Ready (Demo Engine)'}</span>
      </div>

      {sourceLabel && (
        <span className="text-[11px] text-slate-400 hidden xl:inline">
          {sourceLabel}
        </span>
      )}
    </div>
  );
};
