'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatTerminal } from '@/components/diagnostics/chat-terminal';
import { ContextPanel } from '@/components/diagnostics/context-panel';
import type { SensorReading, RULComponent, AnomalyInfo } from '@/lib/engine';

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle') ?? 'default-vehicle';

  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [healthScore, setHealthScore] = useState(90);
  const [rul, setRul] = useState<RULComponent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyInfo[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/sensors/stream?vehicle=${vehicleId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setReadings(data.sensors);
        setHealthScore(data.healthScore);
        if (data.rul) setRul(data.rul);
        if (data.anomalies?.length > 0) {
          setAnomalies(prev => [...data.anomalies, ...prev].slice(0, 20));
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setTimeout(connectSSE, 2000);
    };
  }, [vehicleId]);

  useEffect(() => {
    connectSSE();
    return () => { eventSourceRef.current?.close(); };
  }, [connectSSE]);

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4" id="diagnostics-page">
      {/* Main Chat Terminal - 70% */}
      <div className="flex-[7] min-w-0">
        <ChatTerminal vehicleId={vehicleId} />
      </div>

      {/* Context Panel - 30% */}
      <div className="flex-[3] min-w-[280px]">
        <ContextPanel
          readings={readings}
          healthScore={healthScore}
          rul={rul}
          anomalies={anomalies}
        />
      </div>
    </div>
  );
}

export default function DiagnosticsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-xs p-5 font-mono">Loading diagnostics terminal...</div>}>
      <DiagnosticsContent />
    </Suspense>
  );
}
