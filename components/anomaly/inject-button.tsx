'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Zap, Loader2 } from 'lucide-react';
import { FAILURE_SCENARIOS } from '@/lib/engine';

interface InjectButtonProps {
  vehicleId?: string;
}

export function InjectButton({ vehicleId = 'default-vehicle' }: InjectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleInjectRandom = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/anomaly/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(`⚡ Injected ${data.anomaly.faultType} on ${data.anomaly.sensorName}`);
      }
    } catch {
      setLastResult('⚠ Injection failed');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleInjectScenario = async (scenarioId: string) => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/anomaly/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, vehicleId }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(`${data.scenario.icon} ${data.scenario.name} activated`);
      }
    } catch {
      setLastResult('⚠ Injection failed');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" id="inject-button">
      <div className="flex items-center gap-2">
        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg
                     text-red-600 text-xs font-semibold
                     hover:bg-red-500/20 hover:border-red-500/30
                     active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          Inject Fault
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Result badge */}
        {lastResult && (
          <span className="text-[10px] text-gray-500 animate-in fade-in slide-in-from-left-2">
            {lastResult}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-80 bg-[#ffffff] border border-rose-100 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Random inject */}
            <button
              onClick={handleInjectRandom}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50/60 transition-colors border-b border-rose-100"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Random Anomaly</p>
                <p className="text-[10px] text-gray-400">Single-sensor spike, drift, or drop</p>
              </div>
            </button>

            {/* Scenario presets */}
            <div className="px-3 py-2">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Failure Scenarios</span>
            </div>
            {FAILURE_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleInjectScenario(scenario.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-rose-50/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50/60 flex items-center justify-center shrink-0 text-base">
                  {scenario.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{scenario.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{scenario.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
