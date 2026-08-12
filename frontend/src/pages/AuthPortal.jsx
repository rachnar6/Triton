import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';

const CITIES = ['Madurai', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Coimbatore', 'Tirunelveli'];

const emptyForm = {
  fullName: '', email: '', password: '', phone: '',
  city: '', addressText: '', dateOfBirth: '',
  emergencyContactName: '', emergencyContactPhone: '',
};

const SENIOR_MIN_AGE = 58;

function calculateAge(dateStr) {
  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// Compute the latest date that makes someone exactly 58 today (for the max attr on the input)
function getMaxDobForAge(minAge) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d.toISOString().split('T')[0]; // yyyy-mm-dd
}

export default function AuthPortal() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const routerState = useLocation().state;

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [role, setRole] = useState(routerState?.role || 'SENIOR');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googlePending, setGooglePending] = useState(null); // {credential, googleProfile} awaiting onboarding

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function routeAfterLogin(user) {
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'VOLUNTEER') navigate('/volunteer');
    else navigate('/senior');
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const { token, user } = await api.login({ email: form.email, password: form.password });
        login(token, user);
        routeAfterLogin(user);
        return;
      }

      // --- Client-side senior age validation ---
      if (role === 'SENIOR') {
        if (!form.dateOfBirth) {
          setError('Date of birth is required for Senior Citizens.');
          return;
        }
        const age = calculateAge(form.dateOfBirth);
        if (age === null) {
          setError('Please enter a valid date of birth.');
          return;
        }
        if (age < SENIOR_MIN_AGE) {
          setError(`You must be at least ${SENIOR_MIN_AGE} years old to register as a Senior Citizen. Your current age: ${age}.`);
          return;
        }
      }

      const { token, user } = await api.register({ ...form, role });
      login(token, user);
      routeAfterLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      const credential = credentialResponse.credential;
      const res = await api.googleAuth({ credential });
      if (res.profileComplete === false) {
        // First-time Google user: show onboarding fields (role/city/phone/address)
        setGooglePending({ credential, googleProfile: res.googleProfile });
        setForm((f) => ({ ...f, fullName: res.googleProfile.name, email: res.googleProfile.email }));
        return;
      }
      login(res.token, res.user);
      routeAfterLogin(res.user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeGoogleOnboarding(e) {
    e.preventDefault();
    setError('');
    try {
      // --- Client-side senior age validation for Google onboarding ---
      if (role === 'SENIOR') {
        if (!form.dateOfBirth) {
          setError('Date of birth is required for Senior Citizens.');
          return;
        }
        const age = calculateAge(form.dateOfBirth);
        if (age === null) {
          setError('Please enter a valid date of birth.');
          return;
        }
        if (age < SENIOR_MIN_AGE) {
          setError(`You must be at least ${SENIOR_MIN_AGE} years old to register as a Senior Citizen. Your current age: ${age}.`);
          return;
        }
      }

      const res = await api.googleAuth({
        credential: googlePending.credential,
        role,
        city: form.city,
        addressText: form.addressText,
        phone: form.phone,
        dateOfBirth: role === 'SENIOR' ? form.dateOfBirth : undefined,
      });
      login(res.token, res.user);
      routeAfterLogin(res.user);
    } catch (err) {
      setError(err.message);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className="nc-auth">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700;800&family=Caveat:wght@500;600&display=swap');

        .nc-auth {
          --nc-teal-900: #123B32;
          --nc-teal-700: #1F6F5C;
          --nc-teal-500: #3C8C77;
          --nc-marigold-500: #E8A33D;
          --nc-marigold-300: #F2C877;
          --nc-cream: #FBF3E1;
          --nc-clay: #C97B63;
          --nc-ink: #16241F;
          --nc-ink-muted: #5B6B63;
          font-family: 'Manrope', sans-serif;
          color: var(--nc-ink);
        }

        .nc-auth__stage {
          display: grid;
          grid-template-columns: minmax(360px, 1.05fr) minmax(360px, 1fr);
          min-height: 100vh;
        }

        /* ---------- left: illustration panel ---------- */

        .nc-auth__illustration {
          position: relative;
          background: linear-gradient(160deg, var(--nc-teal-900) 0%, var(--nc-teal-700) 100%);
          padding: 56px 48px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .nc-auth__illustration::before {
          content: '';
          position: absolute;
          inset: -20% -10% auto auto;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(232, 163, 61, 0.16), transparent 70%);
          pointer-events: none;
        }

        .nc-auth__illustration-inner {
          position: relative;
          z-index: 1;
          max-width: 480px;
          margin: 0 auto;
          animation: nc-fade-up 0.6s ease both;
        }

        .nc-eyebrow {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--nc-marigold-300);
          margin-bottom: 14px;
        }

        .nc-headline {
          font-family: 'DM Serif Display', serif;
          font-weight: 400;
          font-size: clamp(2rem, 3.4vw, 3rem);
          line-height: 1.08;
          color: var(--nc-cream);
          margin: 0 0 14px;
        }

        .nc-subhead {
          font-size: 1.02rem;
          line-height: 1.6;
          color: rgba(251, 243, 225, 0.78);
          max-width: 42ch;
          margin: 0 0 8px;
        }

        .nc-scene {
          width: 100%;
          max-width: 460px;
          display: block;
          margin: 18px auto 6px;
        }

        .nc-caption {
          font-family: 'Caveat', cursive;
          font-size: 1.4rem;
          color: var(--nc-marigold-300);
          transform: rotate(-1.5deg);
          margin: 0 0 22px;
        }

        .nc-categories {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 22px;
          padding: 0;
          margin: 0;
          border-top: 1px solid rgba(251, 243, 225, 0.16);
          padding-top: 18px;
        }

        .nc-categories li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(251, 243, 225, 0.85);
        }

        .nc-categories svg {
          color: var(--nc-marigold-300);
          flex-shrink: 0;
        }

        /* ---------- right: form panel ---------- */

        .nc-auth__panel {
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          overflow-y: auto;
        }

        .nc-auth__panel-inner {
          width: 100%;
          max-width: 440px;
          animation: nc-fade-up 0.6s ease 0.1s both;
        }

        .nc-auth__panel-head h2 {
          font-family: 'DM Serif Display', serif;
          font-weight: 400;
          font-size: 1.8rem;
          color: var(--nc-ink);
          margin: 0 0 6px;
        }

        .nc-auth__panel-head p {
          font-size: 0.95rem;
          color: var(--nc-ink-muted);
          margin: 0 0 24px;
        }

        .nc-role-tabs {
          display: flex;
          gap: 4px;
          background: #F1EAD9;
          padding: 4px;
          border-radius: 999px;
          margin-bottom: 22px;
        }

        .nc-role-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 12px;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: var(--nc-ink-muted);
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 0.86rem;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .nc-role-tab.is-active {
          background: var(--nc-teal-700);
          color: var(--nc-cream);
          box-shadow: 0 6px 14px -6px rgba(18, 59, 50, 0.5);
        }

        .nc-alert {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.88rem;
          margin-bottom: 16px;
          border-left: 4px solid transparent;
        }

        .nc-alert--error {
          background: #FBEAE6;
          color: #8A3B25;
          border-left-color: var(--nc-clay);
        }

        .nc-alert--success {
          background: #E8F3EC;
          color: var(--nc-teal-700);
          border-left-color: var(--nc-teal-500);
        }

        .nc-card {
          background: #ffffff;
          border: 1px solid #EDE6D4;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: 0 16px 32px -22px rgba(18, 59, 50, 0.3);
        }

        .nc-card--google {
          padding: 16px;
          display: flex;
          justify-content: center;
        }

        .nc-welcome-note {
          font-size: 0.95rem;
          color: var(--nc-ink-muted);
          margin: 0 0 18px;
        }

        .nc-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9A9284;
          font-size: 0.8rem;
          margin: 22px 0;
        }

        .nc-divider::before,
        .nc-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8E1D0;
        }

        .nc-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .nc-field label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--nc-ink);
        }

        .nc-field label span {
          font-weight: 400;
          color: #9A9284;
          margin-left: 4px;
        }

        .nc-auth .nc-field input,
        .nc-auth .nc-field select {
          font-family: 'Manrope', sans-serif;
          font-size: 0.95rem;
          padding: 10px 12px;
          border: 1.5px solid #E7DFCB;
          border-radius: 10px;
          background: #FDFBF6;
          color: var(--nc-ink);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .nc-auth .nc-field input:focus,
        .nc-auth .nc-field select:focus {
          outline: none;
          border-color: var(--nc-teal-500);
          box-shadow: 0 0 0 3px rgba(31, 111, 92, 0.15);
        }

        .nc-btn--primary {
          width: 100%;
          padding: 13px 18px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--nc-teal-700), var(--nc-teal-900));
          color: #fff;
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 12px 24px -12px rgba(18, 59, 50, 0.55);
          transition: transform 0.15s ease;
        }

        .nc-btn--primary:hover { transform: translateY(-1px); }
        .nc-btn--primary:active { transform: translateY(0); }

        .nc-switch {
          text-align: center;
          font-size: 0.9rem;
          color: var(--nc-ink-muted);
          margin-top: 4px;
        }

        .nc-link {
          background: none;
          border: none;
          color: var(--nc-teal-700);
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          font: inherit;
          padding: 0;
        }

        .nc-auth button:focus-visible,
        .nc-auth a:focus-visible,
        .nc-auth input:focus-visible,
        .nc-auth select:focus-visible {
          outline: 2px solid var(--nc-marigold-500);
          outline-offset: 2px;
        }

        @keyframes nc-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .nc-auth *, .nc-auth *::before, .nc-auth *::after {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 900px) {
          .nc-auth__stage {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .nc-auth__illustration {
            padding: 36px 24px;
          }
          .nc-scene { max-width: 320px; }
          .nc-categories { padding-top: 14px; }
          .nc-auth__panel { padding: 36px 24px 48px; }
        }

        @media (max-width: 480px) {
          .nc-auth__illustration { padding: 28px 20px; }
          .nc-headline { font-size: 1.7rem; }
          .nc-card { padding: 18px; }
        }
      `}</style>

      <div className="nc-auth__stage">
        <aside className="nc-auth__illustration">
          <div className="nc-auth__illustration-inner">
            <span className="nc-eyebrow">NeighborCare</span>
            <h1 className="nc-headline">Help is only a few doors away.</h1>
            <p className="nc-subhead">
              Seniors ask, neighbors answer. Groceries, a ride to the clinic, someone to talk to — no task too small.
            </p>

            <NeighborhoodScene />
            <p className="nc-caption">It starts with a hello next door.</p>

            <ul className="nc-categories">
              <li><CategoryIcon type="bag" /> Groceries</li>
              <li><CategoryIcon type="pill" /> Medicine</li>
              <li><CategoryIcon type="heart" /> Company</li>
              <li><CategoryIcon type="bulb" /> Small fixes</li>
            </ul>
          </div>
        </aside>

        <main className="nc-auth__panel">
          <div className="nc-auth__panel-inner">
            <div className="nc-auth__panel-head">
              <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
              <p>
                {isRegister
                  ? 'Join as a senior looking for a hand, or a neighbor ready to give one.'
                  : 'Sign in to pick up where you left off.'}
              </p>
            </div>

            {!googlePending && <RoleTabs role={role} setRole={setRole} />}

            {error && <div className="nc-alert nc-alert--error">{error}</div>}
            {success && <div className="nc-alert nc-alert--success">{success}</div>}

            {googlePending ? (
              <form onSubmit={completeGoogleOnboarding} className="nc-card">
                <p className="nc-welcome-note">
                  Welcome, {googlePending.googleProfile.name}. A few more details and you're set.
                </p>

                <RoleTabs role={role} setRole={setRole} />

                <OnboardingFields form={form} set={set} />
                {role === 'SENIOR' && (
                  <div className="nc-field">
                    <label>Date of birth <span style={{color:'#e74c3c',fontWeight:700}}>*</span></label>
                    <input
                      type="date"
                      required
                      max={getMaxDobForAge(SENIOR_MIN_AGE)}
                      value={form.dateOfBirth}
                      onChange={(e) => set('dateOfBirth', e.target.value)}
                    />
                    <small style={{opacity:0.65,fontSize:'0.8rem',marginTop:4,display:'block'}}>You must be {SENIOR_MIN_AGE}+ years old to register as a Senior Citizen.</small>
                  </div>
                )}
                <button type="submit" className="nc-btn--primary">Finish setup</button>
              </form>
            ) : (
              <>
                <div className="nc-card nc-card--google">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed')}
                    width="100%"
                  />
                </div>

                <div className="nc-divider">Or continue with email</div>

                <form onSubmit={handleManualSubmit} className="nc-card">
                  {isRegister && (
                    <div className="nc-field">
                      <label>Full name</label>
                      <input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
                    </div>
                  )}
                  <div className="nc-field">
                    <label>Email address</label>
                    <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
                  </div>
                  <div className="nc-field">
                    <label>Password</label>
                    <input type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} />
                  </div>

                  {isRegister && (
                    <>
                      <OnboardingFields form={form} set={set} />
                      {role === 'SENIOR' && (
                        <>
                          <div className="nc-field">
                            <label>Date of birth <span style={{color:'#e74c3c',fontWeight:700}}>*</span></label>
                            <input
                              type="date"
                              required
                              max={getMaxDobForAge(SENIOR_MIN_AGE)}
                              value={form.dateOfBirth}
                              onChange={(e) => set('dateOfBirth', e.target.value)}
                            />
                            <small style={{opacity:0.65,fontSize:'0.8rem',marginTop:4,display:'block'}}>You must be {SENIOR_MIN_AGE}+ years old to register as a Senior Citizen.</small>
                          </div>
                          <div className="nc-field">
                            <label>Emergency contact name <span>(optional)</span></label>
                            <input value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
                          </div>
                          <div className="nc-field">
                            <label>Emergency contact phone <span>(optional)</span></label>
                            <input value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <button type="submit" className="nc-btn--primary">
                    {isRegister ? 'Create account' : 'Sign in'}
                  </button>
                </form>

                <p className="nc-switch">
                  {isRegister ? 'Already have an account?' : 'New here?'}{' '}
                  <button type="button" className="nc-link" onClick={() => setMode(isRegister ? 'login' : 'register')}>
                    {isRegister ? 'Sign in' : 'Register'}
                  </button>
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function RoleTabs({ role, setRole }) {
  return (
    <div className="nc-role-tabs" role="tablist" aria-label="Choose your role">
      <button
        type="button"
        role="tab"
        aria-selected={role === 'SENIOR'}
        className={`nc-role-tab ${role === 'SENIOR' ? 'is-active' : ''}`}
        onClick={() => setRole('SENIOR')}
      >
        <RoleIcon type="senior" />
        Senior Citizen
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={role === 'VOLUNTEER'}
        className={`nc-role-tab ${role === 'VOLUNTEER' ? 'is-active' : ''}`}
        onClick={() => setRole('VOLUNTEER')}
      >
        <RoleIcon type="volunteer" />
        Volunteer
      </button>
    </div>
  );
}

function OnboardingFields({ form, set }) {
  return (
    <>
      <div className="nc-field">
        <label>Phone number</label>
        <input type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>
      <div className="nc-field">
        <label>City</label>
        <select required value={form.city} onChange={(e) => set('city', e.target.value)}>
          <option value="">Select your city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="nc-field">
        <label>Street address / landmark</label>
        <input
          required
          value={form.addressText}
          onChange={(e) => set('addressText', e.target.value)}
          placeholder="e.g. 12 Oak Street, near City Park"
        />
      </div>
    </>
  );
}

/* ---------- signature illustration: two homes, one footpath ---------- */

function NeighborhoodScene() {
  return (
    <svg className="nc-scene" viewBox="0 0 640 360" fill="none" aria-hidden="true">
      {/* ground */}
      <path d="M-10,300 Q160,270 320,296 T650,278 L650,370 L-10,370 Z" fill="#FBF3E1" fillOpacity="0.06" />

      {/* scattered petals, top-left */}
      <circle cx="70" cy="60" r="3" fill="#FBF3E1" fillOpacity="0.35" />
      <circle cx="95" cy="92" r="2.4" fill="#FBF3E1" fillOpacity="0.3" />
      <circle cx="58" cy="112" r="2" fill="#FBF3E1" fillOpacity="0.25" />

      {/* sun */}
      <ellipse cx="560" cy="70" rx="46" ry="30" fill="none" stroke="#F2C877" strokeOpacity="0.25" strokeDasharray="2 6" />
      <g stroke="#F2C877" strokeWidth="3" strokeLinecap="round">
        <line x1="582" y1="70" x2="594" y2="70" />
        <line x1="575.5" y1="85.5" x2="584" y2="94" />
        <line x1="560" y1="92" x2="560" y2="104" />
        <line x1="544.5" y1="85.5" x2="536" y2="94" />
        <line x1="538" y1="70" x2="526" y2="70" />
        <line x1="544.5" y1="54.5" x2="536" y2="46" />
        <line x1="560" y1="48" x2="560" y2="36" />
        <line x1="575.5" y1="54.5" x2="584" y2="46" />
      </g>
      <circle cx="560" cy="70" r="16" fill="#E8A33D" />

      {/* footpath connecting the two homes */}
      <path d="M142,316 Q300,344 458,316" stroke="#F2C877" strokeWidth="3" strokeDasharray="1 14" strokeLinecap="round" />
      <g fill="#FBF3E1" fillOpacity="0.5">
        <ellipse cx="226" cy="330" rx="3" ry="6" transform="rotate(-10 226 330)" />
        <ellipse cx="236" cy="334" rx="3" ry="6" transform="rotate(10 236 334)" />
        <ellipse cx="364" cy="334" rx="3" ry="6" transform="rotate(-10 364 334)" />
        <ellipse cx="374" cy="330" rx="3" ry="6" transform="rotate(10 374 330)" />
      </g>

      {/* house A — senior's home */}
      <polygon points="80,268 130,224 180,268" fill="#E8A33D" />
      <rect x="152" y="205" width="9" height="30" fill="#F2C877" />
      <circle cx="156" cy="196" r="3" fill="#FBF3E1" fillOpacity="0.5" />
      <circle cx="160" cy="186" r="4" fill="#FBF3E1" fillOpacity="0.4" />
      <rect x="90" y="268" width="80" height="64" rx="6" fill="#FBF3E1" />
      <rect x="100" y="280" width="18" height="18" rx="3" fill="#1F6F5C" />
      <line x1="109" y1="280" x2="109" y2="298" stroke="#FBF3E1" strokeWidth="1.4" />
      <line x1="100" y1="289" x2="118" y2="289" stroke="#FBF3E1" strokeWidth="1.4" />
      <rect x="118" y="300" width="24" height="32" rx="3" fill="#C97B63" />

      {/* house B — volunteer's home */}
      <polygon points="420,268 470,224 520,268" fill="#3C8C77" />
      <rect x="430" y="268" width="80" height="64" rx="6" fill="#FBF3E1" />
      <rect x="490" y="280" width="18" height="18" rx="3" fill="#1F6F5C" />
      <line x1="499" y1="280" x2="499" y2="298" stroke="#FBF3E1" strokeWidth="1.4" />
      <line x1="490" y1="289" x2="508" y2="289" stroke="#FBF3E1" strokeWidth="1.4" />
      <rect x="458" y="300" width="24" height="32" rx="3" fill="#E8A33D" />

      {/* senior on a bench */}
      <rect x="195" y="316" width="40" height="6" rx="3" fill="#3C8C77" fillOpacity="0.6" />
      <line x1="199" y1="322" x2="199" y2="330" stroke="#3C8C77" strokeWidth="3" strokeLinecap="round" />
      <line x1="231" y1="322" x2="231" y2="330" stroke="#3C8C77" strokeWidth="3" strokeLinecap="round" />
      <rect x="205" y="286" width="22" height="30" rx="10" fill="#C97B63" />
      <circle cx="216" cy="278" r="10" fill="#FBF3E1" stroke="#123B32" strokeOpacity="0.15" />
      <path d="M207,275 Q216,262 226,275" fill="none" stroke="#F2C877" strokeWidth="3" strokeLinecap="round" />
      <line x1="228" y1="300" x2="232" y2="318" stroke="#F2C877" strokeWidth="2" strokeLinecap="round" />

      {/* volunteer with a grocery basket */}
      <rect x="418" y="282" width="22" height="34" rx="10" fill="#3C8C77" />
      <circle cx="429" cy="274" r="10" fill="#FBF3E1" stroke="#123B32" strokeOpacity="0.15" />
      <line x1="422" y1="316" x2="420" y2="330" stroke="#1F6F5C" strokeWidth="4" strokeLinecap="round" />
      <line x1="434" y1="316" x2="436" y2="330" stroke="#1F6F5C" strokeWidth="4" strokeLinecap="round" />
      <line x1="440" y1="290" x2="452" y2="284" stroke="#3C8C77" strokeWidth="5" strokeLinecap="round" />
      <line x1="418" y1="298" x2="402" y2="312" stroke="#3C8C77" strokeWidth="5" strokeLinecap="round" />
      <path d="M394,308 Q401,296 408,308" fill="none" stroke="#F2C877" strokeWidth="2" />
      <rect x="390" y="308" width="22" height="16" rx="4" fill="#E8A33D" />
      <circle cx="396" cy="312" r="2" fill="#FBF3E1" />
      <circle cx="404" cy="312" r="2" fill="#FBF3E1" />
    </svg>
  );
}

function CategoryIcon({ type }) {
  const common = { width: 16, height: 16, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (type === 'bag') {
    return (
      <svg {...common}>
        <path d="M5 7h10l-1 9a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7z" />
        <path d="M7.5 7V5.5a2.5 2.5 0 015 0V7" />
      </svg>
    );
  }
  if (type === 'pill') {
    return (
      <svg {...common}>
        <g transform="rotate(-35 10 10)">
          <rect x="4" y="7" width="12" height="6" rx="3" />
          <line x1="10" y1="7" x2="10" y2="13" />
        </g>
      </svg>
    );
  }
  if (type === 'heart') {
    return (
      <svg {...common}>
        <path d="M10 17s-6-4.35-6-8.5A3.5 3.5 0 0110 6a3.5 3.5 0 016 2.5c0 4.15-6 8.5-6 8.5z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10 3a5 5 0 00-3 9c.5.4.8 1 .8 1.6V15h4.4v-1.4c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z" />
      <line x1="8.3" y1="17" x2="11.7" y2="17" />
    </svg>
  );
}

function RoleIcon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (type === 'senior') {
    return (
      <svg {...common}>
        <path d="M3 10l7-6 7 6" />
        <path d="M5 9v7a1 1 0 001 1h8a1 1 0 001-1V9" />
        <path d="M10 17v-3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 11V5a1.3 1.3 0 012.6 0v4" />
      <path d="M8.6 9V4a1.3 1.3 0 012.6 0v5" />
      <path d="M11.2 9.3V5a1.3 1.3 0 012.6 0v6" />
      <path d="M13.8 9.5a1.3 1.3 0 012.6.2v3.3c0 3-2.2 5-5.4 5-2.4 0-3.6-.8-4.8-2.4L4 12.8c-.5-.7-.2-1.7.6-2 .6-.2 1.2 0 1.6.5L7 12" />
    </svg>
  );
}