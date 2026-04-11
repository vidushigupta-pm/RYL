/**
 * AdminDashboard — standalone page at /admin
 * Lightweight password protection + server-side analytics dashboard
 */
import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanEvent {
  product_name: string;
  brand: string;
  category: string;
  overall_score: number;
  scanned_at: number; // milliseconds from Admin SDK .toMillis()
  user_id: string;
}

interface ProductDoc {
  product_name: string;
  brand: string;
  data_source: string;
}

interface DashboardMetrics {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  uniqueProducts: number;
  uniqueUsers: number;
  avgSafetyScore: number;
  topProducts: { name: string; count: number; avgScore: number }[];
  categoryBreakdown: { category: string; count: number; pct: number }[];
  scoreDistribution: { label: string; range: string; count: number; color: string }[];
  dailyTrend: { date: string; count: number }[];
  cachedVerified: number;
  cachedLLM: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'ryl_admin_token';
const ADMIN_PASSWORD = 'ryl2025admin';

const SCORE_BANDS = [
  { label: 'Safe', range: '81–100', min: 81, max: 100, color: '#2E7D4F' },
  { label: 'OK', range: '61–80', min: 61, max: 80, color: '#6AAF88' },
  { label: 'Caution', range: '31–60', min: 31, max: 60, color: '#E07B2A' },
  { label: 'Avoid', range: '0–30', min: 0, max: 30, color: '#D94F3D' },
];

function scoreColor(score: number): string {
  if (score >= 70) return '#2E7D4F';
  if (score >= 40) return '#E07B2A';
  return '#D94F3D';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #E8DDD0',
          borderTopColor: '#1B3D2F',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8DDD0',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1B3D2F', fontFamily: 'serif' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_TOKEN_KEY, 'ok');
      onLogin();
    } else {
      setError('Incorrect password.');
      setPw('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FDF6EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #E8DDD0',
          borderRadius: 20,
          padding: '40px 32px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
      >
        <h1
          style={{
            fontFamily: 'serif',
            fontSize: 24,
            color: '#1B3D2F',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 28 }}>
          Enter your admin password to continue
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && attempt()}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #E8DDD0',
            borderRadius: 10,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
          autoFocus
        />
        {error && (
          <p style={{ color: '#D94F3D', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}
        <button
          onClick={attempt}
          style={{
            width: '100%',
            padding: '11px',
            background: '#1B3D2F',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch via server-side Admin SDK endpoint (bypasses Firestore rules)
      const resp = await fetch('/api/adminStats', {
        method: 'GET',
        headers: { 'x-admin-token': 'ryl2025admin' },
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${resp.status}`);
      }
      const { events: scans, products }: { events: ScanEvent[]; products: ProductDoc[] } = await resp.json();

      // 2. Compute all metrics client-side
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // scanned_at is already in ms (from Admin SDK .toMillis())
      const toDate = (ts: any): Date => {
        if (!ts) return new Date(0);
        if (typeof ts === 'number') return new Date(ts);
        if (ts.toDate) return ts.toDate();
        if (ts.seconds) return new Date(ts.seconds * 1000);
        return new Date(ts);
      };

      const totalScans = scans.length;
      const scansToday = scans.filter((s) => toDate(s.scanned_at) >= todayMidnight).length;
      const scansThisWeek = scans.filter((s) => toDate(s.scanned_at) >= weekAgo).length;

      const productNames = new Set(scans.map((s) => (s.product_name || '').trim().toLowerCase()));
      const uniqueProducts = productNames.size;

      const userIds = new Set(scans.map((s) => s.user_id).filter(Boolean));
      const uniqueUsers = userIds.size;

      const validScores = scans.map((s) => Number(s.overall_score)).filter((n) => !isNaN(n));
      const avgSafetyScore =
        validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0;

      // Top 10 products
      const productMap = new Map<string, { count: number; totalScore: number }>();
      for (const s of scans) {
        const key = (s.product_name || 'Unknown').trim();
        const existing = productMap.get(key) || { count: 0, totalScore: 0 };
        productMap.set(key, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (Number(s.overall_score) || 0),
        });
      }
      const topProducts = Array.from(productMap.entries())
        .map(([name, { count, totalScore }]) => ({
          name,
          count,
          avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Category breakdown
      const catMap = new Map<string, number>();
      for (const s of scans) {
        const cat = (s.category || 'UNKNOWN').toUpperCase();
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      }
      const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, count]) => ({
          category,
          count,
          pct: totalScans > 0 ? Math.round((count / totalScans) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Score distribution
      const scoreDistribution = SCORE_BANDS.map((band) => ({
        label: band.label,
        range: band.range,
        count: scans.filter((s) => {
          const sc = Number(s.overall_score);
          return !isNaN(sc) && sc >= band.min && sc <= band.max;
        }).length,
        color: band.color,
      }));

      // Daily trend — last 14 days
      const days14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      });
      const dailyTrend = days14.map((dayStart) => {
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const count = scans.filter((s) => {
          const sd = toDate(s.scanned_at);
          return sd >= dayStart && sd < dayEnd;
        }).length;
        return { date: formatDate(dayStart), count };
      });

      // Cached products
      const cachedVerified = products.filter((p) => p.data_source === 'VERIFIED').length;
      const cachedLLM = products.filter((p) => p.data_source === 'LLM_GENERATED').length;

      setMetrics({
        totalScans,
        scansToday,
        scansThisWeek,
        uniqueProducts,
        uniqueUsers,
        avgSafetyScore,
        topProducts,
        categoryBreakdown,
        scoreDistribution,
        dailyTrend,
        cachedVerified,
        cachedLLM,
      });
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Admin dashboard fetch error:', err);
      setError(err?.message || 'Failed to load data. Check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const maxDailyCount = metrics ? Math.max(...metrics.dailyTrend.map((d) => d.count), 1) : 1;
  const maxScoreCount = metrics ? Math.max(...metrics.scoreDistribution.map((d) => d.count), 1) : 1;

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6EE', padding: '24px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: 'serif',
              fontSize: 30,
              color: '#1B3D2F',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            RYL Admin Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              style={{
                fontSize: 12,
                color: '#1B3D2F',
                background: 'transparent',
                border: '1px solid #1B3D2F',
                borderRadius: 8,
                padding: '3px 10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                window.location.reload();
              }}
              style={{
                fontSize: 12,
                color: '#D94F3D',
                background: 'transparent',
                border: '1px solid #D94F3D',
                borderRadius: 8,
                padding: '3px 10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Log out
            </button>
          </div>
        </div>

        {loading && !metrics && <Spinner />}

        {error && !metrics && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '16px 20px',
              color: '#B91C1C',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {metrics && metrics.totalScans === 0 && !loading && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8DDD0',
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: 16,
            }}
          >
            No data yet — start scanning!
          </div>
        )}

        {metrics && metrics.totalScans > 0 && (
          <>
            {/* Summary metric cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 14,
                marginBottom: 24,
              }}
            >
              <MetricCard label="Total Scans" value={metrics.totalScans} />
              <MetricCard label="Scans Today" value={metrics.scansToday} />
              <MetricCard label="Scans This Week" value={metrics.scansThisWeek} />
              <MetricCard label="Unique Products" value={metrics.uniqueProducts} />
              <MetricCard label="Unique Users" value={metrics.uniqueUsers} />
              <MetricCard
                label="Avg Safety Score"
                value={metrics.avgSafetyScore}
                sub={
                  metrics.avgSafetyScore >= 70
                    ? 'Generally safe'
                    : metrics.avgSafetyScore >= 40
                    ? 'Mixed results'
                    : 'Concerning'
                }
              />
            </div>

            {/* Daily Scan Trend */}
            <Section title="Daily Scan Trend (Last 14 Days)">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 100 }}>
                {metrics.dailyTrend.map((day) => (
                  <div
                    key={day.date}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                    title={`${day.date}: ${day.count}`}
                  >
                    <div
                      style={{
                        width: '100%',
                        background: '#1B3D2F',
                        borderRadius: '4px 4px 0 0',
                        height: day.count > 0 ? `${Math.max(4, Math.round((day.count / maxDailyCount) * 80))}px` : '2px',
                        opacity: day.count > 0 ? 1 : 0.2,
                        transition: 'height 0.3s',
                      }}
                    />
                    <span style={{ fontSize: 9, color: '#9CA3AF', whiteSpace: 'nowrap', transform: 'rotate(-40deg)', transformOrigin: 'top center' }}>
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Top 10 Products */}
            <Section title="Top 10 Most Scanned Products">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {metrics.topProducts.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1B3D2F',
                        width: 22,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: '#F3F4F6',
                          borderRadius: 3,
                          marginTop: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round((p.count / (metrics.topProducts[0]?.count || 1)) * 100)}%`,
                            background: '#1B3D2F',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#6B7280',
                        flexShrink: 0,
                        width: 50,
                        textAlign: 'right',
                      }}
                    >
                      {p.count} scan{p.count !== 1 ? 's' : ''}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: scoreColor(p.avgScore),
                        flexShrink: 0,
                        width: 28,
                        textAlign: 'right',
                      }}
                    >
                      {p.avgScore}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Category Breakdown */}
            <Section title="Category Breakdown">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {metrics.categoryBreakdown.map((cat) => (
                  <div key={cat.category}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#111827' }}>
                        {cat.category.replace(/_/g, ' ')}
                      </span>
                      <span style={{ color: '#6B7280' }}>
                        {cat.count} ({cat.pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: '#F3F4F6',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${cat.pct}%`,
                          background: '#1B3D2F',
                          borderRadius: 4,
                          minWidth: cat.pct > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Score Distribution */}
            <Section title="Score Distribution">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {metrics.scoreDistribution.map((band) => (
                  <div key={band.label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: band.color }}>
                        {band.label}{' '}
                        <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 11 }}>
                          ({band.range})
                        </span>
                      </span>
                      <span style={{ color: '#6B7280' }}>{band.count} scans</span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: '#F3F4F6',
                        borderRadius: 5,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.round((band.count / maxScoreCount) * 100)}%`,
                          background: band.color,
                          borderRadius: 5,
                          minWidth: band.count > 0 ? 4 : 0,
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Cached Products */}
            <Section title="Product Cache">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '16px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#166534', fontFamily: 'serif' }}>
                    {metrics.cachedVerified}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803D', marginTop: 4 }}>VERIFIED</div>
                </div>
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 12,
                    padding: '16px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#92400E', fontFamily: 'serif' }}>
                    {metrics.cachedLLM}
                  </div>
                  <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>LLM_GENERATED</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
                {metrics.cachedVerified + metrics.cachedLLM} total cached products
              </p>
            </Section>

            {loading && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#9CA3AF', fontSize: 12 }}>
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8DDD0',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontFamily: 'serif',
          fontSize: 17,
          fontWeight: 700,
          color: '#1B3D2F',
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) === 'ok');

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }
  return <Dashboard />;
}
