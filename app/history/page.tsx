'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnomalyHistory } from '@/components/history/anomaly-history';
import { History } from 'lucide-react';

function HistoryContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle') ?? 'default-vehicle';

  return (
    <div className="space-y-6" id="history-page">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-rose-600" />
          Anomaly History & Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Historical anomaly events from Neon PostgreSQL with aggregate analytics</p>
      </div>
      <AnomalyHistory vehicleId={vehicleId} />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-xs p-5 font-mono">Loading history and analytics...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
