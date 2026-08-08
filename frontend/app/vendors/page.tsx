'use client';

import { useEffect, useState } from 'react';

import { getApiBaseUrl } from '../../lib/api';

const getAPI = () => getApiBaseUrl();

type Vendor = {
  id: string;
  name: string;
  category: string;
  payment_terms: string;
  compliance_status: string;
  tax_id: string | null;
  email: string | null;
};

function complianceBadge(status: string) {
  if (status === 'Verified W-9') return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
  if (status.includes('Expiring')) return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', payment_terms: 'Net 30', tax_id: '', email: '' });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vendorflow-token');
    fetch(`${getAPI()}/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setVendors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.tax_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('vendorflow-token');
    const res = await fetch(`${getAPI()}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setMsg('Could not add vendor.'); return; }
    const created: Vendor = await res.json();
    setVendors(cur => [created, ...cur]);
    setMsg(`Vendor "${created.name}" added successfully.`);
    setShowForm(false);
    setForm({ name: '', category: '', payment_terms: 'Net 30', tax_id: '', email: '' });
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: '#0f172a' }}>
          Vendor Master Directory
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', background: '#4f46e5', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: 12 }}></i> Add New Vendor
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Add vendor form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 18 }}>New Vendor</h3>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {([
              { key: 'name', label: 'Vendor Name', placeholder: 'e.g. Acme Corp' },
              { key: 'category', label: 'Category', placeholder: 'e.g. Software & Cloud' },
              { key: 'payment_terms', label: 'Payment Terms', placeholder: 'Net 30' },
              { key: 'tax_id', label: 'Tax ID', placeholder: '12-3456789' },
              { key: 'email', label: 'AP Email', placeholder: 'ap@vendor.com' },
            ] as { key: keyof typeof form; label: string; placeholder: string }[]).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {f.label}
                </label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(cur => ({ ...cur, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.key === 'name' || f.key === 'category'}
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    color: '#0f172a', background: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#475569', fontFamily: 'var(--font-body)' }}>
                Cancel
              </button>
              <button type="submit"
                style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Add Vendor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor table card */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 12 }}></i>
            <input
              type="text"
              placeholder="Search vendors by name, tax ID, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 12, fontFamily: 'var(--font-body)', color: '#0f172a',
                background: '#fff', outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {filtered.length} active vendor{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Vendor Name', 'Category', 'Payment Terms', 'Compliance Status'].map((h) => (
                <th key={h} style={{
                  padding: '12px 20px', fontSize: 11, fontWeight: 600,
                  color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderBottom: '1px solid #f1f5f9',
                  textAlign: 'left',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(vendor => {
              const badge = complianceBadge(vendor.compliance_status);
              return (
                <tr
                  key={vendor.id}
                  style={{ borderTop: '1px solid #f8fafc', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>{vendor.name}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{vendor.category}</td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>{vendor.payment_terms}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999,
                      background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {vendor.compliance_status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No vendors match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
