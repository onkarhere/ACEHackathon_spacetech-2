import React from 'react';
import { AlertItem } from '../types/incident';
import { AlertTriangle } from 'lucide-react';

interface AlertsPanelProps {
  alerts: AlertItem[];
  isLive: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, isLive }) => {
  const alert = alerts[0] || {
    title: 'Downwind settlements',
    severity: 'MODERATE',
    description: 'Projected risk zone extends toward populated edge under forecast winds.',
    suggested_precautions: ['Pre-position resources; brief crews on downwind access routes.'],
    source: isLive ? 'FireCast meteorological spread pipeline' : 'FireCast sample dataset (simulated)',
  };

  return (
    <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-white">Alerts</h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Informational decision support — not official evacuation orders.
      </p>

      {/* Inner Box */}
      <div className="bg-[#0A0F1A] border border-[#182236] rounded-lg p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {alert.title}
          </span>
          <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wide">
            {alert.severity}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-normal">
          {alert.description}
        </p>

        {alert.suggested_precautions && alert.suggested_precautions.length > 0 && (
          <p className="text-xs text-slate-300 leading-normal">
            <strong className="text-slate-200">Precautions: </strong>
            {alert.suggested_precautions.join(' ')}
          </p>
        )}

        <div className="pt-1 text-[10px] font-mono text-slate-500">
          {isLive ? 'FireCast satellite risk pipeline · active live' : 'FireCast sample dataset (simulated) · simulated'}
        </div>
      </div>
    </div>
  );
};
