'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    iconClass: 'fa-solid fa-chart-pie' },
  { href: '/analytics',  label: 'Analytics',     iconClass: 'fa-solid fa-chart-line' },
  { href: '/vendors',    label: 'Vendor Master', iconClass: 'fa-solid fa-address-book' },
  { href: '/settings',   label: 'Settings',      iconClass: 'fa-solid fa-gear' },
];

function CenteredCard({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 48px', textAlign: 'center', boxShadow: 'var(--shadow-lg)', maxWidth: 380 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Work Clat</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>{heading}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/dashboard';
  const router   = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth,  setCheckingAuth]  = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('vendorflow-token') : null;
    const isPublicRoute = pathname === '/' || pathname === '/login';
    if (isPublicRoute) { setAuthenticated(false); setCheckingAuth(false); return; }
    if (!token) { router.replace('/login'); setAuthenticated(false); setCheckingAuth(false); return; }
    setAuthenticated(true);
    setCheckingAuth(false);
  }, [pathname, router]);

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const currentLabel = useMemo(() => navItems.find(i => i.href === pathname)?.label ?? 'Workspace', [pathname]);
  const isPublicRoute = pathname === '/' || pathname === '/login';

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('vendorflow-token');
      window.localStorage.removeItem('vendorflow-role');
      window.localStorage.removeItem('vendorflow-name');
    }
    router.replace('/login');
  };

  if (checkingAuth && !isPublicRoute) return <CenteredCard heading="Preparing your workspace…" sub="Redirecting into the Work Clat workspace." />;
  if (isPublicRoute) return <>{children}</>;
  if (!authenticated) return <CenteredCard heading="Redirecting to sign in" sub="Your workspace will appear as soon as access is restored." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── TOP HEADER ── */}
      <header style={{
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 20,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}>

        {/* Left: Brand + Hamburger stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, marginRight: 12, minWidth: 100 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#1a2e4a',
            fontFamily: 'var(--font-body)',
            lineHeight: 1,
          }}>
            Work Clat
          </span>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle navigation"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              lineHeight: 1,
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: sidebarOpen ? '#4f46e5' : '#64748b', borderRadius: 2, transition: 'background 0.2s' }} />
            <span style={{ display: 'block', width: 16, height: 2, background: sidebarOpen ? '#4f46e5' : '#64748b', borderRadius: 2, transition: 'background 0.2s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: sidebarOpen ? '#4f46e5' : '#64748b', borderRadius: 2, transition: 'background 0.2s' }} />
          </button>
        </div>

        {/* Page title */}
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20, marginRight: 'auto' }}>
          <p style={{ fontSize: 10, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 1 }}>Operations center</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{currentLabel}</h1>
        </div>

        {/* Global search */}
        <div style={{ position: 'relative', width: 340, flexShrink: 0 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}></i>
          <input
            type="text"
            placeholder="Lookup any PO or Invoice #..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 13, color: '#1c1917', fontFamily: 'var(--font-body)', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
          />
        </div>
      </header>

      {/* ── SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 45,
              background: 'rgba(15,23,42,0.35)',
              backdropFilter: 'blur(1px)',
            }}
          />

          {/* Sidebar drawer */}
          <aside style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: 256,
            background: 'var(--accent)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '4px 0 24px rgba(26,46,74,0.25)',
            overflowY: 'auto',
          }}>

            {/* Brand */}
            <div>
              <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 10 }}>
                <i className="fa-solid fa-bolt" style={{ color: '#818cf8', fontSize: 16 }}></i>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>Work Clat</span>
              </div>

              {/* Nav */}
              <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 8,
                        fontSize: 14, fontWeight: 500, textDecoration: 'none',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                        background: isActive ? '#4f46e5' : 'transparent',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.9)'; } }}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'; } }}
                    >
                      <i className={item.iconClass} style={{ width: 20, textAlign: 'center', fontSize: 14, opacity: isActive ? 1 : 0.65 }}></i>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom */}
            <div style={{ padding: '14px 12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Autopilot */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                  <p style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>Autopilot active</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.42)', lineHeight: 1.5, fontSize: 11 }}>Invoice extraction and routing are running.</p>
              </div>

              {/* Help */}
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              >
                <i className="fa-regular fa-circle-question"></i> Help / Support
              </button>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 16px', background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.12)')}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── PAGE CONTENT ── */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
