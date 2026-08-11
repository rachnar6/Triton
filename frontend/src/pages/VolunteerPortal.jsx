import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';
import TaskCard from '../components/TaskCard.jsx';
import PinEntry from '../components/PinDisplay.jsx';
import ProfileAlertBanner from '../components/ProfileAlertBanner.jsx';
import EarningsPanel from '../components/EarningsPanel.jsx';
import PayoutBanner from '../components/PayoutBanner.jsx';
import PayoutHistory from '../components/PayoutHistory.jsx';

export default function VolunteerPortal() {
  const { token, user } = useAuth();
  const [radiusKm, setRadiusKm] = useState(3);
  const [feedData, setFeedData] = useState({ sameSubRegion: [], otherSubRegions: [] });
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadActive();
    const interval = setInterval(() => {
      loadActive();
    }, 6000);

    return () => clearInterval(interval);
  }, [radiusKm, token]);

  async function loadActive() {
    try {
      const { task } = await api.activeTask(token);
      setActiveTask(task || null);
      if (!task) {
        await loadFeed();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
    try {
      const res = await api.taskFeed(radiusKm, token);
      setFeedData({
        sameSubRegion: res.sameSubRegion || [],
        otherSubRegions: res.otherSubRegions || res.tasks || res.requests || [],
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function claim(id) {
    setError('');
    try {
      const { task } = await api.claimTask(id, token);
      setActiveTask(task);
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifyPin(pin) {
    setError('');
    try {
      await api.verifyPin(activeTask._id, pin, token);
      setMessage('✅ Task completed! Thank you for helping your neighbor. 🪙 +1 coin earned.');
      setActiveTask(null);
      loadFeed();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="spinner-text">Loading your feed…</div>;

  const allTasks = [...(feedData.sameSubRegion || []), ...(feedData.otherSubRegions || [])];

  const directRequests = allTasks.filter(
    (t) => t.invitedVolunteer === user._id || (t.invitedVolunteer && t.invitedVolunteer._id === user._id)
  );

  return (
    <div className="container volunteer-portal" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <ProfileAlertBanner user={user} />
      <PayoutBanner />

      <div className="glass-header">
        <h1 style={{ margin: '0 0 8px 0', fontSize: 34, fontWeight: 900, color: 'var(--navy)' }}>
          Welcome back, {user.fullName.split(' ')[0]}!
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--gray)', fontWeight: 500 }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {!user.isVerified && (
        <div className="form-error" style={{ borderRadius: 12, padding: 16, marginBottom: 24, fontWeight: 500 }}>
          ⚠️ You need a Verified Volunteer Badge to claim tasks. Go to your <strong>Profile</strong> tab to complete ID verification.
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="glass-stat-navy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 10, fontSize: 18 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9, letterSpacing: '0.3px' }}>Tasks Completed</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{user.tasksCompleted || 0}</div>
        </div>

        <div className="glass-stat-white">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: 10, fontSize: 18 }}>⏱️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.3px' }}>Hours Volunteered</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: 'var(--navy)' }}>{user.hoursVolunteered || 0}</div>
        </div>

        <div className="glass-stat-amber">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: '8px 10px', borderRadius: 10, fontSize: 18 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9, letterSpacing: '0.3px' }}>Badges Earned</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{user.badges?.length || 0}</div>
        </div>
      </div>

      {/* Coins earned + monthly revenue chart, computed live from
          completed tasks (1 completed task = 1 coin). */}
      <div style={{ marginBottom: 24 }}>
        <EarningsPanel token={token} />
      </div>

      {/* Full claim history — every month claimed, its status, and
          payment reference once the admin marks it paid. */}
      <PayoutHistory />

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      {activeTask ? (
        <ActiveTaskPanel
          task={activeTask}
          token={token}
          onVerify={verifyPin}
          onStatusChange={loadActive}
        />
      ) : (
        <>
          {/* DIRECT REQUESTS */}
          {directRequests.length > 0 && (
            <div style={{ marginBottom: 28, background: '#f3e8ff', border: '2px solid #7c3aed', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 8 }}>
                📩 Direct Requests Sent to You ({directRequests.length})
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#5b21b6' }}>
                The following seniors specifically asked for your assistance!
              </p>
              <div className="task-feed-grid">
                {directRequests.map((t) => (
                  <TaskCard key={t._id} task={t} onClaim={claim} isDirectInvite={true} />
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: 'var(--white)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(11, 37, 69, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#f1f5f9', padding: 8, borderRadius: 10, fontSize: 16 }}>📍</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Location</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{user.subRegion ? `${user.subRegion}, ${user.city}` : user.city}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)' }}>Search Radius:</span>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4 }}>
                {[1, 2, 3, 4].map((km) => (
                  <button
                    key={km}
                    type="button"
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: radiusKm === km ? 'var(--white)' : 'transparent',
                      color: radiusKm === km ? 'var(--navy)' : 'var(--gray)',
                      boxShadow: radiusKm === km ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}
                    onClick={() => setRadiusKm(km)}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAME SUBREGION TASKS */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#047857', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📍 In {user?.subRegion || 'Your Area'}
            </h3>
            {feedData.sameSubRegion?.length > 0 ? (
              <div className="task-feed-grid">
                {feedData.sameSubRegion.map((t) => (
                  <TaskCard key={t._id} task={t} onClaim={claim} />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--gray)', background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                No open requests in {user?.subRegion || 'your region'} right now. Check back soon!
              </div>
            )}
          </div>

          {/* OTHER SUBREGION TASKS */}
          {feedData.otherSubRegions?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d3b66', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🚗 Nearby Requests in {user?.city} ({feedData.otherSubRegions.length})
              </h3>
              <div className="task-feed-grid">
                {feedData.otherSubRegions.map((t) => (
                  <TaskCard key={t._id} task={t} onClaim={claim} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActiveTaskPanel({ task, token, onVerify, onStatusChange }) {
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    let watchId;
    if (navigator.geolocation && (task.status === 'EN_ROUTE' || task.status === 'ASSIGNED')) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          api.updateVolunteerLocation(task._id, { latitude, longitude }, token).catch(() => {});
        },
        (err) => console.warn('GPS tracking error:', err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [task._id, task.status, token]);

  useEffect(() => {
    let interval;
    if (task && ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(task.status)) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [task]);

  async function fetchMessages() {
    try {
      const res = await api.getMessages(task._id, token);
      if (res?.messages) setMessages(res.messages);
    } catch (err) {
      console.warn('Could not fetch messages');
    }
  }

  async function sendTextMsg(e) {
    e.preventDefault();
    if (!msgText.trim()) return;
    try {
      await api.sendMessage(task._id, { text: msgText, type: 'TEXT' }, token);
      setMsgText('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    }
  }

  function openGoogleMapsNavigation() {
    // Prefer GPS coordinates stored on the task (GeoJSON: [longitude, latitude])
    if (
      task.location?.coordinates?.[0] &&
      task.location?.coordinates?.[1] &&
      (task.location.coordinates[0] !== 0 || task.location.coordinates[1] !== 0)
    ) {
      const [lng, lat] = task.location.coordinates;
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
      return;
    }
    // Fallback: use text address
    const destination = encodeURIComponent(
      task.senior?.addressText || task.addressText || ''
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    );
  }

  async function updateStatus(nextStatus) {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await api.updateTaskStatus(
              task._id,
              { status: nextStatus, latitude: pos.coords.latitude, longitude: pos.coords.longitude },
              token
            );
            if (onStatusChange) onStatusChange();
          },
          async () => {
            await api.updateTaskStatus(task._id, { status: nextStatus }, token);
            if (onStatusChange) onStatusChange();
          }
        );
      } else {
        await api.updateTaskStatus(task._id, { status: nextStatus }, token);
        if (onStatusChange) onStatusChange();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

  return (
    <div className="card card-shadow" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className={`status-badge status-${task.status}`}>
          {task.status.replace('_', ' ')}
        </span>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 13, borderColor: '#0d3b66', color: '#0d3b66' }}
          onClick={openGoogleMapsNavigation}
        >
          🗺️ Open in Google Maps
        </button>
      </div>

      <h2>{task.description}</h2>
      <p style={{ margin: '4px 0' }}><strong>Senior:</strong> {task.senior?.fullName}</p>
      <p style={{ margin: '4px 0 16px 0' }}><strong>Address:</strong> {task.addressText || task.senior?.addressText}</p>

      {/* ACTION STEPS */}
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1', marginBottom: 20 }}>
        <h4 style={{ marginTop: 0, marginBottom: 10 }}>🚦 Task Action Steps</h4>

        {task.status === 'ASSIGNED' && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => updateStatus('EN_ROUTE')}
          >
            🚗 Start Journey ("I'm On My Way")
          </button>
        )}

        {task.status === 'EN_ROUTE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
              📡 Live GPS location streaming to senior...
            </div>
            {/* Show senior's pin on a map so volunteer can navigate */}
            {task.location?.coordinates?.[0] && task.location.coordinates[0] !== 0 ? (() => {
              const [lng, lat] = task.location.coordinates;
              return (
                <iframe
                  title="Senior Location Map"
                  width="100%"
                  height="200"
                  style={{ border: '2px solid #047857', borderRadius: 10, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                />
              );
            })() : (
              <div style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '8px 12px', borderRadius: 8 }}>
                📍 Senior address: {task.senior?.addressText || task.addressText}
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ background: '#047857', borderColor: '#047857' }}
              onClick={() => updateStatus('ARRIVED')}
            >
              📍 "I've Arrived at Senior's Location"
            </button>
          </div>
        )}

        {task.status === 'ARRIVED' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: 14, borderRadius: 8 }}>
            <p style={{ fontWeight: 700, margin: '0 0 8px 0', color: '#166534' }}>
              🔑 Ask the senior for their 4-digit Door PIN to complete the task:
            </p>
            <PinEntry onSubmit={onVerify} />
          </div>
        )}
      </div>

      {/* DIRECT CHAT */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
        <h4 style={{ marginTop: 0 }}>💬 Direct Chat with Senior</h4>
        <div style={{ maxHeight: 180, overflowY: 'auto', background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, borderRadius: 6, marginBottom: 10 }}>
          {messages.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: 0 }}>No messages yet. Send a message to coordinate!</p>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 8, fontSize: 13 }}>
                <strong>{m.senderName}:</strong>{' '}
                {m.type === 'VOICE' ? (
                  <audio controls src={m.audioUrl} style={{ display: 'block', height: 32, marginTop: 4 }} />
                ) : (
                  <span>{m.text}</span>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendTextMsg} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}