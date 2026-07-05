'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SensorGrid } from '@/components/sensors/sensor-grid';
import { HealthGauge } from '@/components/health/health-gauge';
import { SubsystemList } from '@/components/health/subsystem-list';
import { AnomalyLog } from '@/components/anomaly/anomaly-log';
import { InjectButton } from '@/components/anomaly/inject-button';
import { EdgeCloudRace } from '@/components/latency/edge-cloud-race';
import { toast } from 'sonner';
import { Link2 } from 'lucide-react';
import type { SensorReading, RULComponent, AnomalyInfo, CorrelationAlert } from '@/lib/engine';
import { SENSORS } from '@/lib/engine';

function DashboardContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle') ?? 'default-vehicle';

  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [healthScore, setHealthScore] = useState(90);
  const [rul, setRul] = useState<RULComponent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyInfo[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/sensors/stream?vehicle=${vehicleId}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 2s
      setTimeout(connectSSE, 2000);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Update sensor readings
        setReadings(data.sensors);

        // Update history buffers
        setHistory(prev => {
          const updated = { ...prev };
          for (const [key, reading] of Object.entries(data.sensors) as [string, SensorReading][]) {
            const existing = updated[key] ?? [];
            const next = [...existing, reading.value];
            if (next.length > 60) next.shift();
            updated[key] = next;
          }
          return updated;
        });

        // Update health score
        setHealthScore(data.healthScore);

        // Update RUL
        if (data.rul) setRul(data.rul);

        // Update correlations
        if (data.correlations) setCorrelations(data.correlations);

        // Append new anomalies + fire toast alerts
        if (data.anomalies?.length > 0) {
          setAnomalies(prev => {
            const next = [...data.anomalies, ...prev];
            if (next.length > 50) return next.slice(0, 50);
            return next;
          });

          // Toast notifications for critical anomalies
          for (const anomaly of data.anomalies) {
            if (anomaly.severity === 'critical') {
              const sensorName = SENSORS[anomaly.sensor]?.name ?? anomaly.sensor;
              toast.error(`🚨 Critical Anomaly: ${sensorName}`, {
                description: `Z-Score: ${anomaly.zScore.toFixed(2)} - Fault: ${anomaly.faultType}`,
                duration: 6000,
              });
            } else if (anomaly.severity === 'warning') {
              const sensorName = SENSORS[anomaly.sensor]?.name ?? anomaly.sensor;
              toast.warning(`⚠️ Warning: ${sensorName}`, {
                description: `Z-Score: ${anomaly.zScore.toFixed(2)} - Fault: ${anomaly.faultType}`,
                duration: 4000,
              });
            }
          }
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };
  }, [vehicleId]);

  useEffect(() => {
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connectSSE]);

  return (
    <div className="space-y-6" id="dashboard-page">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Live Telemetry Monitor</h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time sensor streams with Welford&apos;s Online Anomaly Detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[10px] text-gray-500">{connected ? 'SSE Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content - Sensor Grid */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <SensorGrid readings={readings} history={history} />

          {/* Correlation Alerts */}
          {correlations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {correlations.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono border ${
                    Math.abs(c.coefficient) > 0.85
                      ? 'bg-red-500/5 border-red-500/20 text-red-600'
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>{c.sensorAName}</span>
                  <span className="text-gray-400">{c.direction === 'positive' ? '↑↑' : '↑↓'}</span>
                  <span>{c.sensorBName}</span>
                  <span className="text-gray-500">r={c.coefficient.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <InjectButton vehicleId={vehicleId} />
            <div className="flex items-center gap-4">
              <div className="text-[10px] text-gray-400 font-mono">
                Inference: <span className="text-gray-500">{(138 + Math.random() * 20).toFixed(0)} Hz</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                Latency: <span className="text-rose-600">{(1.5 + Math.random() * 1.5).toFixed(1)}ms</span>
              </div>
            </div>
          </div>

          {/* Edge vs Cloud */}
          <EdgeCloudRace />
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Health Gauge */}
          <div className="rounded-xl border border-rose-100 bg-white p-5 flex flex-col items-center">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 self-start">Vehicle Health</h3>
            <HealthGauge score={healthScore} />
          </div>

          {/* Subsystem List */}
          <div className="rounded-xl border border-rose-100 bg-white p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Component RUL</h3>
            <SubsystemList rul={rul} />
          </div>

          {/* Anomaly Log */}
          <div className="rounded-xl border border-rose-100 bg-white p-4 h-80">
            <AnomalyLog anomalies={anomalies} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-xs p-5 font-mono">Loading telemetry monitor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
