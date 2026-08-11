import { useEffect, useState } from 'react';
import { api } from '../api';

/* ------------------------------------------------------------------ */
/*  EARNINGS PANEL — 1 completed task = 1 coin. Shows total coins,     */
/*  this month's coins/revenue, and a plain SVG-free bar chart of      */
/*  revenue per month, all pulled live from GET /api/tasks/earnings.   */
/*  Reused on the Volunteer Portal (dashboard) and the Activity page.  */
/* ------------------------------------------------------------------ */

export default function EarningsPanel({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.getEarnings(token);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load earnings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="card card-shadow" style={{ padding: 20 }}>
        <p style={{ color: 'var(--gray)', margin: 0, fontSize: 13 }}>Loading your earnings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-shadow" style={{ padding: 20 }}>
        <p className="form-error" style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { totalCoins = 0, totalRevenue = 0, currentMonth, monthlyStats = [], coinValue = 100 } = data;
  // Chart shows at most the last 6 months so it stays readable.
  const recentMonths = monthlyStats.slice(-6);
  const maxRevenue = Math.max(...recentMonths.map((m) => m.revenue), 1);

  return (
    <div className="card card-shadow" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        🪙 Your Coins &amp; Earnings
      </h3>
      <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 18 }}>
        You earn <strong>1 coin (₹{coinValue})</strong> for every task you complete.
      </p>

      {/* --- Summary tiles --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatTile label="Total Coins" value={`🪙 ${totalCoins}`} color="#0d3b66" />
        <StatTile label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="#047857" />
        <StatTile
          label={currentMonth?.label ? `This Month (${currentMonth.label})` : 'This Month'}
          value={`🪙 ${currentMonth?.coins || 0} · ₹${(currentMonth?.revenue || 0).toLocaleString('en-IN')}`}
          color="#f59e0b"
        />
      </div>

      {/* --- Monthly bar chart --- */}
      {recentMonths.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--gray)' }}>
          Complete your first task to start earning coins — your monthly chart will show up here.
        </p>
      ) : (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--gray)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 10,
            }}
          >
            Revenue by Month
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140, padding: '0 4px' }}>
            {recentMonths.map((m) => {
              const isCurrent = m.label === currentMonth?.label;
              const heightPct = Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 6 : 2);
              return (
                <div
                  key={m.label}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#f59e0b' : '#0d3b66', marginBottom: 4 }}>
                    {m.coins}🪙
                  </div>
                  <div
                    title={`${m.label}: ${m.coins} coin${m.coins === 1 ? '' : 's'} · ₹${m.revenue.toLocaleString('en-IN')}`}
                    style={{
                      width: '100%',
                      maxWidth: 34,
                      height: `${heightPct}%`,
                      background: isCurrent ? '#f59e0b' : '#0d3b66',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
                    {m.label.split(' ')[0]}
                    <br />
                    {m.label.split(' ')[1]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{label}</div>
    </div>
  );
}