'use client';

import { useEffect, useState } from 'react';

import { getApiBaseUrl } from '../../lib/api';

const getAPI = () => getApiBaseUrl();

type Invoice = {
  id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(2)}`;
}

const EXCEPTION_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  exception_price: { label: 'Price Variance 8%', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  exception_grn: { label: 'Missing GRN', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  exception_tax: { label: 'Tax Mismatch', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

/* ─── Side panel for 3-way match ─── */
function SidePanel({ invoice, onClose, onDecision }: {
  invoice: Invoice | null;
  onClose: () => void;
  onDecision: (id: string, decision: 'force_approved' | 'rejected') => void;
}) {
  if (!invoice) return null;
  const exception = EXCEPTION_LABEL[invoice.status] ?? { label: invoice.status, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, overflow: 'hidden' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)' }} />

      {/* Drawer — responsive width */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: 'min(92vw, 760px)',
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.20)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Panel header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {invoice.vendor_name} – {invoice.invoice_number}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, padding: '4px 8px', borderRadius: 8 }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 14, flexShrink: 0 }}></i>
            Exception detected: {exception.label} on {invoice.invoice_number} — total ${invoice.total_amount.toLocaleString()}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', overflow: 'auto' }}>
          {/* Left: Simulated PDF */}
          <div style={{ background: '#0f172a', padding: 24, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span>Source Truth (Original PDF)</span>
              <span style={{ color: '#818cf8' }}>Page 1 of 1</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, fontSize: 11, color: '#334155', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 14, fontFamily: 'var(--font-body)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{invoice.vendor_name}</div>
                  <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>100 Commerce St, Suite 200</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>INVOICE #{invoice.invoice_number}</div>
                  <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              <table style={{ width: '100%', fontSize: 11, fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: 10, borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', paddingBottom: 6 }}>Description</th>
                    <th style={{ textAlign: 'right', paddingBottom: 6 }}>Qty</th>
                    <th style={{ textAlign: 'right', paddingBottom: 6 }}>Unit Price</th>
                    <th style={{ textAlign: 'right', paddingBottom: 6 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#fefce8', outline: '2px solid #fbbf24' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 500 }}>Service / License Fee</td>
                    <td style={{ textAlign: 'right' }}>100</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>$15.00</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${(invoice.total_amount * 0.28).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 4px' }}>Setup &amp; Configuration</td>
                    <td style={{ textAlign: 'right' }}>1</td>
                    <td style={{ textAlign: 'right' }}>${(invoice.total_amount * 0.72).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${(invoice.total_amount * 0.72).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, textAlign: 'right', fontFamily: 'var(--font-body)' }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>Total Due:</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', background: '#fef9c3', display: 'inline-block', padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a', marginTop: 2 }}>
                  ${invoice.total_amount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right: 3-way match */}
          <div style={{ background: '#f8fafc', padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>3-Way Match Verification</div>
            {[
              { title: 'Invoice Data (Extracted)', titleColor: '#4f46e5', data: [['Total Amount', `$${invoice.total_amount.toLocaleString()}`], ['Line Qty', '100']] },
              { title: 'Purchase Order (ERP)', titleColor: '#475569', data: [['Expected Total', `$${(invoice.total_amount * 0.93).toFixed(0)}`], ['Expected Qty', '100']] },
              { title: 'Goods Receipt (ERP)', titleColor: '#475569', data: [['Received Qty', '100'], ['Receipt Date', 'Oct 12, 2026']] },
            ].map(card => (
              <div key={card.title} style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: card.titleColor, marginBottom: 10 }}>{card.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {card.data.map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
          <button onClick={() => onDecision(invoice.id, 'rejected')}
            style={{ padding: '8px 16px', border: '1px solid #dc2626', color: '#dc2626', background: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >Reject / Return to Vendor</button>
          <button onClick={() => onDecision(invoice.id, 'force_approved')}
            style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d97706')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
          >Force Approve</button>
          <button onClick={() => onDecision(invoice.id, 'force_approved')}
            style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
          >Route for Approval</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vendorflow-token');
    fetch(`${getAPI()}/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setInvoices(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, []);

  /* Derived lists */
  const exceptions = invoices.filter(i => i.status.startsWith('exception'));
  const ready = invoices.filter(i => i.status === 'approved');
  const active = invoices.filter(i => i.status !== 'rejected' && i.status !== 'released');

  /* KPI sums — calculated from live invoice list */
  const totalPendingAP = active.reduce((s, i) => s + i.total_amount, 0);
  const exceptionCount = exceptions.length;
  const exceptionRate = active.length > 0 ? Math.round((exceptionCount / active.length) * 100) : 0;
  const readyForRelease = ready.reduce((s, i) => s + i.total_amount, 0);

  const selectedTotal = ready
    .filter(i => selectedIds.has(i.id))
    .reduce((s, i) => s + i.total_amount, 0);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  /* When exception is resolved → move to approved or remove */
  const handleDecision = (id: string, decision: 'force_approved' | 'rejected') => {
    setInvoices(cur =>
      cur.map(i => i.id === id ? { ...i, status: decision === 'force_approved' ? 'approved' : 'rejected' } : i)
    );
    setSelectedInvoice(null);
  };

  /* Authorize batch — mark selected approved invoices as released */
  const handleBatch = () => {
    if (selectedIds.size === 0) return;
    const total = selectedTotal;
    const count = selectedIds.size;
    setInvoices(cur => cur.map(i => selectedIds.has(i.id) ? { ...i, status: 'released' } : i));
    setSelectedIds(new Set());
    setBatchMsg(`✓ Batch of ${count} invoice(s) totalling ${fmt(total)} submitted to Treasury.`);
    setTimeout(() => setBatchMsg(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* ── KPI RIBBON ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>

        {/* Total Pending AP = sum of all active invoices (exceptions + approved) */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Total Pending AP</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{fmt(totalPendingAP)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: 999 }}>{active.length} Invoices</span>
          </div>
        </div>

        {/* Exception Rate */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Exception Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#dc2626', fontFamily: 'var(--font-heading)' }}>{exceptionRate}%</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', borderRadius: 999 }}>{exceptionCount} Blocked</span>
          </div>
        </div>

        {/* Ready for Release = sum of approved invoices */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Ready for Release</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{fmt(readyForRelease)}</span>
            <button
              style={{ padding: '7px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#047857')}
              onMouseLeave={e => (e.currentTarget.style.background = '#059669')}
              onClick={() => { if (ready.length > 0) { setSelectedIds(new Set(ready.map(i => i.id))); handleBatch(); } }}
            >
              <i className="fa-solid fa-play" style={{ fontSize: 10 }}></i> Execute Batch
            </button>
          </div>
        </div>
      </div>

      {batchMsg && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 13, fontWeight: 500 }}>
          {batchMsg}
        </div>
      )}

      {/* ── SPLIT QUEUE VIEW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Exception Queue */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Exception Queue</h3>
              <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{exceptions.length}</span>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Action Required</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {exceptions.length === 0 ? (
              <p style={{ padding: '24px 20px', fontSize: 13, color: '#94a3b8' }}>✓ No exceptions. All invoices are clean.</p>
            ) : (
              exceptions.map(inv => {
                const exc = EXCEPTION_LABEL[inv.status] ?? { label: inv.status, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{inv.vendor_name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span>{inv.invoice_number}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 500, color: '#475569' }}>${inv.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: exc.bg, color: exc.color, border: `1px solid ${exc.border}` }}>
                      {exc.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ready for Treasury */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Ready for Treasury</h3>
              <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{ready.length}</span>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Fully Validated Pipeline</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {ready.length === 0 ? (
              <p style={{ padding: '24px 20px', fontSize: 13, color: '#94a3b8' }}>No invoices ready for Treasury yet.</p>
            ) : (
              ready.map(inv => (
                <div
                  key={inv.id}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{inv.vendor_name}</span>
                      <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}> • {inv.invoice_number}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>${inv.total_amount.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Cleared</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {selectedIds.size} selected ({fmt(selectedTotal)})
            </span>
            <button
              onClick={handleBatch}
              disabled={selectedIds.size === 0}
              style={{ padding: '8px 16px', background: selectedIds.size ? '#4f46e5' : '#c7d2fe', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: selectedIds.size ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (selectedIds.size) e.currentTarget.style.background = '#4338ca'; }}
              onMouseLeave={e => { if (selectedIds.size) e.currentTarget.style.background = '#4f46e5'; }}
            >
              Authorize Batch
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedInvoice && (
        <SidePanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onDecision={handleDecision} />
      )}
    </div>
  );
}
