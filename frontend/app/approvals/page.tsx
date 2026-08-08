'use client';

import { useEffect, useState } from 'react';
import { fetchJson, postJson, type Approval } from '../../lib/api';

const EXCEPTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  exception_price:  { label: 'Price Variance',  color: '#92400e', bg: '#fffbeb', border: '#fde68a', icon: '💰' },
  exception_grn:    { label: 'Missing GRN',     color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: '📦' },
  exception_tax:    { label: 'Tax Mismatch',    color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: '🧾' },
  exception_fraud:  { label: 'Fraud Alert',     color: '#7f1d1d', bg: '#fff1f2', border: '#fca5a5', icon: '🚨' },
  exception_budget: { label: 'Budget Overrun',  color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: '⚠️' },
  exception_po:     { label: 'PO Not Found',    color: '#1e3a5f', bg: '#eff6ff', border: '#bfdbfe', icon: '📋' },
  manual_review:    { label: 'Manual Review',   color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', icon: '🔍' },
};

const DECISION_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  pending:  { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  approved: { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  rejected: { color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
};

function fmt(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchJson<Approval[]>('/approvals')
      .then(data => { setApprovals(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { showToast('Unable to load approvals from backend.', false); setLoading(false); });
  }, []);

  const submitDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    setProcessing(approvalId);
    try {
      const updated = await postJson<Approval>(`/approvals/${approvalId}/decision`, {
        decision,
        reason: `${decision === 'approved' ? 'Approved' : 'Rejected'} by department head via workspace`,
      });
      setApprovals(cur => cur.map(a => a.id === approvalId ? updated : a));
      showToast(`Decision saved: ${updated.decision.toUpperCase()} — ${approvalId}`, decision === 'approved');
    } catch {
      showToast('Failed to save decision. Please try again.', false);
    } finally {
      setProcessing(null);
    }
  };

  const pending  = approvals.filter(a => a.decision === 'pending');
  const resolved = approvals.filter(a => a.decision !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 100,
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.ok ? '#bbf7d0' : '#fecaca'}`,
          color: toast.ok ? '#166534' : '#991b1b',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.25s ease',
        }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Agent 5 — Approval Agent
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Exception Routing &amp; Workflow Decisions
        </h2>
        <p style={{ fontSize: 12, color: '#64748b' }}>
          Clean invoices bypass this queue entirely. Only invoices flagged by Agents 2–4 appear here — packaged with full exception context for department-head resolution.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[
            { label: 'Pending Review', val: pending.length, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Resolved', val: resolved.length, color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Total', val: approvals.length, color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 16px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending queue */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Pending Decisions</h3>
          <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{pending.length}</span>
        </div>

        {loading && <p style={{ padding: '24px 20px', fontSize: 13, color: '#94a3b8' }}>Loading approvals…</p>}

        {!loading && pending.length === 0 && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>All clear — no pending exceptions</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Submit an invoice with a missing GRN or price variance to trigger the approval workflow.</p>
          </div>
        )}

        {pending.map(approval => {
          const exc = EXCEPTION_CONFIG[approval.exception_type ?? ''] ?? { label: approval.exception_type ?? 'Exception', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0', icon: '⚠️' };
          const isExpanded = expanded === approval.id;
          const isProcessing = processing === approval.id;

          return (
            <div key={approval.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              {/* Main row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : approval.id)}
                style={{ padding: '16px 20px', cursor: 'pointer', transition: 'background 0.12s', background: isExpanded ? '#f8fafc' : '#fff' }}
                onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: exc.bg, border: `1px solid ${exc.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {exc.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                          Invoice {approval.invoice_id}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          color: exc.color, background: exc.bg, border: `1px solid ${exc.border}`,
                        }}>
                          {exc.icon} {exc.label}
                        </span>
                        {approval.invoice_amount && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(approval.invoice_amount)}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Routed to: <span style={{ color: '#475569', fontWeight: 600 }}>{approval.approver_id}</span>
                        {approval.department && <> &nbsp;·&nbsp; Dept: <span style={{ color: '#475569', fontWeight: 600 }}>{approval.department}</span></>}
                        &nbsp;·&nbsp; {new Date(approval.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'} Details</span>
                  </div>
                </div>
              </div>

              {/* Expanded context + actions */}
              {isExpanded && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px dashed #e2e8f0', background: '#f8fafc' }}>
                  {/* Exception context */}
                  {approval.exception_context && (
                    <div style={{
                      margin: '14px 0', padding: '12px 16px',
                      background: exc.bg, border: `1px solid ${exc.border}`,
                      borderRadius: 10, fontSize: 12, color: exc.color, lineHeight: 1.7,
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 Agent 5 Exception Context</div>
                      {approval.exception_context}
                    </div>
                  )}

                  {/* 3-way match summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
                    {[
                      { title: 'Invoice Data', icon: '🧾', items: [`ID: ${approval.invoice_id}`, `Amount: ${fmt(approval.invoice_amount)}`] },
                      { title: 'Exception Type', icon: '⚠️', items: [`Type: ${approval.exception_type ?? '—'}`, `Dept: ${approval.department ?? '—'}`] },
                      { title: 'Routed To', icon: '👤', items: [`Approver: ${approval.approver_id}`, `Status: PENDING`] },
                    ].map(card => (
                      <div key={card.title} style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>{card.icon} {card.title}</div>
                        {card.items.map(it => <div key={it} style={{ color: '#64748b', lineHeight: 1.6 }}>{it}</div>)}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={e => { e.stopPropagation(); submitDecision(approval.id, 'rejected'); }}
                      disabled={isProcessing}
                      style={{ padding: '8px 18px', border: '1px solid #dc2626', color: '#dc2626', background: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      Reject / Return to Vendor
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); submitDecision(approval.id, 'approved'); }}
                      disabled={isProcessing}
                      style={{ padding: '8px 18px', background: isProcessing ? '#a7f3d0' : '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={e => { if (!isProcessing) (e.currentTarget as HTMLButtonElement).style.background = '#047857'; }}
                      onMouseLeave={e => { if (!isProcessing) (e.currentTarget as HTMLButtonElement).style.background = '#059669'; }}
                    >
                      {isProcessing ? (
                        <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Saving…</>
                      ) : '✓ Approve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resolved section */}
      {resolved.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Resolved</h3>
            <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{resolved.length}</span>
          </div>
          {resolved.map(approval => {
            const ds = DECISION_STYLE[approval.decision] ?? DECISION_STYLE.rejected;
            const exc = EXCEPTION_CONFIG[approval.exception_type ?? ''];
            return (
              <div key={approval.id} style={{ padding: '12px 20px', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Invoice {approval.invoice_id}</span>
                    {exc && <span style={{ fontSize: 10, color: exc.color }}>{exc.icon} {exc.label}</span>}
                    {approval.invoice_amount && <span style={{ fontSize: 12, color: '#475569' }}>{fmt(approval.invoice_amount)}</span>}
                  </div>
                  {approval.reason && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{approval.reason}</div>}
                  {approval.decided_at && <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>Decided: {new Date(approval.decided_at).toLocaleString()}</div>}
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: ds.color, background: ds.bg, border: `1px solid ${ds.border}`, textTransform: 'uppercase' as const }}>
                  {approval.decision}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
