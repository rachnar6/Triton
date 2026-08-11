import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';
import ProfileAlertBanner from '../components/ProfileAlertBanner.jsx';

const CITIES = ['Tirunelveli', 'Madurai', 'Chennai', 'Coimbatore', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'];

const SUB_REGIONS = {
  Tirunelveli: ['Palayamkottai', 'Vannarpettai', 'Melapalayam', 'Tirunelveli Town', 'Pettai', 'Tachchanallur'],
  Madurai: ['KK Nagar', 'Anna Nagar', 'Simmakkal', 'Goripalayam', 'TVS Nagar'],
  Chennai: ['Adyar', 'Anna Nagar', 'T. Nagar', 'Velachery', 'Mylapore'],
  Coimbatore: ['Gandhipuram', 'RS Puram', 'Peelamedu', 'Singanallur'],
  Bangalore: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Jayanagar'],
};

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Helper1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Helper2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Helper3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Senior1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Senior2',
];

function validateAadhaarFormat(num) {
  if (!/^\d{12}$/.test(num)) return false;
  return true;
}

/* ---------------------------------------------------------------- */
/* Lightweight line-icon set (no external icon dependency required)  */
/* ---------------------------------------------------------------- */

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconCamera = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.4" />
  </svg>
);

const IconEdit = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconPin = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);

const IconShield = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3l7 3v6c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6z" />
  </svg>
);

const IconCheck = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconAlert = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
);

const IconRefresh = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 4v5h-5" />
  </svg>
);

const IconArrowLeft = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="M11 18l-6-6 6-6" />
  </svg>
);

const IconMail = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const IconPhone = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 1h2a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.7a2 2 0 0 1-.5 2.1L7.1 8.6a16 16 0 0 0 6.3 6.3l1.1-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2.1z" />
  </svg>
);

/* ---------------------------------------------------------------- */

