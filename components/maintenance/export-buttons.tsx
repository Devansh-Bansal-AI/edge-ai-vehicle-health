'use client';

import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import type { RULComponent } from '@/lib/engine';

interface ExportButtonsProps {
  components: (RULComponent & { predictedServiceDate?: string })[];
  planText?: string;
}

export function ExportButtons({ components, planText }: ExportButtonsProps) {
  const handleExportCSV = () => {
    const headers = ['Component', 'RUL (days)', 'Total Days', 'Urgency', 'Confidence', 'Est. Cost ($)', 'Safety Risk', 'Predicted Service Date'];
    const rows = components.map(c => [
      c.name,
      c.daysLeft,
      c.totalDays,
      c.urgency,
      `${c.confidence}%`,
      c.estimatedCost,
      c.safetyRisk,
      c.predictedServiceDate ?? new Date(Date.now() + c.daysLeft * 86400000).toLocaleDateString(),
    ]);

    const csv = [
      `EdgeAI Vehicle Health - Maintenance Report`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `Total Estimated Cost: $${components.reduce((sum, c) => sum + c.estimatedCost, 0).toLocaleString()}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edgeai-maintenance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Open a print-friendly window with the maintenance data
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalCost = components.reduce((sum, c) => sum + c.estimatedCost, 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EdgeAI Maintenance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
          .meta { color: #999; font-size: 12px; margin-bottom: 32px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; padding: 10px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .urgency-critical { color: #dc2626; font-weight: 600; }
          .urgency-high { color: #d97706; font-weight: 600; }
          .urgency-medium { color: #0891b2; }
          .urgency-low { color: #059669; }
          .total { font-size: 16px; font-weight: 600; margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 8px; }
          .ai-plan { margin-top: 32px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
          .ai-plan h2 { font-size: 16px; margin-bottom: 12px; }
          .ai-plan pre { font-size: 12px; white-space: pre-wrap; line-height: 1.6; color: #374151; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>🔧 EdgeAI Predictive Maintenance Report</h1>
        <p class="subtitle">Vehicle Health & Component Lifecycle Analysis</p>
        <p class="meta">Generated: ${new Date().toLocaleString()}</p>

        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>RUL (Days)</th>
              <th>Health %</th>
              <th>Urgency</th>
              <th>Safety Risk</th>
              <th>Est. Cost</th>
              <th>Service Date</th>
            </tr>
          </thead>
          <tbody>
            ${components.sort((a, b) => a.daysLeft - b.daysLeft).map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.daysLeft}</td>
                <td>${Math.round((c.daysLeft / c.totalDays) * 100)}%</td>
                <td class="urgency-${c.urgency}">${c.urgency.toUpperCase()}</td>
                <td class="urgency-${c.safetyRisk}">${c.safetyRisk.toUpperCase()}</td>
                <td>$${c.estimatedCost}</td>
                <td>${c.predictedServiceDate ?? new Date(Date.now() + c.daysLeft * 86400000).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Total Estimated Maintenance Cost: <strong>$${totalCost.toLocaleString()}</strong>
        </div>

        ${planText ? `
          <div class="ai-plan">
            <h2>🤖 AI-Generated Maintenance Plan</h2>
            <pre>${planText}</pre>
          </div>
        ` : ''}

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center gap-2" id="export-buttons">
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/60 border border-gray-200 rounded-lg
                   text-gray-500 text-[10px] font-semibold
                   hover:bg-rose-100/70 hover:border-gray-300 hover:text-gray-700
                   active:scale-95 transition-all"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Export CSV
      </button>
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/60 border border-gray-200 rounded-lg
                   text-gray-500 text-[10px] font-semibold
                   hover:bg-rose-100/70 hover:border-gray-300 hover:text-gray-700
                   active:scale-95 transition-all"
      >
        <FileText className="w-3.5 h-3.5" />
        Export PDF
      </button>
    </div>
  );
}
