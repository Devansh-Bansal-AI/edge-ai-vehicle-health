'use client';

import React from 'react';
import type { RULComponent } from '@/lib/engine';

interface SubsystemListProps {
  rul: RULComponent[];
}

const SUBSYSTEM_ICONS: Record<string, string> = {
  'Brake Pads': '🛞',
  'Engine Oil': '🛢️',
  'Air Filter': '🌬️',
  'Timing Belt': '⚙️',
  'Battery': '🔋',
  'Spark Plugs': '⚡',
  'Transmission Fluid': '💧',
  'Coolant': '❄️',
};

export function SubsystemList({ rul }: SubsystemListProps) {
  return (
    <div className="space-y-2" id="subsystem-list">
      {rul.map(component => {
        const pct = Math.round((component.daysLeft / component.totalDays) * 100);
        const urgencyColor = {
          low: 'text-emerald-600',
          medium: 'text-rose-600',
          high: 'text-amber-600',
          critical: 'text-red-600',
        }[component.urgency];

        const barColor = {
          low: 'bg-emerald-500',
          medium: 'bg-rose-500',
          high: 'bg-amber-500',
          critical: 'bg-red-500',
        }[component.urgency];

        return (
          <div key={component.name} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{SUBSYSTEM_ICONS[component.name] ?? '⚙️'}</span>
                <span className="text-xs text-gray-700">{component.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-semibold ${urgencyColor}`}>
                  {component.daysLeft}d
                </span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-rose-50/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
