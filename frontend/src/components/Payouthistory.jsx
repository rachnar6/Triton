import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const STATUS_STYLES = {
  CLAIM_REQUESTED: { bg: '#fff7e6', color: '#7a5b00', label: 'Pending Review' },
  PAID: { bg: '#ecfdf5', color: '#166534', label: 'Paid' },
  REJECTED: { bg: '#fef2f2', color: '#991b1b', label: 'Rejected' },
};

export default function PayoutHistory() {
  const { token } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.getPayoutStatus(token);
      setClaims(res.claims || []);
    } catch (err) {
      // Silent — this panel is supplementary, EarningsPanel is the source of truth for live coins
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = claims.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);

  if (loading || claims.length === 0) return null;

  return (
    <div className="card card-shadow" style={{ padding: '16px 18px', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>💳 Payout History</h3>
        <span style={{ fontSize: 13, color: 'var(--gray)' }}>
          Total received: <strong style={{ color: '#166534' }}>₹{totalPaid}</strong>
        </span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Coins</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => {
            const style = STATUS_STYLES[c.status] || {};
            return (
              <tr key={c._id}>
                <td>{c.label}</td>
                <td>{c.coins}</td>
                <td>₹{c.amount}</td>
                <td>
                  <span
                    style={{
                      background: style.bg,
                      color: style.color,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {style.label || c.status}
                  </span>
                </td>
                <td>{c.requestedAt ? new Date(c.requestedAt).toLocaleDateString() : '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--gray)' }}>
                  {c.status === 'PAID' &&
                    (c.paymentRef ? `Ref: ${c.paymentRef}` : c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '—')}
                  {c.status === 'REJECTED' && (c.rejectionReason || '—')}
                  {c.status === 'CLAIM_REQUESTED' && 'Awaiting admin review'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}