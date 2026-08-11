import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';
import EarningsPanel from '../components/EarningsPanel.jsx';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 8;

export default function TaskHistory() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

  // table controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    try {
      const res = await api.taskHistory(token);
      setTasks(res.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  }

  async function cancelPendingTask(taskId) {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await api.cancelTask(taskId, token);
      fetchHistory();
    } catch (err) {
      alert(err.message || 'Failed to cancel task');
    }
  }

  const categories = useMemo(() => {
    const set = new Set(tasks.map((t) => t.category).filter(Boolean));
    return Array.from(set);
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      if (q) {
        const haystack = [t.description, t.category, t.city, t.subRegion, t.volunteer?.fullName, t.senior?.fullName]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortDir === 'asc' ? diff : -diff;
    });
    return rows;
  }, [tasks, search, statusFilter, categoryFilter, dateFrom, dateTo, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // reset to page 1 whenever filters change and current page is out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const insights = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED');
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const completionRate = total ? Math.round((completed.length / total) * 100) : 0;
    const ratings = completed.map((t) => t.rating).filter((r) => typeof r === 'number');
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
    const catCounts = {};
    tasks.forEach((t) => { if (t.category) catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, completedCount: completed.length, pending, completionRate, avgRating, topCategory };
  }, [tasks]);

  if (loading) return <div className="spinner-text">Loading your activity history…</div>;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1>📜 Activity & Task History</h1>
      <p style={{ color: 'var(--gray)', marginBottom: 20 }}>
        View all your past completed, pending, and fulfilled neighborhood requests.
      </p>

      {error && <div className="form-error">{error}</div>}

      {/* INSIGHTS STRIP — full width, above the table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="Total Tasks" value={insights.total} icon="📋" />
        <StatCard label="Completed" value={insights.completedCount} icon="✅" />
        <StatCard label="Pending" value={insights.pending} icon="⏳" />
        <StatCard label="Completion Rate" value={`${insights.completionRate}%`} icon="📈" />
        {insights.avgRating && <StatCard label="Avg Rating Given" value={`⭐ ${insights.avgRating}`} icon="⭐" />}
        {insights.topCategory && (
          <StatCard label="Top Category" value={`${insights.topCategory[0].replace('_', ' ')} (${insights.topCategory[1]})`} icon="🏷️" />
        )}
      </div>

      {user.role === 'VOLUNTEER' && (
        <div style={{ marginBottom: 20 }}>
          <EarningsPanel token={token} />
        </div>
      )}

      {/* MAIN ACTIVITY TABLE — now full width */}
      {tasks.length === 0 ? (
        <div className="card card-shadow" style={{ textAlign: 'center', padding: 32 }}>
          <h3>No past activity found</h3>
          <p style={{ color: 'var(--gray)' }}>Once tasks are posted or completed, they will appear in this history log.</p>
        </div>
      ) : (
        <div className="card card-shadow" style={{ padding: '16px 18px', width: '100%', boxSizing: 'border-box' }}>
          {/* controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--gray)' }}>🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tasks…"
                  style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #d8dde3', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dde3', fontSize: 13 }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray)' }}>
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #d8dde3', fontSize: 12 }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #d8dde3', fontSize: 12 }} />
              </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: 0 }}>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.key}
                  className={`btn ${statusFilter === s.key ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderColor: 'var(--navy)', color: statusFilter === s.key ? undefined : 'var(--navy)' }}
                  onClick={() => { setStatusFilter(s.key); setPage(1); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                    title="Sort by date"
                  >
                    Date {sortDir === 'asc' ? '↑' : '↓'}
                  </th>
                  <th style={{ whiteSpace: 'nowrap' }}>Time</th>
                  <th>Task</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Category</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Location</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gray)' }}>No tasks match your filters.</td></tr>
                )}
                {pageRows.map((task) => (
                  <tr key={task._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(task.createdAt).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.description}>
                      {task.description}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status === 'COMPLETED' ? '✅ Completed' : task.status === 'PENDING' ? '⏳ Pending' : task.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{task.category?.replace('_', ' ')}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{task.subRegion ? `${task.subRegion}, ` : ''}{task.city}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setSelectedTaskForDetail(task)}>
                          🔍 Details
                        </button>
                        {user.role === 'SENIOR' && task.status === 'COMPLETED' && task.volunteer && (
                          <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setSelectedTaskForReview(task)}>
                            {task.rating ? '✏️ Edit' : '⭐ Rate'}
                          </button>
                        )}
                        {user.role === 'SENIOR' && task.status === 'PENDING' && (
                          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => cancelPendingTask(task._id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--navy)',
                    background: p === page ? 'var(--navy)' : '#fff', color: p === page ? '#fff' : 'var(--navy)',
                    fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          role={user.role}
          onClose={() => setSelectedTaskForDetail(null)}
          onCancel={() => { cancelPendingTask(selectedTaskForDetail._id); setSelectedTaskForDetail(null); }}
          onReview={() => { setSelectedTaskForReview(selectedTaskForDetail); setSelectedTaskForDetail(null); }}
        />
      )}

      {/* Review Modal */}
      {selectedTaskForReview && (
        <ReviewModal
          task={selectedTaskForReview}
          token={token}
          onClose={() => setSelectedTaskForReview(null)}
          onSubmitted={() => {
            setSelectedTaskForReview(null);
            fetchHistory();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card card-shadow" style={{ padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function TaskDetailModal({ task, role, onClose, onCancel, onReview }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card card-shadow" style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className={`status-badge status-${task.status}`}>
              {task.status === 'COMPLETED' ? '✅ Completed' : task.status === 'PENDING' ? '⏳ PENDING (Awaiting Helper)' : task.status}
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>
              {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <h3 style={{ margin: '0 0 4px 0' }}>{task.description}</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--gray)' }}>
          Category: <strong>{task.category?.replace('_', ' ')}</strong> • Location: <strong>{task.subRegion ? `${task.subRegion}, ` : ''}{task.city}</strong>
        </p>

        {role === 'SENIOR' && task.status === 'PENDING' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 12, borderRadius: 8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              📡 Broadcasting to nearby helpers...
            </span>
            <button type="button" className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={onCancel}>
              Cancel Request
            </button>
          </div>
        )}

        {role === 'SENIOR' && task.volunteer && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0d3b66', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {task.volunteer.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Helper: {task.volunteer.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--gray)' }}>📍 {task.volunteer.subRegion ? `${task.volunteer.subRegion}, ` : ''}{task.volunteer.city}</div>
              </div>
            </div>
            {task.status === 'COMPLETED' && (
              <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={onReview}>
                {task.rating ? '✏️ Edit Review' : '⭐ Write Review'}
              </button>
            )}
          </div>
        )}

        {role === 'VOLUNTEER' && task.senior && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Senior Helped: {task.senior.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>📍 {task.senior.addressText}</div>
            </div>
            {task.status === 'COMPLETED' && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '5px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                🪙 +1 coin earned (₹100)
              </span>
            )}
          </div>
        )}

        {task.rating && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: 10, fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>Rating Left: ⭐ {task.rating} / 5.0</div>
            {task.reviewText && <p style={{ margin: '4px 0 8px 0', fontStyle: 'italic', color: '#334155' }}>"{task.reviewText}"</p>}
            {task.reviewMedia && task.reviewMedia.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {task.reviewMedia.map((mediaUrl, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    {mediaUrl.startsWith('data:video') || mediaUrl.endsWith('.mp4') ? (
                      <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function StarRatingPicker({ rating, onChange }) {
  const [hoverRating, setHoverRating] = useState(null);
  const activeVal = hoverRating !== null ? hoverRating : rating;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          let starChar = '☆';
          if (activeVal >= starIndex) {
            starChar = '★';
          } else if (activeVal >= starIndex - 0.5) {
            starChar = '⯨';
          }

          return (
            <span
              key={starIndex}
              onClick={() => onChange(starIndex)}
              onDoubleClick={() => onChange(starIndex - 0.5)}
              onMouseEnter={() => setHoverRating(starIndex)}
              onMouseLeave={() => setHoverRating(null)}
              style={{
                fontSize: 34,
                cursor: 'pointer',
                color: activeVal >= starIndex - 0.5 ? '#f59e0b' : '#cbd5e1',
                userSelect: 'none',
                transition: 'transform 0.1s ease',
              }}
              title={`Click for ${starIndex} stars, Double-click for ${starIndex - 0.5} stars`}
            >
              {starChar}
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray)' }}>
        💡 <em>Single click = full star • Double click = half star</em>
      </div>
    </div>
  );
}

function ReviewModal({ task, token, onClose, onSubmitted }) {
  const [rating, setRating] = useState(task.rating || 5);
  const [reviewText, setReviewText] = useState(task.reviewText || '');
  const [mediaFiles, setMediaFiles] = useState(task.reviewMedia || []);
  const [submitting, setSubmitting] = useState(false);

  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeMedia(index) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.rateTask(task._id, { rating, reviewText, reviewMedia: mediaFiles }, token);
      onSubmitted();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <form onSubmit={handleSubmit} className="card card-shadow" style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{task.rating ? '✏️ Edit Review' : '⭐ Write Review'}</h2>
        <p style={{ fontSize: 14, color: 'var(--gray)' }}>
          Review your experience with <strong>{task.volunteer?.fullName || 'your helper'}</strong>
        </p>

        <div className="form-field" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Star Rating</label>
          <StarRatingPicker rating={rating} onChange={(newRating) => setRating(newRating)} />
        </div>

        <div className="form-field">
          <label>Comments & Feedback</label>
          <textarea
            rows={3}
            placeholder="Write a thank you note or comment for other seniors to see..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>📷 Attach Photos or Videos (Optional)</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            style={{ fontSize: 13 }}
          />
        </div>

        {mediaFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            {mediaFiles.map((mediaUrl, idx) => (
              <div key={idx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                {mediaUrl.startsWith('data:video') ? (
                  <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Review'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}