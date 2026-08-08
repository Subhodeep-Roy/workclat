'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Approval = {
  id: string;
  invoice_id: string;
  approver_id: string;
  decision: string;
  reason: string | null;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vendorflow-token');
    fetch(`${API_BASE_URL}/approvals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((response) => {
        if (!response.ok) throw new Error('Not ok');
        return response.json();
      })
      .then((data) => setApprovals(Array.isArray(data) ? data : []))
      .catch(() => setMessage('Unable to load approvals.'));
  }, []);

  const submitDecision = async (approvalId: string, decision: string) => {
    const token = localStorage.getItem('vendorflow-token');
    const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}/decision`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ decision, reason: `${decision} via workspace UI` }),
    });

    if (!response.ok) {
      setMessage('The decision could not be saved.');
      return;
    }

    const updated = await response.json();
    setApprovals((current) => current.map((item) => (item.id === approvalId ? updated : item)));
    setMessage(`Decision saved as ${updated.decision}.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '22px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Approval routing</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>
          Workflow decisions for the next review window
        </h2>

        {message && (
          <p style={{
            marginBottom: 16,
            fontSize: 13,
            color: message.includes('saved') ? 'var(--success)' : '#dc2626',
            background: message.includes('saved') ? 'var(--success-soft)' : '#fef2f2',
            border: `1px solid ${message.includes('saved') ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 6,
            padding: '8px 12px',
          }}>
            {message}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {approvals.length === 0 && !message && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No approvals in queue.</p>
          )}
          {approvals.map((approval) => (
            <div key={approval.id} style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--bg)',
              padding: '12px 16px',
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{approval.id}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Invoice {approval.invoice_id} • {approval.approver_id}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '3px 10px',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}>
                  {approval.decision}
                </span>
                <button
                  onClick={() => submitDecision(approval.id, 'approved')}
                  style={{
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                    border: '1px solid #bbf7d0',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => submitDecision(approval.id, 'rejected')}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

