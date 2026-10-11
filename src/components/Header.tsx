import React from 'react';
import { Incident } from '../types/incident';
import { Flame, RefreshCw, Clock } from 'lucide-react';

interface HeaderProps {
  currentIncident: Incident;
  allIncidents: Incident[];
  onSelectIncident: (incidentId: string) => void;
  isLiveMode: boolean;
  onFetchLive: () => void;
  onUseSample: () => void;
  isRefreshing: boolean;
  lastUpdatedTimeText: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentIncident,
  allIncidents,
  onSelectIncident,
  isLiveMode,
  onFetchLive,
  onUseSample,
  isRefreshing,
  lastUpdatedTimeText,
}) => {
  return (
    <header className="border-b border-[#1A2234] bg-[#0A0E17] sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand Left */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
          </div>

          <div>
            <div className="text-base font-bold text-white tracking-tight leading-tight">
              FireCast AI
            </div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              PERIMETER & SPREAD DECISION SUPPORT
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Incident Selector */}
          <div className="relative">
            <select
              aria-label="Incident selector"
              value={currentIncident.id}
              onChange={(e) => onSelectIncident(e.target.value)}
              className="appearance-none bg-[#101624] text-slate-200 text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg border border-[#1F2B44] focus:outline-none focus:border-orange-500 cursor-pointer min-w-[280px] sm:min-w-[340px]"
            >
              {allIncidents.map((inc) => (
                <option key={inc.id} value={inc.id} className="bg-[#101624] text-slate-200">
                  {inc.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Badges: FIRE · LIVE & WX · LIVE */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A231C] text-[#2DD4BF] border border-[#134E3C] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>FIRE · LIVE</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A231C] text-[#2DD4BF] border border-[#134E3C] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>WX · LIVE</span>
          </div>

          {/* Timestamp */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-300 font-medium px-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{lastUpdatedTimeText}</span>
          </div>

          {/* Action Buttons: Fetch live & Use sample */}
          <button
            onClick={onFetchLive}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Fetch real-time NASA FIRMS satellite detections and Open-Meteo weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Fetch live</span>
          </button>

          <button
            onClick={onUseSample}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              !isLiveMode
                ? 'bg-[#1C263C] text-white border-slate-600'
                : 'bg-[#101624] text-slate-300 border-[#1F2B44] hover:bg-[#161F33]'
            }`}
            title="Switch to demonstration sample dataset"
          >
            Use sample
          </button>

        </div>

      </div>
    </header>
  );
};
