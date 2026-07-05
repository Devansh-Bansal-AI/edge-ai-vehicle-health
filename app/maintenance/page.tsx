'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RulTable } from '@/components/maintenance/rul-table';
import { PlanGenerator } from '@/components/maintenance/plan-generator';
import { ExportButtons } from '@/components/maintenance/export-buttons';
import { HealthGauge } from '@/components/health/health-gauge';
import { Wrench, DollarSign } from 'lucide-react';

interface RULData {
  name: string;
  daysLeft: number;
  totalDays: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  relatedSensors: string[];
  estimatedCost: number;
  safetyRisk: 'low' | 'medium' | 'high' | 'critical';
  predictedServiceDate?: string;
  percentRemaining?: number;
}

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle') ?? 'default-vehicle';

  const [components, setComponents] = useState<RULData[]>([]);
  const [healthScore, setHealthScore] = useState(90);
  const [planText, setPlanText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [rulRes, healthRes] = await Promise.all([
        fetch(`/api/maintenance/rul?vehicle=${vehicleId}`),
        fetch(`/api/health/score?vehicle=${vehicleId}`),
      ]);
      const rulData = await rulRes.json();
      const healthData = await healthRes.json();
      setComponents(rulData.components);
      setHealthScore(healthData.score);
    } catch {
      // API not ready
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const nextService = components.length > 0
    ? Math.min(...components.map(c => c.daysLeft))
    : 0;

  const totalCost = components.reduce((sum, c) => sum + (c.estimatedCost ?? 0), 0);

  return (
    <div className="space-y-6" id="maintenance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-rose-600" />
            Predictive Maintenance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Component lifecycle tracking with AI-powered service scheduling</p>
        </div>
        <ExportButtons components={components} planText={planText} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-rose-100 bg-white p-5 flex items-center justify-center">
          <HealthGauge score={healthScore} size={140} />
        </div>
        <div className="rounded-xl border border-rose-100 bg-white p-5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Next Service</span>
          <p className="text-3xl font-mono font-bold text-amber-600 mt-2">{nextService}</p>
          <p className="text-xs text-gray-400 mt-1">days until next maintenance</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-white p-5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Critical Components</span>
          <p className="text-3xl font-mono font-bold text-red-600 mt-2">
            {components.filter(c => c.urgency === 'critical').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">require immediate attention</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-white p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Est. Cost</span>
          </div>
          <p className="text-3xl font-mono font-bold text-gray-900 mt-2">${totalCost.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">across all components</p>
        </div>
      </div>

      {/* RUL Table */}
      <RulTable components={components} />

      {/* AI Plan Generator */}
      <PlanGenerator onPlanGenerated={setPlanText} vehicleId={vehicleId} />
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-xs p-5 font-mono">Loading maintenance schedule...</div>}>
      <MaintenanceContent />
    </Suspense>
  );
}
