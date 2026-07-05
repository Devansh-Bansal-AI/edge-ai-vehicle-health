'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck, Heart, AlertTriangle, Wrench, RefreshCw, ChevronRight, Activity, Link2, Shield,
} from 'lucide-react';

interface FleetVehicle {
  id: string;
  name: string;
  vin: string;
  healthScore: number;
  criticalComponents: number;
  activeAnomalies: number;
  correlationCount: number;
  nextServiceDays: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface FleetOverview {
  vehicles: FleetVehicle[];
  fleetHealth: number;
  totalCritical: number;
  totalVehicles: number;
}

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/status');
      const data = await res.json();
      setFleet(data);
    } catch {
      // API not ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  const statusColors = {
    healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600', dot: 'bg-amber-400' },
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600', dot: 'bg-red-400' },
  };

  const healthColor = (score: number) => score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6" id="fleet-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-rose-600" />
            Fleet Overview
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Aggregated health monitoring across all fleet vehicles - sorted by risk
          </p>
        </div>
        <button
          onClick={fetchFleet}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-600 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {fleet && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-rose-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Fleet Health</span>
              </div>
              <p className={`text-3xl font-mono font-bold ${healthColor(fleet.fleetHealth)}`}>
                {fleet.fleetHealth}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">avg across {fleet.totalVehicles} vehicles</p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-rose-600" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Vehicles</span>
              </div>
              <p className="text-3xl font-mono font-bold text-gray-900">{fleet.totalVehicles}</p>
              <p className="text-[10px] text-gray-400 mt-1">active in fleet</p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Critical</span>
              </div>
              <p className="text-3xl font-mono font-bold text-red-600">{fleet.totalCritical}</p>
              <p className="text-[10px] text-gray-400 mt-1">vehicles need attention</p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Healthy</span>
              </div>
              <p className="text-3xl font-mono font-bold text-emerald-600">
                {fleet.vehicles.filter(v => v.status === 'healthy').length}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">vehicles nominal</p>
            </div>
          </div>

          {/* Fleet Vehicle Table */}
          <div className="rounded-xl border border-rose-100 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-rose-100">
              <Activity className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-semibold text-gray-800">Vehicle Status - Sorted by Risk</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rose-100">
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Status</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Vehicle</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">VIN</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Health</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Critical Parts</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Correlations</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold">Next Service</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.vehicles.map(vehicle => {
                    const sc = statusColors[vehicle.status];
                    return (
                      <tr key={vehicle.id} className="border-b border-rose-50 hover:bg-rose-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${vehicle.status === 'critical' ? 'animate-pulse' : ''}`} />
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-800 font-medium">{vehicle.name}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-gray-500">{vehicle.vin}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-mono font-bold ${healthColor(vehicle.healthScore)}`}>
                              {vehicle.healthScore}
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-rose-50/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  vehicle.healthScore >= 80 ? 'bg-emerald-500' : vehicle.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${vehicle.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-mono font-semibold ${
                            vehicle.criticalComponents > 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {vehicle.criticalComponents}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {vehicle.correlationCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                              <Link2 className="w-2.5 h-2.5" />
                              {vehicle.correlationCount}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs font-mono ${
                              vehicle.nextServiceDays < 15 ? 'text-red-600' : vehicle.nextServiceDays < 30 ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {vehicle.nextServiceDays}d
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/dashboard?vehicle=${vehicle.id}`}
                            className="flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-600 transition-colors"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {loading && !fleet && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      )}
    </div>
  );
}
