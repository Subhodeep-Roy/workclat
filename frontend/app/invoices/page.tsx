'use client';

import { useEffect, useState } from 'react';
import { fetchJson, postJson, type Invoice, type ConfidenceScore } from '../../lib/api';

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  approved:        { label: '✓ Approved',       color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  released:        { label: '✓ Released',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  manual_review:   { label: '⚠ Manual Review',  color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  exception_price: { label: '✗ Price Variance',  color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  exception_grn:   { label: '✗ Missing GRN',    color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  exception_tax:   { label: '✗ Tax Mismatch',   color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  exception_fraud: { label: '🚨 Fraud Alert',   color: '#7f1d1d', bg: '#fff1f2', border: '#fca5a5' },
  exception_budget:{ label: '✗ Budget Overrun', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  exception_po:    { label: '✗ PO Not Found',   color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? { label: status, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function ConfidenceBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color = pct >= 95 ? '#16a34a' : pct >= 88 ? '#d97706' : '#dc2626';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function AgentPipeline({ notes }: { notes: string[] }) {
  const agentColors: Record<string, string> = {
    'Agent 1': '#6366f1', 'Agent 2': '#0891b2',
    'Agent 3': '#dc2626', 'Agent 4': '#d97706',
    'Agent 5': '#059669', 'Agent 6': '#7c3aed',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {notes.map((note, i) => {
        const agentKey = Object.keys(agentColors).find(k => note.startsWith(k));
        const color = agentKey ? agentColors[agentKey] : '#64748b';
        const isCritical = note.includes('CRITICAL') || note.includes('🚨');
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 10px', borderRadius: 6,
            background: isCritical ? '#fff1f2' : '#f8fafc',
            border: `1px solid ${isCritical ? '#fca5a5' : '#e2e8f0'}`,
            fontSize: 12, lineHeight: 1.5,
          }}>
            <span style={{
              flexShrink: 0, marginTop: 1, width: 6, height: 6,
              borderRadius: '50%', background: color, display: 'inline-block',
            }} />
            <span style={{ color: isCritical ? '#991b1b' : '#334155' }}>{note}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Invoice result detail card ─────────────────────────────────────────────────
function InvoiceResultCard({ invoice, onDismiss }: { invoice: Invoice; onDismiss: () => void }) {
  const c = invoice.confidence;
  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)', animation: 'slideIn 0.3s ease',
    }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: invoice.status === 'approved' ? '#f0fdf4' : invoice.status.includes('fraud') ? '#fff1f2' : '#fff7ed',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            Agent Pipeline Result — {invoice.invoice_number}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{invoice.vendor_name}</span>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', fontSize: 18, padding: '4px 8px', borderRadius: 8,
        }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: c ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: 0 }}>
        {/* Agent notes */}
        <div style={{ padding: '16px 20px', borderRight: c ? '1px solid #e2e8f0' : 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b', marginBottom: 10 }}>
            Agent Pipeline Log
          </div>
          <AgentPipeline notes={invoice.agent_notes} />
        </div>

        {/* Confidence scores */}
        {c && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b', marginBottom: 10 }}>
              Agent 1 — OCR Confidence Scores
            </div>
            <ConfidenceBar score={c.overall} label="Overall (Gate: ≥95%)" />
            <ConfidenceBar score={c.vendor_name} label="Vendor Name" />
            <ConfidenceBar score={c.total_amount} label="Total Amount" />
            <ConfidenceBar score={c.invoice_number} label="Invoice Number" />
            <ConfidenceBar score={c.line_items} label="Line Items" />
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 8,
              background: c.overall >= 0.95 ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${c.overall >= 0.95 ? '#bbf7d0' : '#fde68a'}`,
              fontSize: 11, color: c.overall >= 0.95 ? '#166534' : '#92400e', fontWeight: 600,
            }}>
              {c.overall >= 0.95
                ? `✓ Confidence threshold met (${Math.round(c.overall * 100)}% ≥ 95%) — passed to downstream agents`
                : `⚠ Below 95% threshold (${Math.round(c.overall * 100)}%) — diverted to manual review`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form defaults ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  invoice_number: '', vendor_name: '', total_amount: '',
  po_number: '', grn_number: '', vendor_bank_account: '', vendor_routing: '', department: 'Engineering',
};

const DEPARTMENTS = ['Engineering', 'Operations', 'Finance', 'Procurement', 'Infrastructure', 'IT', 'General', 'HR', 'Marketing', 'Legal'];

// ── Invoices Page ─────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchJson<Invoice[]>('/invoices')
      .then(setInvoices)
      .catch(() => setError('Unable to load invoices from backend.'));
  }, []);

  const field = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, fontFamily: 'var(--font-body)', color: '#0f172a', background: '#fff',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 4 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null); setResult(null);
    try {
      const payload = {
        ...form,
        total_amount: parseFloat(form.total_amount) || 0,
        po_number: form.po_number || null,
        grn_number: form.grn_number || null,
        vendor_bank_account: form.vendor_bank_account || null,
        vendor_routing: form.vendor_routing || null,
        line_items: [],
      };
      const created = await postJson<Invoice>('/invoices', payload);
      setResult(created);
      setInvoices(prev => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Agent 1 — Invoice Agent
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Invoice Ingestion &amp; Agent Pipeline
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Submit an invoice to run all 6 agents: OCR confidence → 3-way match → fraud check → budget → routing → payment batch.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          {showForm ? 'Cancel' : 'Submit Invoice'}
        </button>
      </div>

      {/* ── Submit Form ── */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', animation: 'slideIn 0.25s ease' }}>
          <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
              Agents 1–6 will process this invoice automatically upon submission
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>

              {/* Invoice basics */}
              <div>
                <label style={labelStyle}>Invoice Number *</label>
                <input id="inv-number" style={inputStyle} value={form.invoice_number} onChange={field('invoice_number')} placeholder="INV-1234" required
                  onFocus={e => (e.target.style.borderColor = '#6366f1')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
              <div>
                <label style={labelStyle}>Vendor Name *</label>
                <input id="inv-vendor" style={inputStyle} value={form.vendor_name} onChange={field('vendor_name')} placeholder="e.g. TechCorp" required
                  onFocus={e => (e.target.style.borderColor = '#6366f1')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
              <div>
                <label style={labelStyle}>Total Amount (USD) *</label>
                <input id="inv-amount" type="number" min="0" step="0.01" style={inputStyle} value={form.total_amount} onChange={field('total_amount')} placeholder="5000.00" required
                  onFocus={e => (e.target.style.borderColor = '#6366f1')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <select id="inv-dept" style={{ ...inputStyle, cursor: 'pointer' }} value={form.department} onChange={field('department')}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* 3-way match fields */}
              <div>
                <label style={labelStyle}>
                  PO Number &nbsp;
                  <span style={{ color: '#4f46e5', fontWeight: 400, textTransform: 'none' }}>— Agent 2 (3-way match)</span>
                </label>
                <input id="inv-po" style={inputStyle} value={form.po_number} onChange={field('po_number')} placeholder="PO-1042 (try PO-1001 for clean pass)"
                  onFocus={e => (e.target.style.borderColor = '#0891b2')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
              <div>
                <label style={labelStyle}>
                  GRN Number &nbsp;
                  <span style={{ color: '#4f46e5', fontWeight: 400, textTransform: 'none' }}>— Agent 2 (receipt proof)</span>
                </label>
                <input id="inv-grn" style={inputStyle} value={form.grn_number} onChange={field('grn_number')} placeholder="GRN-1028 (leave blank → exception)"
                  onFocus={e => (e.target.style.borderColor = '#0891b2')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>

              {/* Bank auth fields */}
              <div>
                <label style={labelStyle}>
                  Bank Account &nbsp;
                  <span style={{ color: '#dc2626', fontWeight: 400, textTransform: 'none' }}>— Agent 3 (fraud check)</span>
                </label>
                <input id="inv-account" style={inputStyle} value={form.vendor_bank_account} onChange={field('vendor_bank_account')} placeholder="****7711 (last 4 digits)"
                  onFocus={e => (e.target.style.borderColor = '#dc2626')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
              <div>
                <label style={labelStyle}>
                  Routing Number &nbsp;
                  <span style={{ color: '#dc2626', fontWeight: 400, textTransform: 'none' }}>— Agent 3 (fraud check)</span>
                </label>
                <input id="inv-routing" style={inputStyle} value={form.vendor_routing} onChange={field('vendor_routing')} placeholder="021000021"
                  onFocus={e => (e.target.style.borderColor = '#dc2626')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
              </div>
            </div>

            {/* Test scenarios hint */}
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
              <strong>Test scenarios:</strong> &nbsp;
              Vendor: &quot;Acme Supplies&quot; | PO: PO-1001 | GRN: GRN-1028 | Account: ****7711 | Routing: 021000021 | Dept: Procurement | Amount: $1450 → <strong style={{ color: '#166534' }}>Full clean pass</strong> &nbsp;|&nbsp;
              Leave GRN blank → <strong style={{ color: '#991b1b' }}>exception_grn</strong> &nbsp;|&nbsp;
              Change routing → <strong style={{ color: '#991b1b' }}>exception_fraud</strong>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 18px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#475569', fontFamily: 'var(--font-body)' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ padding: '9px 22px', background: submitting ? '#a5b4fc' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}>
                {submitting ? (
                  <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Running agents…</>
                ) : 'Run Agent Pipeline →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Agent Pipeline Result ── */}
      {result && <InvoiceResultCard invoice={result} onDismiss={() => setResult(null)} />}

      {/* ── Invoice Table ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Invoice Register</h3>
            <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{invoices.length}</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>All captured &amp; processed invoices</p>
        </div>

        {invoices.length === 0 ? (
          <p style={{ padding: '32px 24px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            No invoices yet. Submit your first invoice above to run the agent pipeline.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Invoice', 'Vendor', 'Dept', 'Amount', 'Confidence', 'PO / GRN', 'Status', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '11px 16px', color: '#334155' }}>{inv.vendor_name}</td>
                    <td style={{ padding: '11px 16px', color: '#64748b', fontSize: 12 }}>{inv.department}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#0f172a' }}>${inv.total_amount.toLocaleString()}</td>
                    <td style={{ padding: '11px 16px' }}>
                      {inv.confidence ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: inv.confidence.overall >= 0.95 ? '#16a34a' : '#d97706' }}>
                          {Math.round(inv.confidence.overall * 100)}%
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 11, color: '#64748b' }}>
                      {inv.po_number && <div>PO: {inv.po_number}</div>}
                      {inv.grn_number ? <div style={{ color: '#16a34a' }}>GRN: {inv.grn_number} ✓</div> : <div style={{ color: '#dc2626' }}>No GRN</div>}
                    </td>
                    <td style={{ padding: '11px 16px' }}><StatusBadge status={inv.status} /></td>
                    <td style={{ padding: '11px 16px', fontSize: 11, color: '#64748b', maxWidth: 240 }}>
                      {inv.agent_notes.length > 0 && (
                        <span title={inv.agent_notes.join('\n')} style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                          {inv.agent_notes.length} agent step{inv.agent_notes.length !== 1 ? 's' : ''} (hover)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
