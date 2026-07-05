'use client';

import React from 'react';
import { SensorCanvas } from './sensor-canvas';
import { SENSORS, type SensorReading } from '@/lib/engine';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SensorCardProps {
  sensorKey: string;
  reading: SensorReading | null;
  history: number[];
}

export function SensorCard({ sensorKey, reading, history }: SensorCardProps) {
  const config = SENSORS[sensorKey];
  if (!config) return null;

  const value = reading?.value ?? config.baseline;
  const zScore = reading?.zScore ?? 0;
  const status = reading?.status ?? 'normal';
  const trend = reading?.trend ?? 'stable';

  const statusColors = {
    normal: 'text-emerald-600 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-600 bg-amber-400/10 border-amber-400/20',
    critical: 'text-red-600 bg-red-400/10 border-red-400/20 animate-pulse',
  };

  const borderGlow = {
    normal: 'border-rose-100',
    warning: 'border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]',
    critical: 'border-red-500/30 shadow-[0_0_20px_-3px_rgba(239,68,68,0.2)]',
  };

  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus;
  const trendColor = trend === 'rising' ? 'text-amber-600' : trend === 'falling' ? 'text-rose-600' : 'text-gray-500';

  return (
    <div
      id={`sensor-card-${sensorKey}`}
      className={`relative rounded-xl border bg-white backdrop-blur-sm p-4 transition-all duration-300 ${borderGlow[status]}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: config.color }} />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">{config.name}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[status]}`}>
          {status === 'critical' ? '⚠ CRITICAL' : status === 'warning' ? 'WARNING' : 'NORMAL'}
        </span>
      </div>

      {/* Value Display */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-mono font-bold text-gray-900 tabular-nums">
          {config.noiseStd < 1 ? value.toFixed(1) : Math.round(value)}
        </span>
        <span className="text-xs text-gray-500 font-mono">{config.unit}</span>
      </div>

      {/* Z-Score & Trend */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono text-gray-500">
          Z: <span className={zScore > 3.75 ? 'text-red-600' : zScore > 2.5 ? 'text-amber-600' : 'text-gray-600'}>{zScore.toFixed(1)}</span>
        </span>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span className="text-[10px] capitalize">{trend}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-20 w-full rounded-lg overflow-hidden bg-rose-50/50">
        <SensorCanvas
          sensorKey={sensorKey}
          config={config}
          data={history}
          status={status}
        />
      </div>
    </div>
  );
}
