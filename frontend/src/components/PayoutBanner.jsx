import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';

// Remembers which PAID claim IDs the volunteer has already seen the
// "you got paid" banner for, so it doesn't reappear every visit but
// still shows once per new payout.
const ACK_STORAGE_KEY = 'payoutAckIds';

function loadAckedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(ACK_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveAckedIds(ids) {
  localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...ids]));
}

export default function PayoutBanner() {
  const { token } = useAuth();
  const [unclaimed, setUnclaimed] = useState([]);
  const [newlyPaid, setNewlyPaid] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [error, setError] = useState('');
  const [dismissedReminder, setDismissedReminder] = useState(false);
  const ackedRef = useRef(loadAckedIds());

  useEffect(() => {
    load();
    // Poll so a payout marked PAID by the admin while the volunteer is
    // sitting on this screen still surfaces without a manual refresh.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const res = await api.getPayoutStatus(token);
      setUnclaimed(res.unclaimed || []);

      const paidClaims = (res.claims || []).filter((c) => c.status === 'PAID');
      const unseen = paidClaims.filter((c) => !ackedRef.current.has(c._id));
      if (unseen.length > 0) setNewlyPaid(unseen);
    } catch (err) {
      // Silent — this is a nice-to-have reminder, not core flow
    }
  }

  function dismissPaidBanner() {
    const ids = loadAckedIds();
    newlyPaid.forEach((c) => ids.add(c._id));
    saveAckedIds(ids);
    ackedRef.current = ids;
    setNewlyPaid([]);
  }

  async function confirmClaim() {
    if (!claiming) return;
    setError('');
    try {
      await api.claimPayout(claiming.year, claiming.month, token);
      setClaiming(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {newlyPaid.length > 0 && (
        <div
          style={{
            background: '#ecfdf5',
            border: '2px solid #2e9e5b',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <strong style={{ color: '#166534' }}>🎉 Payout Received!</strong>
            <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>
              {newlyPaid.map((c) => (
                <div key={c._id}>
                  {c.label}: ₹{c.amount} paid{c.paymentRef ? ` (Ref: ${c.paymentRef})` : ''}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderColor: '#2e9e5b', color: '#166534' }}
            onClick={dismissPaidBanner}
          >
            Got it
          </button>
        </div>
      )}

      {unclaimed.length > 0 && !dismissedReminder && (
        <div
          style={{
            background: '#fff7e6',
            border: '2px solid #f5a623',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <strong>💰 You have ₹{unclaimed.reduce((sum, m) => sum + m.coins * 100, 0)} unclaimed</strong>
            <div style={{ fontSize: 13, color: '#7a5b00', marginTop: 2 }}>
              {unclaimed.map((m) => m.label).join(', ')} — claim before it sits unpaid.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: '#f5a623', borderColor: '#f5a623' }}
              onClick={() => setClaiming(unclaimed[0])}
            >
              Claim Now
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setDismissedReminder(true)}>
              Remind me later
            </button>
          </div>
        </div>
      )}

      {claiming && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setClaiming(null)}
        >
          <div className="card" style={{ padding: 24, maxWidth: 360, background: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Claim {claiming.label}?</h3>
            <p>
              You earned <strong>{claiming.coins} coins (₹{claiming.coins * 100})</strong> in {claiming.label}. This sends a
              payout request to the admin team.
            </p>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-primary" onClick={confirmClaim}>
                Confirm Claim
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setClaiming(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}