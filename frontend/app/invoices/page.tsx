'use client';

import { useEffect, useState } from 'react';
import { fetchJson, type Invoice } from '../../lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<Invoice[]>('/invoices')
      .then((data) => setInvoices(data))
      .catch(() => setError('Unable to load invoice data from the backend.'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '22px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Invoice register</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
              Captured and routed invoices
            </h2>
          </div>
          <button style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: '1px solid #bfdbfe',
            borderRadius: 20,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            Import batch
          </button>
        </div>

        {error ? (
          <p style={{ marginTop: 16, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px' }}>{error}</p>
        ) : invoices.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No invoices yet. Create one from the Dashboard.</p>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                  {['Invoice', 'Vendor', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, i) => (
                  <tr key={invoice.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>{invoice.invoice_number}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{invoice.vendor_name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>${invoice.total_amount.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        {invoice.status}
                      </span>
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

