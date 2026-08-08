'use client';

import { useEffect, useState } from 'react';
import { fetchJson, postJson, getApiBaseUrl, type PaymentBatch } from '../../lib/api';

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const s =
    status === 'released' ? { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', label: '✓ Released' } :
    status === 'cancelled' ? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'Cancelled' } :
    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '⏳ Ready for Release' };
  return (
    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

export default function PaymentsPage() {
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const load = () =>
    fetchJson<PaymentBatch[]>('/payments')
      .then(d => { setBatches(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { showToast('Unable to load payment batches.', false); setLoading(false); });

  useEffect(() => { load(); }, []);

  const prepareBatch = async () => {
    setPreparing(true);
    try {
      const batch = await postJson<PaymentBatch>('/payments/prepare', {});
      setBatches(prev => [batch, ...prev]);
      setExpandedBatch(batch.id);
      showToast(`✓ Batch ${batch.id} compiled — ${batch.invoice_count} invoice(s) totalling ${fmt(batch.total_amount)} ready for Controller review.`, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to prepare batch.', false);
    } finally {
      setPreparing(false);
    }
  };

  const releaseBatch = async (batchId: string) => {
    setReleasing(batchId);
    try {
      const updated = await postJson<PaymentBatch>(`/payments/${batchId}/release`, {
        confirmed: true,
        controller_note: 'Reviewed and authorized by Controller via workspace UI.',
      });
      setBatches(prev => prev.map(b => b.id === batchId ? updated : b));
      showToast(`✓ Batch ${batchId} released to Treasury — ${fmt(updated.total_amount)} authorized.`, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Release failed.', false);
    } finally {
      setReleasing(null);
    }
  };

  const cancelBatch = async (batchId: string) => {
    try {
      const resp = await fetch(`${getApiBaseUrl()}/payments/${batchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('vendorflow-token') : ''}` },
      });
      if (!resp.ok) throw new Error('Cancel failed');
      const updated: PaymentBatch = await resp.json();
      setBatches(prev => prev.map(b => b.id === batchId ? updated : b));
      showToast(`Batch ${batchId} cancelled.`, false);
    } catch {
      showToast('Failed to cancel batch.', false);
    }
  };

  const pendingBatches  = batches.filter(b => b.status === 'ready_for_release');
  const releasedBatches = batches.filter(b => b.status === 'released');
  const cancelledBatches = batches.filter(b => b.status === 'cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 100,
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          maxWidth: 400,
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
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Agent 6 — Payment Agent
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Batch Payment Preparation
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', maxWidth: 560 }}>
            Agent 6 never executes a wire transfer autonomously. It aggregates all fully-validated invoices into a review batch.
            A human Controller reviews the batch and clicks <strong>Release to Treasury</strong> to authorize payment.
          </p>
          {/* Security notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 11, color: '#6b21a8' }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span><strong>Security Fix enforced:</strong> No automated wire transfer. Human Controller authorization required before any funds move.</span>
          </div>
        </div>

        {/* KPI pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 160 }}>
          <button
            onClick={prepareBatch}
            disabled={preparing}
            style={{
              padding: '10px 18px', background: preparing ? '#a5b4fc' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: preparing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.15s', whiteSpace: 'nowrap' as const,
            }}
            onMouseEnter={e => { if (!preparing) (e.currentTarget as HTMLButtonElement).style.background = '#4338ca'; }}
            onMouseLeave={e => { if (!preparing) (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5'; }}
          >
            {preparing ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Compiling…</>
            ) : '⚡ Prepare Batch'}
          </button>
          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
            Collects all approved invoices
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Pending Release', val: pendingBatches.length, sub: `${pendingBatches.reduce((s, b) => s + b.total_amount, 0) > 0 ? fmt(pendingBatches.reduce((s, b) => s + b.total_amount, 0)) : '$0'} on hold`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Released to Treasury', val: releasedBatches.length, sub: releasedBatches.length > 0 ? `${fmt(releasedBatches.reduce((s, b) => s + b.total_amount, 0))} authorized` : 'No releases yet', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Total Batches', val: batches.length, sub: `${batches.reduce((s, b) => s + b.invoice_count, 0)} invoices processed`, color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Pending batches */}
      {pendingBatches.length > 0 && (
        <div style={{ background: '#fff', border: '2px solid #fde68a', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(217,119,6,0.10)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #fef3c7', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#92400e' }}>Awaiting Controller Authorization</h3>
              <span style={{ padding: '2px 8px', background: '#fde68a', color: '#78350f', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{pendingBatches.length}</span>
            </div>
            <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Human review required</span>
          </div>

          {pendingBatches.map(batch => (
            <div key={batch.id} style={{ borderTop: '1px solid #fef3c7' }}>
              {/* Batch header row */}
              <div
                onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{batch.id}</span>
                    <StatusBadge status={batch.status} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                    {batch.invoice_count} invoice(s) &nbsp;·&nbsp; Compiled {new Date(batch.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{fmt(batch.total_amount)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total authorized amount</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{expandedBatch === batch.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded batch detail */}
              {expandedBatch === batch.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px dashed #fde68a', background: '#fffbeb' }}>
                  {/* Agent 6 notes */}
                  <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {batch.notes.map((note, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#78350f', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.6 }}>
                        <span style={{ color: '#7c3aed', fontWeight: 800, flexShrink: 0 }}>›</span>{note}
                      </div>
                    ))}
                  </div>

                  {/* Invoice items table */}
                  {batch.items.length > 0 && (
                    <div style={{ borderRadius: 10, border: '1px solid #fde68a', overflow: 'hidden', marginBottom: 14 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#fef3c7' }}>
                            {['Invoice', 'Vendor', 'Dept', 'Amount', 'Bank (masked)', 'Routing'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400e', textAlign: 'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {batch.items.map(item => (
                            <tr key={item.invoice_id} style={{ borderTop: '1px solid #fef3c7', background: '#fff' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{item.invoice_number}</td>
                              <td style={{ padding: '8px 12px', color: '#334155' }}>{item.vendor_name}</td>
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>{item.department}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>${item.total_amount.toLocaleString()}</td>
                              <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>{item.bank_account ?? '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>{item.routing ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#fef3c7' }}>
                            <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11, color: '#92400e' }}>TOTAL</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{fmt(batch.total_amount)}</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => cancelBatch(batch.id)}
                      style={{ padding: '9px 18px', border: '1px solid #e2e8f0', color: '#64748b', background: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      Cancel Batch
                    </button>
                    <button
                      onClick={() => releaseBatch(batch.id)}
                      disabled={releasing === batch.id}
                      style={{ padding: '9px 24px', background: releasing === batch.id ? '#a7f3d0' : '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: releasing === batch.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(5,150,105,0.30)', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (releasing !== batch.id) (e.currentTarget as HTMLButtonElement).style.background = '#047857'; }}
                      onMouseLeave={e => { if (releasing !== batch.id) (e.currentTarget as HTMLButtonElement).style.background = '#059669'; }}
                    >
                      {releasing === batch.id ? (
                        <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Releasing…</>
                      ) : `🏦 Release ${fmt(batch.total_amount)} to Treasury`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && batches.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '48px 32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No payment batches yet</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto 20px' }}>
            Submit and approve some invoices first, then click <strong>Prepare Batch</strong> to compile them for Treasury release.
          </p>
          <button onClick={prepareBatch} disabled={preparing}
            style={{ padding: '10px 22px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ⚡ Prepare Batch Now
          </button>
        </div>
      )}

      {/* Released history */}
      {releasedBatches.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #dbeafe', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1e40af' }}>Released to Treasury</h3>
            <span style={{ padding: '2px 8px', background: '#bfdbfe', color: '#1e3a8a', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>{releasedBatches.length}</span>
          </div>
          {releasedBatches.map(batch => (
            <div key={batch.id} style={{ padding: '14px 20px', borderTop: '1px solid #f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{batch.id}</span>
                  <StatusBadge status="released" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{fmt(batch.total_amount)}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {batch.invoice_count} invoice(s) &nbsp;·&nbsp; Released by {batch.released_by} &nbsp;·&nbsp; {batch.released_at ? new Date(batch.released_at).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
