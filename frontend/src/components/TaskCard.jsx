const CATEGORY_LABELS = {
  GROCERIES: '🛒 Heavy Groceries',
  FIX_BULBS: '💡 Fix & Bulbs',
  TECH_HELP: '📱 Phone & Tech Help',
  PET_CARE: '🐾 Pet & Walk Care',
};

function formatDistance(meters) {
  if (meters == null) return '';
  return meters < 1000 ? `${Math.round(meters)} meters away` : `${(meters / 1000).toFixed(1)} km away`;
}

export default function TaskCard({ task, onClaim }) {
  return (
    <div className="premium-task-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>
          {CATEGORY_LABELS[task.category] || task.category}
        </div>
        <span className={`urgency-tag urgency-${task.urgency}`} style={{ padding: '4px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {task.urgency}
        </span>
      </div>
      
      <p style={{ margin: 0, fontSize: 15, color: '#334155', lineHeight: 1.5, flex: 1 }}>
        {task.description}
      </p>
      
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>📍</span> {formatDistance(task.approxDistanceMeters)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>🕒</span> {new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
      
      <button className="btn btn-primary btn-block" style={{ marginTop: 4, borderRadius: 12, padding: '14px', fontSize: 15 }} onClick={() => onClaim(task._id)}>
        Accept Request
      </button>
    </div>
  );
}