export default function ProfilePortal() {
  const { user, token, login } = useAuth();

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    city: user?.city || '',
    subRegion: user?.subRegion || '',
    addressText: user?.addressText || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

  // Verification State (Volunteer ID & OTP)
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1 = Captcha & ID, 2 = Enter OTP
  const [otpTxnId, setOtpTxnId] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  function generateCaptcha() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(code);
    setUserCaptcha('');
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAadhaarChange(e) {
    const val = e.target.value.replace(/\D/g, '');
    setAadhaarInput(val);

    if (val.length === 12) {
      setIsFormatValid(validateAadhaarFormat(val));
    } else {
      setIsFormatValid(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await api.updateProfile(form, token);
      login(token, res.user);
      setSuccess('Profile updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function selectAvatar(avatarUrl) {
    try {
      const res = await api.updateProfile({ profilePicture: avatarUrl }, token);
      if (res.user) {
        login(token, res.user);
        setShowAvatarModal(false);
      }
    } catch (err) {
      alert('Failed to update profile picture');
    }
  }

  async function handleSendOtp() {
    setError('');
    setSuccess('');

    if (!isFormatValid) {
      return setError('Please enter a valid 12-digit document number sequence.');
    }

    if (userCaptcha.toUpperCase() !== captchaText) {
      setError('Incorrect Captcha code. Please try again.');
      generateCaptcha();
      return;
    }

    setVerifying(true);
    try {
      const res = await api.requestAadhaarOtp(
        {
          aadhaarNumber: aadhaarInput,
          captchaInput: userCaptcha,
        },
        token
      );
      setOtpTxnId(res.otpTxnId);
      setOtpStep(2);
      setSuccess('OTP sent to the mobile number registered with your document!');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
      generateCaptcha();
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(userOtp)) {
      return setError('Please enter a valid 6-digit OTP.');
    }

    setVerifying(true);
    try {
      const res = await api.verifyAadhaarOtp(
        {
          otp: userOtp,
          otpTxnId,
          aadhaarNumber: aadhaarInput,
        },
        token
      );
      login(token, res.user);
      setSuccess('Identity successfully verified. Verified volunteer badge assigned.');
      setOtpStep(1);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please check the digits and try again.');
    } finally {
      setVerifying(false);
    }
  }

  if (!user) {
    return (
      <div className="pp-loading">
        <style>{PP_STYLES}</style>
        <span className="pp-spinner" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="pp-page">
      <style>{PP_STYLES}</style>

      <div className="pp-shell">
        <ProfileAlertBanner user={user} />

        {error && (
          <div className="pp-banner pp-banner--error">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="pp-banner pp-banner--success">
            <IconCheck />
            <span>{success}</span>
          </div>
        )}

        {/* HEADER CARD */}
        <section className="pp-card pp-header">
          <div className="pp-header__accent" />
          <div className="pp-header__row">
            <button
              type="button"
              className="pp-avatar"
              onClick={() => setShowAvatarModal(true)}
              aria-label="Change profile picture"
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="" />
              ) : (
                <span>{user.fullName.charAt(0).toUpperCase()}</span>
              )}
              <span className="pp-avatar__badge">
                <IconCamera />
              </span>
            </button>

            <div className="pp-header__info">
              <div className="pp-header__title-row">
                <h1>{user.fullName}</h1>
                <span className={`pp-tag pp-tag--role pp-tag--${String(user.role).toLowerCase()}`}>
                  {user.role}
                </span>
                {user.isVerified ? (
                  <span className="pp-tag pp-tag--verified">
                    <IconCheck /> Verified ID
                  </span>
                ) : (
                  <span className="pp-tag pp-tag--pending">
                    <IconAlert /> ID pending
                  </span>
                )}
              </div>
              <p className="pp-header__meta">
                <IconPin />
                {user.subRegion ? `${user.subRegion}, ` : ''}
                {user.city}
                <span className="pp-dot" />
                Registered user
              </p>
            </div>

            <button type="button" className="pp-btn pp-btn--outline" onClick={() => setShowEditModal(true)}>
              <IconEdit /> Edit profile
            </button>
          </div>
        </section>

        {/* READ-ONLY INFORMATION SECTIONS */}
        <div className="pp-grid">
          <section className="pp-card pp-panel">
            <h3 className="pp-panel__title">Personal details</h3>
            <dl className="pp-fields">
              <div className="pp-field">
                <dt>Full name</dt>
                <dd>{user.fullName}</dd>
              </div>
              <div className="pp-field">
                <dt><IconMail /> Email address</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="pp-field">
                <dt><IconPhone /> Phone number</dt>
                <dd>{user.phone || <span className="pp-muted">Not provided</span>}</dd>
              </div>
              {user.role === 'SENIOR' && (
                <>
                  <div className="pp-field">
                    <dt>Emergency contact</dt>
                    <dd>{user.emergencyContactName || <span className="pp-muted">Not specified</span>}</dd>
                  </div>
                  <div className="pp-field">
                    <dt>Emergency contact phone</dt>
                    <dd>{user.emergencyContactPhone || <span className="pp-muted">Not specified</span>}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="pp-card pp-panel">
            <h3 className="pp-panel__title">Location &amp; neighbourhood</h3>
            <dl className="pp-fields">
              <div className="pp-field">
                <dt>City</dt>
                <dd>{user.city}</dd>
              </div>
              <div className="pp-field">
                <dt>Specific region / division</dt>
                <dd>{user.subRegion || <span className="pp-muted">Not specified</span>}</dd>
              </div>
              <div className="pp-field">
                <dt>Street address</dt>
                <dd>{user.addressText}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* VOLUNTEER IDENTITY & BADGE VERIFICATION */}
        {user.role === 'VOLUNTEER' && (
          <section className="pp-card pp-verify">
            <div className="pp-verify__head">
              <div className="pp-verify__title">
                <IconShield />
                <div>
                  <h3>Identity &amp; badge verification</h3>
                  <p>
                    Status:{' '}
                    <strong className={user.isVerified ? 'pp-status-ok' : 'pp-status-warn'}>
                      {user.isVerified ? 'Verified volunteer badge active' : 'Unverified'}
                    </strong>
                  </p>
                </div>
              </div>
              {!user.isVerified && (
                <span className="pp-step-indicator">Step {otpStep} of 2</span>
              )}
            </div>

            {!user.isVerified && (
              <div className="pp-verify__body">
                {otpStep === 1 ? (
                  <>
                    <div className="pp-form-field">
                      <label>12-digit government ID number</label>
                      <input
                        type="text"
                        maxLength={12}
                        value={aadhaarInput}
                        onChange={handleAadhaarChange}
                        placeholder="Enter 12-digit number"
                        inputMode="numeric"
                        className="pp-input pp-input--mono"
                      />
                      {aadhaarInput.length === 12 && (
                        <div className={`pp-hint ${isFormatValid ? 'pp-hint--ok' : 'pp-hint--bad'}`}>
                          {isFormatValid ? (
                            <>
                              <IconCheck /> Valid document format
                            </>
                          ) : (
                            <>
                              <IconAlert /> Invalid document number sequence
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pp-form-field">
                      <label>Captcha verification</label>
                      <div className="pp-captcha-row">
                        <div className="pp-stamp">
                          <span className="pp-stamp__label">verify</span>
                          <span className="pp-stamp__code">{captchaText}</span>
                        </div>
                        <button type="button" className="pp-btn pp-btn--ghost" onClick={generateCaptcha}>
                          <IconRefresh /> Refresh
                        </button>
                      </div>
                      <input
                        type="text"
                        value={userCaptcha}
                        onChange={(e) => setUserCaptcha(e.target.value)}
                        placeholder="Enter the captcha code shown above"
                        className="pp-input"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={verifying || !isFormatValid || !userCaptcha}
                      className="pp-btn pp-btn--primary pp-btn--block"
                      onClick={handleSendOtp}
                    >
                      {verifying ? 'Sending OTP…' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="pp-otp-lead">
                      <IconPhone /> Enter the 6-digit OTP sent to your registered mobile phone.
                    </p>

                    <div className="pp-form-field">
                      <label>6-digit verification OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={userOtp}
                        onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 123456"
                        inputMode="numeric"
                        className="pp-input pp-input--mono pp-input--otp"
                      />
                    </div>

                    <div className="pp-btn-row">
                      <button
                        type="button"
                        disabled={verifying || userOtp.length !== 6}
                        className="pp-btn pp-btn--primary"
                        onClick={handleVerifyOtp}
                      >
                        {verifying ? 'Verifying…' : 'Verify & claim badge'}
                      </button>
                      <button type="button" className="pp-btn pp-btn--outline" onClick={() => setOtpStep(1)}>
                        <IconArrowLeft /> Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="pp-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <form
            onSubmit={handleSubmit}
            className="pp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="pp-modal__title">Edit profile information</h2>

            <div className="pp-form-field">
              <label>Full name</label>
              <input
                type="text"
                required
                className="pp-input"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </div>

            <div className="pp-form-field">
              <label>Phone number</label>
              <input
                type="tel"
                required
                className="pp-input"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>

            <div className="pp-form-field">
              <label>City</label>
              <select
                required
                className="pp-input"
                value={form.city}
                onChange={(e) => {
                  set('city', e.target.value);
                  set('subRegion', '');
                }}
              >
                <option value="">Select your city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {form.city && SUB_REGIONS[form.city] && (
              <div className="pp-form-field">
                <label>Specific region / division</label>
                <select
                  required
                  className="pp-input"
                  value={form.subRegion}
                  onChange={(e) => set('subRegion', e.target.value)}
                >
                  <option value="">Select your region in {form.city}</option>
                  {SUB_REGIONS[form.city].map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pp-form-field">
              <label>Street address / landmark</label>
              <input
                type="text"
                required
                className="pp-input"
                value={form.addressText}
                onChange={(e) => set('addressText', e.target.value)}
              />
            </div>

            {user.role === 'SENIOR' && (
              <>
                <div className="pp-form-field">
                  <label>Emergency contact name</label>
                  <input
                    type="text"
                    className="pp-input"
                    value={form.emergencyContactName}
                    onChange={(e) => set('emergencyContactName', e.target.value)}
                  />
                </div>
                <div className="pp-form-field">
                  <label>Emergency contact phone number</label>
                  <input
                    type="tel"
                    className="pp-input"
                    value={form.emergencyContactPhone}
                    onChange={(e) => set('emergencyContactPhone', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="pp-btn-row pp-btn-row--modal">
              <button type="submit" disabled={saving} className="pp-btn pp-btn--primary">
                {saving ? 'Saving changes…' : 'Save profile changes'}
              </button>
              <button type="button" className="pp-btn pp-btn--outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AVATAR SELECTOR MODAL */}
      {showAvatarModal && (
        <div className="pp-modal-backdrop" onClick={() => setShowAvatarModal(false)}>
          <div className="pp-modal pp-modal--narrow" onClick={(e) => e.stopPropagation()}>
            <h3 className="pp-modal__title">Choose profile picture</h3>
            <div className="pp-avatar-grid">
              {DEFAULT_AVATARS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  className="pp-avatar-option"
                  onClick={() => selectAvatar(url)}
                  aria-label={`Select avatar ${i + 1}`}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pp-btn pp-btn--outline pp-btn--block"
              onClick={() => setShowAvatarModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Scoped stylesheet — NeighborCare identity (shared with AuthPortal)*/
/* ---------------------------------------------------------------- */

const PP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

.pp-page {
  --pp-teal-900: #123B32;
  --pp-teal-700: #1F6F5C;
  --pp-teal-500: #3C8C77;
  --pp-teal-tint: #E8F3EE;
  --pp-marigold-500: #E8A33D;
  --pp-marigold-300: #F2C877;
  --pp-marigold-tint: #FCF1DD;
  --pp-cream: #FBF3E1;
  --pp-clay: #C97B63;
  --pp-clay-tint: #FBEAE6;
  --pp-bg: #F6F2E9;
  --pp-card: #ffffff;
  --pp-border: #E8E1D0;
  --pp-text: #16241F;
  --pp-muted: #6B776F;
  --pp-success-bg: #E8F3EC;
  --pp-success-text: #1F6F5C;
  --pp-warn-bg: #FCF1DD;
  --pp-warn-text: #8A5A16;
  --pp-danger-bg: #FBEAE6;
  --pp-danger-text: #8A3B25;
  --pp-radius: 18px;
  --pp-shadow: 0 1px 2px rgba(18, 59, 50, 0.04), 0 16px 32px -22px rgba(18, 59, 50, 0.25);
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--pp-text);
  background: var(--pp-bg);
  min-height: 100%;
  padding: 32px 20px 56px;
}

.pp-page * { box-sizing: border-box; }
.pp-page h1, .pp-page h2, .pp-page h3 { font-family: 'DM Serif Display', serif; font-weight: 400; margin: 0; }

.pp-shell { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

.pp-loading {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  padding: 60px 0; color: var(--pp-muted, #6B776F); font-family: 'Manrope', sans-serif; font-size: 14px;
}
.pp-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid #E8E1D0; border-top-color: #1F6F5C;
  animation: pp-spin 0.7s linear infinite;
}
@keyframes pp-spin { to { transform: rotate(360deg); } }

.pp-card {
  background: var(--pp-card);
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius);
  box-shadow: var(--pp-shadow);
}

/* Banners */
.pp-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 600;
  border-left: 4px solid transparent;
}
.pp-banner svg { flex-shrink: 0; }
.pp-banner--error { background: var(--pp-danger-bg); color: var(--pp-danger-text); border-left-color: var(--pp-clay); }
.pp-banner--success { background: var(--pp-success-bg); color: var(--pp-success-text); border-left-color: var(--pp-teal-500); }

/* Header */
.pp-header { position: relative; padding: 30px 28px 26px; overflow: hidden; }
.pp-header__accent {
  position: absolute; top: 0; left: 0; right: 0; height: 6px;
  background: linear-gradient(90deg, var(--pp-teal-900), var(--pp-teal-500) 55%, var(--pp-marigold-500));
}
.pp-header__row { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }

.pp-avatar {
  position: relative; width: 92px; height: 92px; border-radius: 50%;
  border: none; padding: 0; cursor: pointer; flex-shrink: 0;
  background: linear-gradient(135deg, var(--pp-teal-900), var(--pp-teal-500));
  color: #fff; font-family: 'DM Serif Display', serif; font-size: 34px; font-weight: 400;
  display: flex; align-items: center; justify-content: center;
  overflow: visible;
  box-shadow: 0 0 0 4px #fff, 0 0 0 6px var(--pp-marigold-tint);
}
.pp-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.pp-avatar__badge {
  position: absolute; bottom: -2px; right: -2px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--pp-marigold-500); color: #fff;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}

.pp-header__info { flex: 1; min-width: 220px; }
.pp-header__title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-header__title-row h1 { font-size: 24px; color: var(--pp-teal-900); }

.pp-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Manrope', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px;
}
.pp-tag svg { width: 12px; height: 12px; }
.pp-tag--role { background: var(--pp-teal-tint); color: var(--pp-teal-700); }
.pp-tag--verified { background: var(--pp-success-bg); color: var(--pp-success-text); }
.pp-tag--pending { background: var(--pp-warn-bg); color: var(--pp-warn-text); }

.pp-header__meta {
  display: flex; align-items: center; gap: 6px; margin: 8px 0 0; color: var(--pp-muted); font-size: 13.5px;
}
.pp-header__meta svg { width: 14px; height: 14px; flex-shrink: 0; }
.pp-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--pp-muted); margin: 0 2px; }

/* Buttons */
.pp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  font-family: 'Manrope', sans-serif; font-size: 13.5px; font-weight: 700;
  border-radius: 10px; padding: 10px 18px; cursor: pointer;
  border: 1px solid transparent; transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  white-space: nowrap;
}
.pp-btn svg { width: 15px; height: 15px; }
.pp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.pp-btn--primary { background: linear-gradient(135deg, var(--pp-teal-700), var(--pp-teal-900)); color: #fff; box-shadow: 0 10px 20px -12px rgba(18, 59, 50, 0.55); }
.pp-btn--primary:hover:not(:disabled) { transform: translateY(-1px); }
.pp-btn--outline { background: #fff; color: var(--pp-teal-700); border-color: var(--pp-border); }
.pp-btn--outline:hover:not(:disabled) { border-color: var(--pp-teal-500); background: var(--pp-teal-tint); }
.pp-btn--ghost { background: transparent; color: var(--pp-teal-700); padding: 8px 12px; }
.pp-btn--ghost:hover:not(:disabled) { background: var(--pp-teal-tint); }
.pp-btn--block { width: 100%; }
.pp-btn-row { display: flex; gap: 10px; }
.pp-btn-row--modal { margin-top: 22px; }
.pp-btn-row .pp-btn--primary { flex: 1; }

/* Info grid */
.pp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}
.pp-panel { padding: 24px 26px; }
.pp-panel__title {
  font-family: 'Manrope', sans-serif;
  font-size: 13px; font-weight: 700; color: var(--pp-teal-900);
  padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px dashed var(--pp-border);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.pp-fields { display: flex; flex-direction: column; gap: 14px; margin: 0; }
.pp-field dt {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: var(--pp-muted); font-weight: 600; margin-bottom: 3px;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.pp-field dt svg { width: 12px; height: 12px; }
.pp-field dd { margin: 0; font-size: 14.5px; font-weight: 700; color: var(--pp-text); }
.pp-muted { color: var(--pp-muted); font-weight: 500; }

/* Verification panel */
.pp-verify { padding: 26px 28px; }
.pp-verify__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.pp-verify__title { display: flex; gap: 12px; align-items: flex-start; }
.pp-verify__title svg {
  width: 22px; height: 22px; flex-shrink: 0; color: var(--pp-marigold-500); margin-top: 2px;
}
.pp-verify__title h3 { font-size: 17px; color: var(--pp-teal-900); }
.pp-verify__title p { margin: 4px 0 0; font-size: 13px; color: var(--pp-muted); font-family: 'Manrope', sans-serif; }
.pp-status-ok { color: var(--pp-success-text); }
.pp-status-warn { color: var(--pp-warn-text); }

.pp-step-indicator {
  font-family: 'Manrope', sans-serif;
  font-size: 11.5px; font-weight: 700; color: var(--pp-teal-700);
  background: var(--pp-teal-tint); padding: 5px 12px; border-radius: 999px;
  letter-spacing: 0.03em; white-space: nowrap;
}

.pp-verify__body {
  margin-top: 20px; padding: 20px; border-radius: 14px;
  background: var(--pp-bg); border: 1px solid var(--pp-border);
}

.pp-form-field { margin-bottom: 16px; }
.pp-form-field:last-child { margin-bottom: 0; }
.pp-form-field label {
  display: block; font-family: 'Manrope', sans-serif;
  font-size: 12.5px; font-weight: 700; color: var(--pp-teal-900); margin-bottom: 6px;
}
.pp-input {
  width: 100%; font-family: 'Manrope', sans-serif; font-size: 14px;
  padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--pp-border);
  background: #fff; color: var(--pp-text); transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.pp-input:focus {
  outline: none; border-color: var(--pp-teal-500); box-shadow: 0 0 0 3px var(--pp-teal-tint);
}
.pp-input--mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.06em; }
.pp-input--otp { font-size: 20px; letter-spacing: 0.5em; text-align: center; font-weight: 600; }

.pp-hint {
  display: flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; margin-top: 6px;
}
.pp-hint svg { width: 13px; height: 13px; }
.pp-hint--ok { color: var(--pp-success-text); }
.pp-hint--bad { color: var(--pp-danger-text); }

.pp-captcha-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }

/* Signature element: a rotated ink-stamp treatment for the captcha plate,
   tying identity verification to the idea of an official seal. */
.pp-stamp {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  padding: 8px 20px;
  border: 2px dashed var(--pp-marigold-500);
  border-radius: 10px;
  transform: rotate(-3deg);
  background: var(--pp-marigold-tint);
}
.pp-stamp__label {
  font-family: 'Manrope', sans-serif;
  font-size: 9px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--pp-marigold-500);
}
.pp-stamp__code {
  font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 18px; letter-spacing: 0.3em;
  color: var(--pp-teal-900);
}

.pp-otp-lead {
  display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700;
  color: var(--pp-teal-900); margin: 0 0 16px; font-family: 'Manrope', sans-serif;
}
.pp-otp-lead svg { width: 15px; height: 15px; color: var(--pp-marigold-500); }

/* Modals */
.pp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(18, 59, 50, 0.55);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
}
.pp-modal {
  width: 100%; max-width: 520px; background: #fff; border-radius: 20px; padding: 28px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 48px -12px rgba(18, 59, 50, 0.35);
}
.pp-modal--narrow { max-width: 420px; }
.pp-modal__title { font-size: 19px; color: var(--pp-teal-900); margin-bottom: 20px; }

.pp-avatar-grid {
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 8px 0 22px;
}
.pp-avatar-option {
  width: 64px; height: 64px; border-radius: 50%; padding: 0; cursor: pointer;
  border: 2px solid var(--pp-border); overflow: hidden; background: #fff;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.pp-avatar-option:hover { border-color: var(--pp-marigold-500); transform: translateY(-2px); }
.pp-avatar-option img { width: 100%; height: 100%; object-fit: cover; }

.pp-page button:focus-visible,
.pp-page input:focus-visible,
.pp-page select:focus-visible {
  outline: 2px solid var(--pp-marigold-500);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .pp-page *, .pp-page *::before, .pp-page *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 640px) {
  .pp-header__row { flex-direction: column; align-items: flex-start; }
  .pp-header__row > .pp-btn { width: 100%; }
  .pp-verify__head { flex-direction: column; }
  .pp-captcha-row { flex-wrap: wrap; }
}
`;