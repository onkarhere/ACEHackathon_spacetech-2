import React from 'react';
import { WeatherData } from '../types/weather';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Wind } from 'lucide-react';

interface WeatherPanelProps {
  weather: WeatherData;
  updatedTimeText?: string;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  weather,
  updatedTimeText = 'Oct 11, 03:28 PM',
}) => {
  const { current, hourly } = weather;

  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  };

  const windCardinal = getCardinal(current.wind_direction_deg);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B101D] border border-[#1E293B] p-2 rounded-md shadow-xl text-xs">
          <div className="font-bold text-slate-300 pb-1 mb-1 border-b border-slate-800">
            {label}
          </div>
          <div className="space-y-0.5">
            <div className="text-orange-400">
              Temp: <strong>{payload.find((p: any) => p.dataKey === 'temperature_c')?.value}°C</strong>
            </div>
            <div className="text-sky-400">
              RH: <strong>{payload.find((p: any) => p.dataKey === 'relative_humidity')?.value}%</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0E1422] border border-[#1A2438] rounded-xl p-4 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-white">Weather</h3>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A231C] text-[#2DD4BF] border border-[#134E3C] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>LIVE</span>
          </div>
        </div>

        {/* 4 Metrics Columns */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              TEMP
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {current.temperature_c.toFixed(1)}°C
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              RH
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {Math.round(current.relative_humidity)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              WIND
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {current.wind_speed_kmh.toFixed(1)}{' '}
              <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              DIR
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {windCardinal}{' '}
              <span className="text-[10px] font-normal text-slate-400">{current.wind_direction_deg}°</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-36 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#162032" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#64748B"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Blue line for Relative Humidity */}
              <Line
                type="monotone"
                dataKey="relative_humidity"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={false}
              />
              {/* Orange line for Temperature */}
              <Line
                type="monotone"
                dataKey="temperature_c"
                stroke="#FB923C"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subtext below chart */}
      <div className="mt-2 text-[10px] text-slate-400">
        Open-Meteo Forecast API · updated {updatedTimeText} · next 24 h, UTC based
      </div>
    </div>
  );
};
