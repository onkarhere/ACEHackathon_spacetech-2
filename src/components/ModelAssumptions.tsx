import React from 'react';
import { Info } from 'lucide-react';

export const ModelAssumptions: React.FC = () => {
  return (
    <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-white">Model assumptions</h3>
      </div>

      <div className="font-mono text-xs text-amber-500 font-semibold mb-2.5">
        demo-wind-ellipse-v1 · demonstration only
      </div>

      <ul className="space-y-1.5 text-xs text-slate-300 leading-normal">
        <li className="flex items-start gap-1.5">
          <span className="text-slate-400">•</span>
          <span>Demonstration rule-based model — not validated for operational use.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="text-slate-400">•</span>
          <span>Ignores terrain, fuel type, fuel moisture, suppression and spotting.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="text-slate-400">•</span>
          <span>Spread direction assumed to follow forecast surface wind.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="text-slate-400">•</span>
          <span>Detections are satellite pixels (~375 m), not an exact fire edge.</span>
        </li>
      </ul>
    </div>
  );
};
