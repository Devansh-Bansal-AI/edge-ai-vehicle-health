'use client';

import React from 'react';
import { Activity, Heart, AlertTriangle } from 'lucide-react';
import type { SensorReading, RULComponent, AnomalyInfo } from '@/lib/engine';
import { SENSORS } from '@/lib/engine';

interface ContextPanelProps {
  readings: Record<string, SensorReading>;
  healthScore: number;
  rul: RULComponent[];
  anomalies: AnomalyInfo[];
}

export function ContextPanel({ readings, healthScore, rul, anomalies }: ContextPanelProps) {
  const scoreColor = healthScore >= 80 ? 'text-emerald-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="h-full flex flex-col bg-[#ffffff] rounded-xl border border-rose-100 overflow-hidden" id="context-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-rose-100 bg-white">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-rose-600" />
          Live Context
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Health Score */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Vehicle Health</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold ${scoreColor}`}>{healthScore}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>

        {/* Live Sensors */}
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">Sensor Readings</span>
          <div className="space-y-1.5">
            {Object.entries(SENSORS).map(([key, config]) => {
              const reading = readings[key];
              const value = reading?.value ?? config.baseline;
              const status = reading?.status ?? 'normal';
              const statusDot = status === 'critical' ? 'bg-red-400' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400';

              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                    <span className="text-[10px] text-gray-500">{config.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-700">
                    {config.noiseStd < 1 ? value.toFixed(1) : Math.round(value)}{config.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RUL Summary */}
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">Component RUL</span>
          <div className="space-y-1.5">
            {rul.filter(c => c.urgency === 'critical' || c.urgency === 'high').map(c => {
              const urgencyColor = c.urgency === 'critical' ? 'text-red-600' : 'text-amber-600';
              return (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{c.name}</span>
                  <span className={`text-[10px] font-mono font-semibold ${urgencyColor}`}>{c.daysLeft}d</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Anomalies */}
        {anomalies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Alerts</span>
            </div>
            <div className="space-y-1.5">
              {anomalies.slice(0, 5).map((a, i) => (
                <div key={i} className={`text-[10px] px-2 py-1 rounded border ${
                  a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                }`}>
                  {a.sensorName}: Z={a.zScore.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
