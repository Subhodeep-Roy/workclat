'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── data ─── */
const metrics = [
  { value: '87%', label: 'Invoice automation rate' },
  { value: '4.2×', label: 'Faster approval cycles' },
  { value: '$2.4M', label: 'Avg. monthly AP processed' },
  { value: '99.1%', label: 'Three-way match accuracy' },
];

const steps = [
  {
    num: '01',
    title: 'Capture & Extract',
    desc: 'Drag-drop or email invoices. Our OCR pipeline pulls every line item, tax code, and vendor ID in seconds.',
    icon: '📥',
  },
  {
    num: '02',
    title: 'Validate & Match',
    desc: 'Automatic three-way match against your PO and GRN data. Price variances, missing receipts, and tax mismatches are flagged instantly.',
    icon: '🔍',
  },
  {
    num: '03',
    title: 'Resolve Exceptions',
    desc: 'Reviewers get a side-by-side diff of invoice vs PO. Force-approve, reject, or reroute — all from one screen.',
    icon: '⚡',
  },
  {
    num: '04',
    title: 'Approve & Release',
    desc: 'Batch-authorize cleared invoices and send directly to treasury. Full audit trail retained for every decision.',
    icon: '✅',
  },
];

/* ─── Intersection-observer hook for scroll reveal ─── */
function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Mock dashboard preview card ─── */
function DashPreview() {
  const rows = [
    { vendor: 'Acme Corp', inv: 'INV-1042', amt: '$12,400', status: 'exception', label: 'Price Variance' },
    { vendor: 'Stripe Inc', inv: 'INV-2091', amt: '$3,800', status: 'approved', label: 'Cleared' },
    { vendor: 'AWS', inv: 'INV-3310', amt: '$8,150', status: 'approved', label: 'Cleared' },
    { vendor: 'Notion', inv: 'INV-1875', amt: '$540', status: 'exception', label: 'Missing GRN' },
  ];
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e2e8f0',
      boxShadow: '0 20px 60px rgba(26,46,74,0.13)',
      overflow: 'hidden',
      width: '100%',
      fontFamily: 'var(--font-body)',
    }}>
      {/* mini header bar */}
      <div style={{ background: '#1a2e4a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        <span style={{ marginLeft: 12, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Work Clat — AP Dashboard</span>
      </div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#f1f5f9' }}>
        {[['$24,890', 'Pending AP'], ['2 Exceptions', 'Needs Review'], ['$12,350', 'Ready to Release']].map(([v, l]) => (
          <div key={l} style={{ background: '#fff', padding: '12px 14px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{v}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* invoice rows */}
      <div>
        {rows.map(r => (
          <div key={r.inv} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{r.vendor}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.inv}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{r.amt}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: r.status === 'exception' ? '#fef2f2' : '#f0fdf4',
                color: r.status === 'exception' ? '#dc2626' : '#166534',
                border: `1px solid ${r.status === 'exception' ? '#fecaca' : '#bbf7d0'}`,
              }}>{r.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Timeline step ─── */
function Step({ step, idx, total }: { step: typeof steps[0]; idx: number; total: number }) {
  const { ref, visible } = useVisible(0.2);
  return (
    <div ref={ref} style={{
      display: 'flex', gap: 24, alignItems: 'flex-start',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.5s ease ${idx * 0.12}s, transform 0.5s ease ${idx * 0.12}s`,
    }}>
      {/* left: number + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: visible ? '#1a2e4a' : '#e2e8f0',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
          transition: `background 0.4s ease ${idx * 0.12 + 0.2}s`,
          boxShadow: visible ? '0 4px 14px rgba(26,46,74,0.25)' : 'none',
          flexShrink: 0,
        }}>
          {step.num}
        </div>
        {idx < total - 1 && (
          <div style={{
            width: 2, flex: 1, minHeight: 40,
            background: visible ? '#dedad3' : 'transparent',
            margin: '6px 0',
            transition: `background 0.4s ease ${idx * 0.12 + 0.4}s`,
          }} />
        )}
      </div>
      {/* right: content */}
      <div style={{ paddingBottom: idx < total - 1 ? 32 : 0 }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>{step.icon}</div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 420 }}>
          {step.desc}
        </p>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function HomePage() {
  const { ref: metricsRef, visible: metricsVisible } = useVisible(0.2);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* ── Sticky Nav ── */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(245,243,238,0.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.jpeg" alt="DBMS" style={{ height: 26, borderRadius: 4, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              Work Clat
            </span>
          </div>
          {/* Links */}
          <div style={{ display: 'none' }} className="nav-links-desktop" />
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/login" style={{
              fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
              padding: '7px 18px', borderRadius: 8, border: '1px solid var(--border)',
              textDecoration: 'none', background: 'var(--surface)',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >Sign in</a>
            <a href="/login?mode=signup" className="btn-primary" style={{ padding: '7px 20px', fontSize: 14 }}>
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '64px 0 80px', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>

            {/* Left copy */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--gold-border)',
                borderRadius: 999, padding: '5px 14px', marginBottom: 24,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold)', letterSpacing: '0.04em' }}>
                  AI-powered Accounts Payable
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 700, lineHeight: 1.18,
                color: 'var(--text-primary)', marginBottom: 20,
              }}>
                Turn invoice chaos into a calm, intelligent finance workflow.
              </h1>

              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
                Work Clat automates invoice capture, PO matching, exception triage, and treasury release — so your team focuses on decisions, not data entry.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <a href="/login" className="btn-primary">Open workspace →</a>
                <a href="#how-it-works" className="btn-secondary">See how it works</a>
              </div>

              {/* social proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex' }}>
                  {['#1a2e4a', '#2d4a6e', '#4a7a9b'].map((bg, i) => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: bg, border: '2px solid var(--bg)',
                      marginLeft: i > 0 ? -8 : 0,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Trusted by <strong style={{ color: 'var(--text-primary)' }}>200+</strong> finance teams
                </span>
              </div>
            </div>

            {/* Right: Dashboard preview */}
            <div style={{
              transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)',
              transformOrigin: 'center center',
              transition: 'transform 0.4s ease',
            }}>
              <DashPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics strip ── */}
      <section ref={metricsRef} style={{
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', padding: '40px 0',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {metrics.map((m, i) => (
              <div key={m.label} style={{
                padding: '0 28px',
                borderRight: i < metrics.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: metricsVisible ? 1 : 0,
                transform: metricsVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.45s ease ${i * 0.08}s, transform 0.45s ease ${i * 0.08}s`,
              }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>{m.value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: '80px 0 96px', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'flex-start' }}>

            {/* sticky label column */}
            <div style={{ position: 'sticky', top: 80 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
                How it works
              </p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 18 }}>
                From inbox to treasury in four steps.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: 380 }}>
                Work Clat's automated pipeline cuts manual AP work by 87%, flags exceptions before they become problems, and keeps every stakeholder in sync.
              </p>
              <div style={{ marginTop: 32 }}>
                <a href="/login" className="btn-primary">Start automating →</a>
              </div>
            </div>

            {/* timeline column */}
            <div style={{ paddingTop: 8 }}>
              {steps.map((step, idx) => (
                <Step key={step.num} step={step} idx={idx} total={steps.length} />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{
        background: 'var(--accent)',
        padding: '64px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Ready to reclaim your AP workflow?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
            Join hundreds of finance teams running smarter accounts payable with Work Clat.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/login" style={{
              background: '#b8860b', color: '#fff', padding: '12px 28px',
              borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-body)', transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#9a6e09')}
              onMouseLeave={e => (e.currentTarget.style.background = '#b8860b')}
            >Open workspace →</a>
            <a href="/login?mode=signup" style={{
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              padding: '12px 28px', borderRadius: 10, fontSize: 15,
              fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >Sign up free</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)', background: 'var(--surface)',
        padding: '28px 0', fontSize: 13, color: 'var(--text-muted)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.jpeg" alt="DBMS" style={{ height: 18, borderRadius: 3, objectFit: 'contain', opacity: 0.6 }} />
            <span>© {new Date().getFullYear()} Work Clat</span>
          </div>
          <span style={{ fontSize: 12 }}>AI-powered accounts payable automation</span>
        </div>
      </footer>

    </main>
  );
}
