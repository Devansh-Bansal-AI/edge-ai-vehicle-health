'use client';

import React from 'react';
import type { RULComponent } from '@/lib/engine';
import { Wrench, Calendar, Shield, AlertTriangle, DollarSign } from 'lucide-react';

interface RulTableProps {
  components: (RULComponent & { predictedServiceDate?: string; percentRemaining?: number })[];
}

const URGENCY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const SAFETY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function computePriority(c: RULComponent): number {
  const urgencyScore = URGENCY_WEIGHT[c.urgency] ?? 1;
  const safetyScore = SAFETY_WEIGHT[c.safetyRisk] ?? 1;
  const costNorm = Math.min(c.estimatedCost / 1000, 1); // normalize to 0-1
  return urgencyScore * 0.5 + safetyScore * 0.3 + costNorm * 0.2;
}

export function RulTable({ components }: RulTableProps) {
  const sorted = [...components].sort((a, b) => computePriority(b) - computePriority(a));

  const urgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-600 border-red-500/20',
      high: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      medium: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    };
    return styles[urgency] ?? styles.low;
  };

  const priorityLabel = (score: number) => {
    if (score >= 3.0) return { label: 'FIX NOW', color: 'text-red-600 bg-red-500/10 border-red-500/20' };
    if (score >= 2.2) return { label: 'FIX SOON', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    if (score >= 1.5) return { label: 'SCHEDULE', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
    return { label: 'ROUTINE', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
  };

  const totalCost = components.reduce((sum, c) => sum + c.estimatedCost, 0);

  return (
    <div className="rounded-xl border border-rose-100 bg-white overflow-hidden" id="rul-table">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-rose-600" />
          <h2 className="text-sm font-semibold text-gray-800">Predictive Maintenance Schedule</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <DollarSign className="w-3 h-3" />
          <span>Total Est. Cost: </span>
          <span className="font-mono font-semibold text-gray-700">${totalCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rose-100">
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Component</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">RUL</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Health</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Priority</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Urgency</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Est. Cost</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Safety</th>
              <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Service Date</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(component => {
              const pct = Math.round((component.daysLeft / component.totalDays) * 100);
              const barColor = component.urgency === 'critical' ? 'bg-red-500' : component.urgency === 'high' ? 'bg-amber-500' : component.urgency === 'medium' ? 'bg-rose-500' : 'bg-emerald-500';
              const serviceDate = component.predictedServiceDate ?? new Date(Date.now() + component.daysLeft * 86400000).toLocaleDateString();
              const priority = priorityLabel(computePriority(component));

              return (
                <tr key={component.name} className="border-b border-rose-50 hover:bg-rose-50/70 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {component.urgency === 'critical' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-800">{component.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono font-semibold text-gray-900">{component.daysLeft}</span>
                    <span className="text-xs text-gray-400 ml-1">days</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-rose-50/60 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${priority.color}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${urgencyBadge(component.urgency)}`}>
                      {component.urgency}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono text-gray-700">${component.estimatedCost}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${urgencyBadge(component.safetyRisk)}`}>
                      {component.safetyRisk}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{serviceDate}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
