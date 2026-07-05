'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import type { SensorConfig } from '@/lib/engine';

interface SensorCanvasProps {
  sensorKey: string;
  config: SensorConfig;
  data: number[];
  status: 'normal' | 'warning' | 'critical';
  maxPoints?: number;
}

export function SensorCanvas({ config, data, status, maxPoints = 60 }: SensorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const yMin = config.min;
    const yMax = config.max;
    const yRange = yMax - yMin;

    // Normal range band
    const nMinY = height - ((config.normalMin - yMin) / yRange) * height;
    const nMaxY = height - ((config.normalMax - yMin) / yRange) * height;
    ctx.fillStyle = 'rgba(16,10,14,0.04)';
    ctx.fillRect(0, nMaxY, width, nMinY - nMaxY);

    // Threshold lines
    ctx.strokeStyle = 'rgba(16,10,14,0.08)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    [nMinY, nMaxY].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const step = width / (maxPoints - 1);

    // Build points
    const points = data.map((v, i) => ({
      x: (i + (maxPoints - data.length)) * step,
      y: height - ((v - yMin) / yRange) * height,
    }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    const baseColor = config.color;
    grad.addColorStop(0, hexToRgba(baseColor, 0.2));
    grad.addColorStop(1, 'transparent');

    // Fill area under curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach((p, i) => {
      if (i === 0) { ctx.lineTo(p.x, p.y); return; }
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, p.y, p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) { ctx.moveTo(p.x, p.y); return; }
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, p.y, p.x, p.y);
    });

    // Glow effect for anomalies
    if (status === 'critical') {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
    } else if (status === 'warning') {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 4;
    }

    ctx.strokeStyle = config.color;
    ctx.lineWidth = status === 'critical' ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Current value dot with glow
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, status === 'critical' ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.shadowColor = config.color;
    ctx.shadowBlur = status !== 'normal' ? 12 : 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(config.color, 0.15);
    ctx.fill();
  }, [data, config, status, maxPoints]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
