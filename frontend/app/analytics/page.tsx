'use client';

import { useEffect, useState } from 'react';

import { getApiBaseUrl } from '../../lib/api';

const getAPI = () => getApiBaseUrl();

type Summary = {
  avgProcessingDays: number;
  autoMatchRate: number;
  totalSpendProcessed: number;
  totalInvoicesProcessed: number;
  earlyPaymentDiscounts: number;
  exceptionBreakdown: {
    priceVariance: number;
    missingGRN: number;
    taxMismatch: number;
    duplicates: number;
  };
  topVendors: { name: string; spend: number; invoiceCount: number }[];
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: '100%', background: '#f1f5f9', height: 10, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState('Last 30 Days');

  useEffect(() => {
    fetch(`${getAPI()}/analytics/summary`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSummary(d))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: '#0f172a' }}>
          AP Performance &amp; Analytics
        </h2>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          style={{
            background: '#fff', border: '1px solid #e2e8f0',
            fontSize: 12, fontWeight: 500, color: '#475569',
            padding: '8px 12px', borderRadius: 8,
            fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
          }}
        >
          {['Last 30 Days', 'Quarter to Date', 'Year to Date'].map(o => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[
          { label: 'Avg Processing Time', value: summary ? `${summary.avgProcessingDays} Days` : '—', note: '↓ 14% vs last month', noteColor: '#059669' },
          { label: 'Auto-Match Rate',      value: summary ? `${summary.autoMatchRate}%`       : '—', note: '↑ +3.1% efficiency',  noteColor: '#059669' },
          { label: 'Total Spend Processed',value: summary ? fmt(summary.totalSpendProcessed)  : '—', note: summary ? `${summary.totalInvoicesProcessed.toLocaleString()} Invoices` : '', noteColor: '#64748b' },
          { label: 'Early Payment Discounts', value: summary ? fmt(summary.earlyPaymentDiscounts) : '—', note: 'Captured this quarter', noteColor: '#059669', valueColor: '#059669' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: (card as { valueColor?: string }).valueColor ?? '#0f172a' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: card.noteColor, marginTop: 6 }}>{card.note}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Exception Breakdown */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 20 }}>
            Exception Breakdown by Root Cause
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {summary ? [
              { label: 'Price Variance',           pct: summary.exceptionBreakdown.priceVariance, color: '#f59e0b' },
              { label: 'Missing GRN',               pct: summary.exceptionBreakdown.missingGRN,    color: '#ef4444' },
              { label: 'Tax Mismatch / Compliance', pct: summary.exceptionBreakdown.taxMismatch,   color: '#6366f1' },
              { label: 'Duplicate Invoices',        pct: summary.exceptionBreakdown.duplicates,    color: '#a855f7' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, marginBottom: 5 }}>
                  <span style={{ color: '#475569' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.pct}%</span>
                </div>
                <ProgressBar pct={row.pct} color={row.color} />
              </div>
            )) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading data…</p>
            )}
          </div>
        </div>

        {/* Top Vendors */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 20 }}>
            Top Vendors by Volume
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(summary?.topVendors ?? []).map((v, i) => (
              <div key={v.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < (summary?.topVendors.length ?? 0) - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{v.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {fmt(v.spend)} ({v.invoiceCount} Invoices)
                </span>
              </div>
            ))}
            {!summary && <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading data…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
