'use client';

import { useState } from 'react';

type ToleranceSettings = {
  priceVariancePct: number;
  quantityDiscrepancy: number;
};

type NotificationSettings = {
  slackOnExceptions: boolean;
  dailyBatchEmail: boolean;
  complianceExpiryWarning: boolean;
};

export default function SettingsPage() {
  const [tolerance, setTolerance] = useState<ToleranceSettings>({
    priceVariancePct: 5,
    quantityDiscrepancy: 0,
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    slackOnExceptions: true,
    dailyBatchEmail: true,
    complianceExpiryWarning: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, fontFamily: 'var(--font-body)',
    color: '#0f172a', background: '#f8fafc', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: '#0f172a' }}>
          Application Settings
        </h2>
        <button
          onClick={handleSave}
          style={{
            padding: '9px 20px', background: '#4f46e5', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
        >
          Save Changes
        </button>
      </div>

      {saved && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 13 }}>
          ✓ Settings saved successfully.
        </div>
      )}

      {/* Settings panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

        {/* AI Match Tolerance */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-robot" style={{ color: '#4f46e5' }}></i> AI Match Tolerance
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Configure allowable threshold boundaries before flagging invoice line item exceptions.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Max Price Variance Tolerance (%)
              </label>
              <input
                type="number"
                value={tolerance.priceVariancePct}
                min={0} max={100}
                onChange={e => setTolerance(t => ({ ...t, priceVariancePct: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#4f46e5')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                Currently: invoices &gt;{tolerance.priceVariancePct}% above PO price are flagged
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Max Quantity Discrepancy
              </label>
              <input
                type="number"
                value={tolerance.quantityDiscrepancy}
                min={0}
                onChange={e => setTolerance(t => ({ ...t, quantityDiscrepancy: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#4f46e5')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-bell" style={{ color: '#4f46e5' }}></i> Notifications &amp; Alerts
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Manage automated Slack, Teams, and Email routing preferences.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              { key: 'slackOnExceptions',     label: 'Slack Alert on Spiked Exceptions' },
              { key: 'dailyBatchEmail',       label: 'Daily Treasury Batch Summary Email' },
              { key: 'complianceExpiryWarning', label: 'Vendor Compliance Expiry Warning' },
            ] as { key: keyof NotificationSettings; label: string }[]).map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={e => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ERP Integration */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-network-wired" style={{ color: '#4f46e5' }}></i> ERP Integration
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Connected database pipeline and synchronization details.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Connected System', value: 'SAP S/4HANA', valueColor: '#0f172a' },
              { label: 'Sync Status',      value: 'Active (Live)', valueColor: '#059669' },
              { label: 'Last Synced',      value: '2 mins ago',   valueColor: '#0f172a' },
              { label: 'API Version',      value: 'v4.8.1',       valueColor: '#0f172a' },
              { label: 'Environment',      value: 'Production',    valueColor: '#0f172a' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13,
              }}>
                <span style={{ color: '#64748b' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: row.valueColor }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button style={{
            marginTop: 4, padding: '8px 14px', background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12,
            fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
          >
            <i className="fa-solid fa-rotate" style={{ marginRight: 6 }}></i>
            Force Sync Now
          </button>
        </div>

      </div>

      {/* Workflow agents status */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 18 }}>
          Work Clat Agent Pipeline Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { name: 'Invoice Agent',   desc: 'Ingestion & Extraction (95% confidence threshold)', status: 'Running' },
            { name: 'Validation Agent',desc: '3-Way Match against PO & GRN', status: 'Running' },
            { name: 'Fraud Agent',     desc: 'Duplicate detection & bank validation', status: 'Running' },
            { name: 'Budget Agent',    desc: 'Department budget & variance check', status: 'Running' },
            { name: 'Approval Agent',  desc: 'Exception routing to department heads', status: 'Idle' },
            { name: 'Payment Agent',   desc: 'Batch aggregation — awaiting human release', status: 'Standby' },
          ].map(agent => (
            <div key={agent.name} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{agent.name}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                  background: agent.status === 'Running' ? '#dcfce7' : agent.status === 'Idle' ? '#fef3c7' : '#f1f5f9',
                  color: agent.status === 'Running' ? '#166534' : agent.status === 'Idle' ? '#92400e' : '#64748b',
                }}>
                  {agent.status}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
