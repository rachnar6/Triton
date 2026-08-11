import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';

const NAVY = '#1e3a5f';
const NAVY_DARK = '#132a45';
const AMBER = '#f5a623';
const GREEN = '#2e9e5b';
const RED = '#d9534f';
const SLATE = '#8492a6';

const NAV_ITEMS = [
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'users', label: 'Verify Users', icon: '🪪' },
  { key: 'tasks', label: 'Task Monitor', icon: '🗂️' },
  { key: 'sos', label: 'SOS Feed', icon: '🚨' },
  { key: 'payouts', label: 'Payouts', icon: '💳' },
  { key: 'reports', label: 'Reports', icon: '📄', disabled: true },
  { key: 'settings', label: 'Settings', icon: '⚙️', disabled: true },
];

const SECTION_TITLES = {
  analytics: 'Analytics',
  users: 'User Verification',
  tasks: 'Live Task Monitor',
  sos: 'SOS & Incidents',
  payouts: 'Volunteer Payouts',
  reports: 'Reports',
  settings: 'Settings',
};

export default function AdminPortal() {
  const [section, setSection] = useState('analytics');

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', background: '#f3f5f8' }}>
      <Sidebar section={section} onSelect={setSection} />

      <div style={{ flex: 1, minWidth: 0, padding: '24px 28px 40px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0 }}>Admin Control Center Dashboard</h1>
          <div style={{ color: 'var(--gray)', fontSize: 14, marginTop: 2 }}>{SECTION_TITLES[section]}</div>
        </div>

        {section === 'analytics' && <Analytics />}
        {section === 'users' && <UsersTable />}
        {section === 'tasks' && <TasksTable />}
        {section === 'sos' && <SosLog />}
        {section === 'payouts' && <PayoutsTable />}
        {section === 'reports' && <ComingSoon label="Reports" />}
        {section === 'settings' && <ComingSoon label="Settings" />}
      </div>
    </div>
  );
}

/* ---------- sidebar ---------- */

function Sidebar({ section, onSelect }) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DARK} 100%)`,
        minHeight: 'calc(100vh - 64px)',
        padding: '20px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 16, padding: '0 8px', marginBottom: 22 }}>
        <span>🏠</span> NeighborCare
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = section === item.key;
          return (
            <button
              key={item.key}
              disabled={item.disabled}
              onClick={() => !item.disabled && onSelect(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                borderRadius: 8,
                cursor: item.disabled ? 'default' : 'pointer',
                background: active ? '#ffffff' : 'transparent',
                color: active ? NAVY : '#c7d3e0',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.disabled && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 10 }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ComingSoon({ label }) {
  return (
    <div className="card card-shadow" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray)' }}>
      {label} isn't built yet — this is just a placeholder in the nav for now.
    </div>
  );
}

/* ---------- shared bits ---------- */

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar" style={{ position: 'relative', maxWidth: 340, marginBottom: 12 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', fontSize: 14 }}>
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px 9px 34px',
          borderRadius: 8,
          border: '1px solid #d8dde3',
          fontSize: 14,
          outline: 'none',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'transparent', color: 'var(--gray)', cursor: 'pointer', fontSize: 14,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function ResultCount({ shown, total, noun }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 8 }}>
      Showing {shown} of {total} {noun}
    </div>
  );
}

function ExpandCaret({ open }) {
  return (
    <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', marginRight: 6 }}>
      ▶
    </span>
  );
}

/* ---------- Users ---------- */

function UsersTable() {
  const { token } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const SUPER_ADMIN_EMAIL = 'ranjithrachna6@gmail.com';

  useEffect(() => { load(); }, [roleFilter]);

  async function load() {
    try {
      const { users } = await api.adminUsers(roleFilter, token);
      const filteredUsers = users.filter(
        (u) => u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
      );
      setUsers(filteredUsers);
    } catch (err) {
      setError(err.message);
    }
  }

  async function verify(id) {
    await api.adminVerifyUser(id, token);
    load();
  }
  async function toggleBlock(id, blocked) {
    await api.adminBlockUser(id, !blocked, token);
    load();
  }
  async function changeRole(id, role) {
    await api.adminSetRole(id, role, token);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName, u.email, u.phone, u.city]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      <div className="filter-bar">
        {['', 'SENIOR', 'VOLUNTEER', 'ADMIN'].map((r) => (
          <button
            key={r}
            className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderColor: 'var(--navy)', color: roleFilter === r ? undefined : 'var(--navy)' }}
            onClick={() => setRoleFilter(r)}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone or city…" />
      <ResultCount shown={filtered.length} total={users.length} noun="users" />

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 24 }}></th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>City</th>
            <th>Verification</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No users match your search.</td></tr>
          )}
          {filtered.map((u) => {
            const open = expandedId === u._id;
            return (
              <>
                <tr
                  key={u._id}
                  onClick={() => setExpandedId(open ? null : u._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td><ExpandCaret open={open} /></td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                      <option value="SENIOR">SENIOR</option>
                      <option value="VOLUNTEER">VOLUNTEER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{u.city}</td>
                  <td>
                    {u.isVerified ? (
                      <span style={{ color: 'green', fontWeight: 700 }}>✅ Verified</span>
                    ) : u.verificationStatus === 'PENDING' ? (
                      <span style={{ color: 'orange', fontWeight: 700 }}>⏳ Pending Review</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{u.isBlocked ? '🚫 Blocked' : 'Active'}</td>
                  <td style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {u.role === 'VOLUNTEER' && !u.isVerified && (
                      <button className="btn btn-primary" onClick={() => verify(u._id)}>Verify & Issue Badge</button>
                    )}
                    <button className="btn btn-danger" onClick={() => toggleBlock(u._id, u.isBlocked)}>
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr key={`${u._id}-detail`}>
                    <td></td>
                    <td colSpan={8} style={{ background: '#f7f9fb', padding: '14px 16px' }}>
                      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        <DetailItem label="User ID" value={u._id} />
                        <DetailItem label="Joined" value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'} />
                        <DetailItem label="Aadhaar" value={u.role === 'VOLUNTEER' ? (u.aadhaarNumber ? 'Provided' : 'Not provided') : '—'} />
                        <DetailItem label="Verification status" value={u.verificationStatus || '—'} />
                        <DetailItem label="Address" value={u.addressText || '—'} />
                        <DetailItem label="Emergency contact" value={u.emergencyContactName ? `${u.emergencyContactName} (${u.emergencyContactPhone || '—'})` : '—'} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--gray)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ---------- Tasks ---------- */

const STATUS_OPTIONS = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function TasksTable() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    const { tasks } = await api.adminTasks(statusFilter ? { status: statusFilter } : {}, token);
    setTasks(tasks);
  }

  async function override(id, status) {
    await api.adminUpdateTask(id, { status }, token);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      [t.category, t.city, t.senior?.fullName, t.volunteer?.fullName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  return (
    <div>
      <div className="filter-bar">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`} style={{ borderColor: 'var(--navy)', color: statusFilter === s ? undefined : 'var(--navy)' }} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by category, city, senior or volunteer…" />
      <ResultCount shown={filtered.length} total={tasks.length} noun="tasks" />

      <table className="data-table">
        <thead>
          <tr><th style={{ width: 24 }}></th><th>Category</th><th>City</th><th>Senior</th><th>Volunteer</th><th>Status</th><th>Override</th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No tasks match your search.</td></tr>
          )}
          {filtered.map((t) => {
            const open = expandedId === t._id;
            return (
              <>
                <tr key={t._id} onClick={() => setExpandedId(open ? null : t._id)} style={{ cursor: 'pointer' }}>
                  <td><ExpandCaret open={open} /></td>
                  <td>{t.category}</td>
                  <td>{t.city}</td>
                  <td>{t.senior?.fullName}</td>
                  <td>{t.volunteer?.fullName || '—'}</td>
                  <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={t.status} onChange={(e) => override(t._id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {open && (
                  <tr key={`${t._id}-detail`}>
                    <td></td>
                    <td colSpan={6} style={{ background: '#f7f9fb', padding: '14px 16px' }}>
                      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        <DetailItem label="Task ID" value={t._id} />
                        <DetailItem label="Created" value={t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'} />
                        <DetailItem label="Senior phone" value={t.senior?.phone || '—'} />
                        <DetailItem label="Volunteer phone" value={t.volunteer?.phone || '—'} />
                        <DetailItem label="Notes" value={t.notes || t.description || '—'} />
                        <DetailItem label="Urgency" value={t.urgency || '—'} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- SOS ---------- */

function SosLog() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.adminSosLog(token).then((r) => setIncidents(r.incidents));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return incidents;
    return incidents.filter((i) =>
      [i.senior?.fullName, i.senior?.phone, i.senior?.addressText, i.volunteer?.fullName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [incidents, search]);

  return (
    <div>
      <p style={{ color: 'var(--gray)' }}>High-urgency requests flagged for admin attention.</p>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by senior name, phone or address…" />
      <ResultCount shown={filtered.length} total={incidents.length} noun="incidents" />
      <table className="data-table">
        <thead>
          <tr><th>Senior</th><th>Phone</th><th>Address</th><th>Emergency Contact</th><th>Volunteer</th><th>Posted</th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No incidents match your search.</td></tr>
          )}
          {filtered.map((i) => (
            <tr key={i._id}>
              <td>{i.senior?.fullName}</td>
              <td>{i.senior?.phone}</td>
              <td>{i.senior?.addressText}</td>
              <td>{i.senior?.emergencyContactName ? `${i.senior.emergencyContactName} (${i.senior.emergencyContactPhone})` : '—'}</td>
              <td>{i.volunteer?.fullName || 'Unassigned'}</td>
              <td>{new Date(i.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Payouts ---------- */

const PAYOUT_STATUS_OPTIONS = ['CLAIM_REQUESTED', 'PAID', 'REJECTED'];

function PayoutsTable() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState('CLAIM_REQUESTED');
  const [search, setSearch] = useState('');
  const [payouts, setPayouts] = useState([]);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    try {
      const { payouts } = await api.adminPayouts(statusFilter, token);
      setPayouts(payouts);
    } catch (err) {
      setError(err.message);
    }
  }

  async function markPaid(id) {
    try {
      await api.adminMarkPayoutPaid(id, paymentRef, token);
      setPayingId(null);
      setPaymentRef('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reject(id) {
    const reason = window.prompt('Reason for rejecting this claim?');
    if (reason === null) return;
    try {
      await api.adminRejectPayout(id, reason, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payouts;
    return payouts.filter((p) =>
      [p.volunteer?.fullName, p.volunteer?.phone, p.volunteer?.city, p.label]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [payouts, search]);

  const totalDue = useMemo(
    () => filtered.filter((p) => p.status === 'CLAIM_REQUESTED').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  );

  return (
    <div>
      <p style={{ color: 'var(--gray)' }}>
        Volunteer monthly payout claims. Verify the amount against the volunteer's completed tasks before marking paid.
      </p>

      {error && <div className="form-error">{error}</div>}

      <div className="filter-bar">
        {['', ...PAYOUT_STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderColor: 'var(--navy)', color: statusFilter === s ? undefined : 'var(--navy)' }}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by volunteer name, phone, city or month…" />
      <ResultCount shown={filtered.length} total={payouts.length} noun="payouts" />

      {statusFilter === 'CLAIM_REQUESTED' && filtered.length > 0 && (
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 10 }}>
          Total pending: ₹{totalDue}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Volunteer</th>
            <th>Phone</th>
            <th>City</th>
            <th>Month</th>
            <th>Coins</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No payouts match your search.</td></tr>
          )}
          {filtered.map((p) => (
            <tr key={p._id}>
              <td>{p.volunteer?.fullName}</td>
              <td>{p.volunteer?.phone}</td>
              <td>{p.volunteer?.city}</td>
              <td>{p.label}</td>
              <td>{p.coins}</td>
              <td>₹{p.amount}</td>
              <td><span className={`status-badge status-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
              <td>{p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : '—'}</td>
              <td>
                {p.status === 'CLAIM_REQUESTED' && (
                  payingId === p._id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        placeholder="UTR / ref no."
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        style={{ width: 110, fontSize: 12 }}
                      />
                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => markPaid(p._id)}>
                        Confirm
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => { setPayingId(null); setPaymentRef(''); }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPayingId(p._id)}>
                        Mark Paid
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => reject(p._id)}>
                        Reject
                      </button>
                    </div>
                  )
                )}
                {p.status === 'PAID' && (
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                    {p.paymentRef ? `Ref: ${p.paymentRef}` : 'Paid'}
                  </span>
                )}
                {p.status === 'REJECTED' && (
                  <span style={{ fontSize: 12, color: RED }}>
                    {p.rejectionReason || 'Rejected'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Analytics ---------- */

function StatPill({ label, value, active }) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        minWidth: 130,
        padding: '14px 18px',
        borderRadius: 10,
        background: active ? NAVY : '#ffffff',
        color: active ? '#fff' : '#1a1a1a',
        boxShadow: '0 1px 3px rgba(16,24,40,0.08)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 2, color: active ? 'rgba(255,255,255,0.85)' : 'var(--gray)' }}>{label}</div>
    </div>
  );
}

function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [citySort, setCitySort] = useState('total'); // 'total' | 'completed' | 'rate'
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    api.adminAnalytics(token).then(setData);
  }, []);

  // All hooks must run on every render (including the initial "loading" render),
  // so cityRows is computed here, before the early return below, and guards
  // internally against `data` still being null.
  const cityRows = useMemo(() => {
    if (!data) return [];
    let rows = (data.cityCoverage || []).map((c) => ({
      ...c,
      rate: c.total ? Math.round((c.completed / c.total) * 100) : 0,
    }));
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      rows = rows.filter((c) => c._id?.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => b[citySort] - a[citySort]);
    return rows;
  }, [data, citySort, citySearch]);

  const bubbleData = useMemo(() => {
    if (!data) return [];
    return (data.cityCoverage || []).map((c) => ({
      city: c._id,
      total: c.total,
      rate: c.total ? Math.round((c.completed / c.total) * 100) : 0,
    }));
  }, [data]);

  if (!data) return <div className="spinner-text">Loading analytics…</div>;

  const completionRate = data.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
  const verifiedRate = data.totalVolunteers ? Math.round((data.verifiedVolunteers / data.totalVolunteers) * 100) : 0;

  const taskStatusData = [
    { name: 'Completed', value: data.completedTasks, color: GREEN },
    { name: 'Pending', value: data.pendingTasks, color: AMBER },
    { name: 'Other', value: Math.max(data.totalTasks - data.completedTasks - data.pendingTasks, 0), color: SLATE },
  ].filter((d) => d.value > 0);

  const volunteerStatusData = [
    { name: 'Verified', value: data.verifiedVolunteers, color: GREEN },
    { name: 'Unverified', value: Math.max(data.totalVolunteers - data.verifiedVolunteers, 0), color: AMBER },
  ].filter((d) => d.value > 0);

  return (
    <div>
      {/* horizontal stat strip */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        <StatPill label="Total Tasks" value={data.totalTasks} active />
        <StatPill label="Completed" value={data.completedTasks} />
        <StatPill label="Pending" value={data.pendingTasks} />
        <StatPill label="Completion Rate" value={`${completionRate}%`} />
        <StatPill label="Seniors" value={data.totalSeniors} />
        <StatPill label="Volunteers" value={data.totalVolunteers} />
        <StatPill label="Verified Volunteers" value={`${data.verifiedVolunteers} (${verifiedRate}%)`} />
        <StatPill label="Avg Response" value={data.avgResponseMinutes != null ? `${data.avgResponseMinutes}m` : '—'} />
      </div>

      {/* panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)', gap: 16, marginTop: 20, alignItems: 'stretch' }}>
        <div className="card card-shadow" style={{ padding: '16px 18px' }}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Tasks by City</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data.cityCoverage} margin={{ left: 0, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" name="Total" fill={NAVY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-shadow" style={{ padding: '16px 18px' }}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>City Performance</h3>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: -6 }}>Bubble size = task volume</div>
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="total" name="Total Tasks" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="number" dataKey="rate" name="Completion %" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <ZAxis type="number" dataKey="total" range={[120, 600]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => [val, name]} labelFormatter={() => ''} />
              <Scatter data={bubbleData} fill={NAVY}>
                {bubbleData.map((d, idx) => (
                  <Cell key={idx} fill={d.rate >= 70 ? GREEN : d.rate >= 40 ? AMBER : RED} fillOpacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-shadow" style={{ padding: '14px 16px', flex: 1 }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Task Status</h3>
            <ResponsiveContainer width="100%" height={95}>
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" nameKey="name" innerRadius={24} outerRadius={42} paddingAngle={2}>
                  {taskStatusData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-shadow" style={{ padding: '14px 16px', flex: 1 }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Volunteer Verification</h3>
            <ResponsiveContainer width="100%" height={95}>
              <PieChart>
                <Pie data={volunteerStatusData} dataKey="value" nameKey="name" innerRadius={24} outerRadius={42} paddingAngle={2}>
                  {volunteerStatusData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* city performance table */}
      <div className="card card-shadow" style={{ marginTop: 20, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>City Performance Detail</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchBar value={citySearch} onChange={setCitySearch} placeholder="Search city…" />
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              {[
                { key: 'total', label: 'Total' },
                { key: 'completed', label: 'Completed' },
                { key: 'rate', label: 'Completion %' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  className={`btn ${citySort === opt.key ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderColor: 'var(--navy)', color: citySort === opt.key ? undefined : 'var(--navy)' }}
                  onClick={() => setCitySort(opt.key)}
                  title={`Sort by ${opt.label}`}
                >
                  ⇅ {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>City</th><th>Total Tasks</th><th>Completed</th><th>Completion Rate</th></tr></thead>
          <tbody>
            {cityRows.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No cities match your search.</td></tr>
            )}
            {cityRows.map((c) => (
              <tr key={c._id}>
                <td>{c._id}</td>
                <td>{c.total}</td>
                <td>{c.completed}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e6e9ee', maxWidth: 120 }}>
                      <div style={{ width: `${c.rate}%`, height: '100%', borderRadius: 3, background: c.rate >= 70 ? GREEN : c.rate >= 40 ? AMBER : RED }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}