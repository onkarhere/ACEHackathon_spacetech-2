import React from 'react';
import { ForecastHorizon } from '../types/forecast';

interface ForecastControlsProps {
  selectedHorizon: ForecastHorizon;
  onChangeHorizon: (horizon: ForecastHorizon) => void;
  validTimeText: string;
}

export const ForecastControls: React.FC<ForecastControlsProps> = ({
  selectedHorizon,
  onChangeHorizon,
  validTimeText,
}) => {
  return (
    <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      
      {/* Left Tabs */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          FORECAST TIMELINE
        </span>

        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={() => onChangeHorizon(0)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedHorizon === 0
                ? 'bg-[#EA580C] text-white shadow-sm'
                : 'bg-[#101624] text-slate-300 hover:bg-[#161F33] border border-[#1E283C]'
            }`}
          >
            Current
          </button>

          <button
            onClick={() => onChangeHorizon(6)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedHorizon === 6
                ? 'bg-[#EA580C] text-white shadow-sm'
                : 'bg-[#101624] text-slate-300 hover:bg-[#161F33] border border-[#1E283C]'
            }`}
          >
            +6 hours
          </button>

          <button
            onClick={() => onChangeHorizon(12)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedHorizon === 12
                ? 'bg-[#EA580C] text-white shadow-sm'
                : 'bg-[#101624] text-slate-300 hover:bg-[#161F33] border border-[#1E283C]'
            }`}
          >
            +12 hours
          </button>
        </div>
      </div>

      {/* Right: Valid time & FORECAST · LIVE badge */}
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-300">
          <span className="text-slate-400">Valid: </span>
          <strong className="text-white">{validTimeText}</strong>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0A231C] text-[#2DD4BF] border border-[#134E3C] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>FORECAST · LIVE</span>
        </div>
      </div>

    </div>
  );
};
