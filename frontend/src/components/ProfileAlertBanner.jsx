// frontend/src/components/ProfileAlertBanner.jsx

import { useNavigate } from 'react-router-dom';
import { getMissingProfileFields } from '../utils/profileCheck';

export default function ProfileAlertBanner({ user }) {
  const navigate = useNavigate();
  const missingFields = getMissingProfileFields(user);

  if (missingFields.length === 0) return null; // Profile is complete!

  return (
    <div
      className="card card-shadow"
      style={{
        background: '#fff8e6',
        borderLeft: '5px solid #f59e0b',
        padding: '16px 20px',
        marginBottom: '24px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h4 style={{ color: '#b45309', margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Complete Your Profile to Access Full Features
          </h4>
          <p style={{ margin: '6px 0 0 0', color: '#78350f', fontSize: 14 }}>
            Please update the following missing information in your profile:
          </p>
          <ul style={{ margin: '6px 0 0 18px', padding: 0, color: '#92400e', fontSize: 13 }}>
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/profile')}
          style={{ background: '#d97706', borderColor: '#d97706', padding: '8px 16px', fontSize: 14 }}
        >
          ⚙️ Update Profile Now
        </button>
      </div>
    </div>
  );
}