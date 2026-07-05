'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SENSORS } from '@/lib/engine';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { BarChart3, Filter, ChevronLeft, ChevronRight, TrendingDown, Clock } from 'lucide-react';

interface AnomalyEvent {
  id: string;
  sensor: string;
  faultType: string;
  zScore: number;
  severity: string;
  duration: number;
  createdAt: string;
}

interface HealthSnapshot {
  id: string;
  score: number;
  createdAt: string;
}

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
];

interface AnomalyHistoryProps {
  vehicleId?: string;
}

export function AnomalyHistory({ vehicleId = 'default-vehicle' }: AnomalyHistoryProps) {
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterSensor, setFilterSensor] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthHistory, setHealthHistory] = useState<HealthSnapshot[]>([]);
  const [timeRange, setTimeRange] = useState(24);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', vehicle: vehicleId });
      if (filterSensor) params.set('sensor', filterSensor);
      if (filterSeverity) params.set('severity', filterSeverity);

      const res = await fetch(`/api/anomaly/log?${params}`);
      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // DB not configured
    } finally {
      setLoading(false);
    }
  }, [page, filterSensor, filterSeverity, vehicleId]);

  const fetchHealthHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/health/history?hours=${timeRange}&vehicle=${vehicleId}`);
      const data = await res.json();
      setHealthHistory(data.snapshots);
    } catch {
      // DB not configured
    }
  }, [timeRange, vehicleId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchHealthHistory(); }, [fetchHealthHistory]);

  // Aggregate stats for chart
  const sensorCounts: Record<string, number> = {};
  for (const event of events) {
    sensorCounts[event.sensor] = (sensorCounts[event.sensor] ?? 0) + 1;
  }
  const chartData = Object.entries(sensorCounts).map(([sensor, count]) => ({
    sensor: SENSORS[sensor]?.name ?? sensor,
    count,
    color: SENSORS[sensor]?.color ?? '#666',
  }));

  const avgZScore = events.length > 0
    ? (events.reduce((sum, e) => sum + e.zScore, 0) / events.length).toFixed(1)
    : '0.0';

  const mostAffected = chartData.length > 0
    ? chartData.reduce((max, d) => d.count > max.count ? d : max, chartData[0])?.sensor ?? 'N/A'
    : 'N/A';

  // Format health history for chart
  const healthChartData = healthHistory.map(s => ({
    time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: s.score,
    timestamp: new Date(s.createdAt).toLocaleString(),
  }));

  return (
    <div className="space-y-6" id="anomaly-history">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-100 bg-white p-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Anomalies</span>
          <p className="text-2xl font-mono font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-white p-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Z-Score</span>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1">{avgZScore}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-white p-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Most Affected</span>
          <p className="text-2xl font-mono font-bold text-rose-600 mt-1 truncate">{mostAffected}</p>
        </div>
      </div>

      {/* Health Trend Chart */}
      <div className="rounded-xl border border-rose-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">Vehicle Health Trend</h3>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            {TIME_RANGES.map(range => (
              <button
                key={range.hours}
                onClick={() => setTimeRange(range.hours)}
                className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                  timeRange === range.hours
                    ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                    : 'text-gray-400 hover:text-gray-500 border border-transparent'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          {healthChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthChartData}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,10,14,0.06)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(31,26,27,0.55)', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(31,26,27,0.55)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(16,10,14,0.12)', borderRadius: '8px' }}
                  labelStyle={{ color: 'rgba(31,26,27,0.75)' }}
                  formatter={(value) => [`${value}/100`, 'Health Score']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.timestamp ?? ''}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#healthGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-xs">
              No health snapshots recorded yet. Data appears after ~60s of running.
            </div>
          )}
        </div>
      </div>

      {/* Anomalies by Sensor Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-rose-100 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-gray-800">Anomalies by Sensor</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,10,14,0.06)" />
                <XAxis dataKey="sensor" tick={{ fill: 'rgba(31,26,27,0.55)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(31,26,27,0.55)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(16,10,14,0.12)', borderRadius: '8px' }}
                  labelStyle={{ color: 'rgba(31,26,27,0.75)' }}
                  itemStyle={{ color: 'rgba(31,26,27,0.9)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="rounded-xl border border-rose-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
          <h3 className="text-sm font-semibold text-gray-800">Event Log</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterSensor}
              onChange={e => { setFilterSensor(e.target.value); setPage(1); }}
              className="bg-rose-50/60 border border-gray-200 rounded-lg px-2 py-1 text-[10px] text-gray-600 focus:outline-none"
            >
              <option value="">All Sensors</option>
              {Object.entries(SENSORS).map(([key, s]) => (
                <option key={key} value={key}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={e => { setFilterSeverity(e.target.value); setPage(1); }}
              className="bg-rose-50/60 border border-gray-200 rounded-lg px-2 py-1 text-[10px] text-gray-600 focus:outline-none"
            >
              <option value="">All Severity</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rose-100">
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Timestamp</th>
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Sensor</th>
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Fault</th>
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Z-Score</th>
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Severity</th>
                <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-2.5 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-300 text-xs">Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-300 text-xs">No anomaly events recorded yet. Inject an anomaly to see data here.</td></tr>
              ) : events.map(event => (
                <tr key={event.id} className="border-b border-rose-50 hover:bg-rose-50/70 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-gray-500 font-mono">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-700">{SENSORS[event.sensor]?.name ?? event.sensor}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-500 capitalize">{event.faultType}</td>
                  <td className="px-5 py-2.5 text-xs font-mono">
                    <span className={event.zScore > 3.75 ? 'text-red-600' : event.zScore > 2.5 ? 'text-amber-600' : 'text-gray-500'}>
                      {event.zScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      event.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-gray-500 font-mono">{event.duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-rose-100">
            <span className="text-[10px] text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
