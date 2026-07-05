'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface HealthGaugeProps {
  score: number;
  size?: number;
}

// Segmented arc gauge - inspired by the "Fast Car" vehicle-score dial.
const SEGMENTS = 20;
const SWEEP = 250; // total degrees covered (opening at the bottom)

// Interpolate between two hex colors (0..1)
function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export function HealthGauge({ score, size = 180 }: HealthGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const center = size / 2;
  const barW = Math.max(4, size * 0.03);
  const barH = size * 0.13;
  const pad = size * 0.06;

  const filled = Math.round((animatedScore / 100) * SEGMENTS);

  const status = animatedScore >= 80 ? 'OPTIMAL' : animatedScore >= 50 ? 'DEGRADED' : 'CRITICAL';
  const statusColor = animatedScore >= 80 ? '#059669' : animatedScore >= 50 ? '#d97706' : '#dc2626';

  // Light rose → deep crimson gradient across the filled segments
  const fillLight = '#fb7185'; // rose-400
  const fillDeep = '#be123c';  // rose-700
  const emptyColor = '#f1dce1';

  const startA = -SWEEP / 2;
  const step = SWEEP / (SEGMENTS - 1);

  return (
    <div className="relative flex flex-col items-center" id="health-gauge" style={{ width: size }}>
      <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const angle = startA + step * i;
          const isFilled = i < filled;
          const t = filled > 1 ? i / (filled - 1) : 0;
          const color = isFilled ? lerpColor(fillLight, fillDeep, t) : emptyColor;
          return (
            <rect
              key={i}
              x={center - barW / 2}
              y={pad}
              width={barW}
              height={barH}
              rx={barW / 2}
              fill={color}
              transform={`rotate(${angle}, ${center}, ${center})`}
              style={{ transition: 'fill 0.6s ease-out' }}
            />
          );
        })}
      </svg>

      {/* Lightning badge at the top of the arc */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-white ring-1 ring-rose-100"
        style={{ top: pad + barH + size * 0.02, width: size * 0.2, height: size * 0.2, boxShadow: '0 6px 16px -8px rgba(190,18,60,0.5)' }}
      >
        <Zap className="text-rose-600" style={{ width: size * 0.09, height: size * 0.09 }} fill="currentColor" />
      </div>

      {/* Center content */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: '48%' }}>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-gray-900 tabular-nums" style={{ fontSize: size * 0.24 }}>
            {Math.round(animatedScore)}
          </span>
          <span className="text-gray-400 font-medium" style={{ fontSize: size * 0.09 }}>/100</span>
        </div>
        <span
          className="font-semibold tracking-[0.18em]"
          style={{ color: statusColor, fontSize: size * 0.06 }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
