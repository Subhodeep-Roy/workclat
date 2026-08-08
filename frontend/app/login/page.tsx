'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './login.css'; // We'll add this for responsive styles if needed, or just use inline styles if sufficient. Let's just use inline and global css.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const features = ['AI invoice review', 'Live approval routing', 'Anomaly detection', 'Vendor management'];

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ name: '', email: 'admin@vendorflow.ai', password: 'password123' });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = isSignUp ? '/auth/register' : '/auth/login';
    const payload = isSignUp ? form : { email: form.email, password: form.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.detail || `${isSignUp ? 'Registration' : 'Login'} failed. Please check your details.`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('vendorflow-token', data.access_token);
      localStorage.setItem('vendorflow-role', data.role);
      localStorage.setItem('vendorflow-name', data.name ?? 'Admin User');
      router.push('/dashboard');
    } catch (err) {
      setMessage('Network error. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div className="login-container" style={{
        width: '100%',
        maxWidth: 920,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>

        {/* Left panel — deep navy */}
        <div style={{
          background: 'var(--accent)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
              Work Clat
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 700, lineHeight: 1.25, color: '#ffffff', marginBottom: 16 }}>
              {isSignUp ? 'Join the future of finance.' : 'Welcome back to your finance workspace.'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>
              Streamline approvals, spot anomalies instantly, and keep every vendor payment moving without friction.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, position: 'relative' }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14, width: 18, textAlign: 'center' }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel (form) */}
        <div style={{ padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>
            {isSignUp ? 'Get Started' : 'Demo sign in'}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {isSignUp ? 'Create your account' : 'Access the portal'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 30, lineHeight: 1.6 }}>
            {isSignUp ? 'Sign up to start automating your invoices.' : 'Use the demo credentials below to explore the workspace.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSignUp && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Full Name</label>
                <input
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
              <input
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              <input
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%',
                background: loading ? '#8ca5c4' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                padding: '13px 0',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.03em',
                transition: 'background 0.2s',
              }}
            >
              {loading 
                ? (isSignUp ? 'Creating account…' : 'Signing in…') 
                : (isSignUp ? 'Create account →' : 'Continue to workspace →')}
            </button>
          </form>

          {message && (
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 7, padding: '10px 14px' }}>
              {message}
            </p>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
                // clear form if switching to signup, reset demo if switching to sign in
                if (!isSignUp) {
                    setForm({ name: '', email: '', password: '' });
                } else {
                    setForm({ name: '', email: 'admin@vendorflow.ai', password: 'password123' });
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'var(--font-body)'
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
