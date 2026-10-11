import React from 'react';
import { Incident } from '../types/incident';
import { MapPin } from 'lucide-react';

interface IncidentPanelProps {
  incident: Incident;
  latestObsText?: string;
  freshnessText?: string;
}

export const IncidentPanel: React.FC<IncidentPanelProps> = ({
  incident,
  latestObsText = 'Oct 10, 11:45 PM',
  freshnessText = '16 h ago',
}) => {
  return (
    <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3.5">
        <MapPin className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-white">Incident details</h3>
      </div>

      <div className="space-y-3 text-xs">
        {/* Row 1: Incident ID & Hazard */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              INCIDENT ID
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {incident.incident_code || 'LIVE-ID'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              HAZARD
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {incident.hazard_type || 'wildfire'}
            </div>
          </div>
        </div>

        {/* Row 2: Location */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            LOCATION
          </div>
          <div className="text-xs font-bold text-white mt-0.5 leading-snug">
            {incident.location_name || 'Central Kalimantan, Indonesia (live region)'}
          </div>
        </div>

        {/* Row 3: Coordinates & Latest Obs. */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              COORDINATES
            </div>
            <div className="text-xs font-bold text-white mt-0.5 font-mono">
              {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              LATEST OBS.
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {latestObsText}
            </div>
          </div>
        </div>

        {/* Row 4: Data Source */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            DATA SOURCE
          </div>
          <div className="text-xs font-bold text-white mt-0.5">
            NASA FIRMS VIIRS_SNPP_NRT (2 day(s), ±1°)
          </div>
        </div>

        {/* Row 5: Freshness & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              FRESHNESS
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {freshnessText}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              CONFIDENCE
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              Satellite pixel ±375 m
            </div>
          </div>
        </div>

        {/* Row 6: Perimeter */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            PERIMETER
          </div>
          <div className="text-xs font-bold text-white mt-0.5">
            Estimated from detections
          </div>
        </div>
      </div>
    </div>
  );
};
