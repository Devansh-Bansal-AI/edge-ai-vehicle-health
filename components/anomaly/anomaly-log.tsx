'use client';

import React, { useRef, useEffect } from 'react';
import type { AnomalyInfo } from '@/lib/engine';
import { AlertTriangle } from 'lucide-react';

interface AnomalyLogProps {
  anomalies: AnomalyInfo[];
}

export function AnomalyLog({ anomalies }: AnomalyLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [anomalies.length]);

  return (
    <div className="flex flex-col h-full" id="anomaly-log">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Anomaly Feed</h3>
        </div>
        <span className="text-[10px] font-mono text-gray-500 bg-rose-50/60 px-2 py-0.5 rounded-full">
          {anomalies.length} events
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <span className="text-xs">No anomalies detected</span>
          </div>
        ) : (
          anomalies.slice(0, 20).map((anomaly, i) => (
            <div
              key={`${anomaly.sensor}-${anomaly.timestamp.toString()}-${i}`}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300 animate-slideIn ${
                anomaly.severity === 'critical'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <span className="text-sm mt-0.5">
                {anomaly.severity === 'critical' ? '🔴' : '🟡'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">
                    {anomaly.sensorName}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase ${
                    anomaly.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {anomaly.severity}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Z:{anomaly.zScore.toFixed(1)} | {anomaly.faultType} | {new Date(anomaly.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
