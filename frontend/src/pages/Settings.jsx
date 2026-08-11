import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { applyTheme, getStoredTheme } from '../theme.js';
import { api } from '../api.js';

const FONT = "'Atkinson Hyperlegible', 'Trebuchet MS', Verdana, sans-serif";

/* Colors reference CSS custom properties from theme.js, so this whole
   page re-colors live the instant applyTheme() runs — no reload needed. */
const COLOR = {
  bg: 'var(--sp-bg)',
  card: 'var(--sp-card)',
  navy: 'var(--sp-navy)',
  navyDark: 'var(--sp-navyDark)',
  gold: 'var(--sp-gold)',
  goldTint: 'var(--sp-goldTint)',
  green: 'var(--sp-green)',
  greenTint: 'var(--sp-greenTint)',
  red: 'var(--sp-red)',
  redTint: 'var(--sp-redTint)',
  border: 'var(--sp-border)',
  text: 'var(--sp-text)',
  textMuted: 'var(--sp-textMuted)',
  onNavy: 'var(--sp-onNavy)',
};

const btnBase = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 18,
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  minHeight: 56,
  padding: '12px 18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const S = {
  page: { fontFamily: FONT, color: COLOR.text, background: COLOR.bg, minHeight: '100%' },
  container: { maxWidth: 820, margin: '0 auto', padding: '28px 20px 60px' },
  h1: { fontSize: 30, fontWeight: 800, color: COLOR.navyDark, margin: '0 0 8px' },
  intro: { fontSize: 18, color: COLOR.textMuted, marginBottom: 26, lineHeight: 1.5 },
  card: {
    background: COLOR.card,
    border: `1px solid ${COLOR.border}`,
    borderRadius: 18,
    padding: 26,
    marginBottom: 22,
  },
  h2: { fontSize: 22, fontWeight: 800, color: COLOR.navyDark, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 },
  sub: { fontSize: 16, color: COLOR.textMuted, marginBottom: 18, lineHeight: 1.5 },
};

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
];

const THEMES = [
  { key: 'light', icon: '☀️', title: 'Light Theme', hint: 'Clean & classic look' },
  { key: 'dark', icon: '🌙', title: 'Dark Theme', hint: 'Easy on the eyes at night' },
  { key: 'high-contrast', icon: '👓', title: 'High Contrast', hint: 'Boldest contrast, largest text' },
];

// Preview swatches for each card — intentionally NOT var()-based, since a
// card must show what the OTHER themes look like too, not the active one.
const THEME_PREVIEW = {
  light: { bg: '#ffffff', fg: '#0f172a' },
  dark: { bg: '#101B2A', fg: '#ffffff' },
  'high-contrast': { bg: '#000000', fg: '#ffff00' },
};

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
      .sp-focusable:focus-visible {
        outline: 3px solid var(--sp-gold);
        outline-offset: 2px;
      }
      /* Keep the Google Translate widget invisible + prevent the layout
         shift its top banner normally causes. */
      #google_translate_element { display: none !important; }
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      body { top: 0 !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
    `}</style>
  );
}

async function handleToggle(key, newValue) {
  const updated = { ...notifications, [key]: newValue };
  setNotifications(updated);
  try {
    await api.updateProfile({ notificationPreferences: updated }, token);
  } catch (err) {
    console.warn('Failed to save notification preference');
  }
}

function BigToggle({ checked, onChange, label, description }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 4px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLOR.navyDark }}>{label}</div>
        {description && <div style={{ fontSize: 14, color: COLOR.textMuted, marginTop: 2 }}>{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="sp-focusable"
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 88,
          height: 46,
          borderRadius: 30,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          background: checked ? COLOR.green : '#8C97A6',
          transition: 'background 0.15s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 4,
            left: checked ? 46 : 4,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: checked ? '#2F7D53' : '#51637A',
            transition: 'left 0.15s ease',
          }}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, token } = useAuth();
  const [theme, setTheme] = useState(getStoredTheme());
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('app_lang') || 'en');
  const [translateReady, setTranslateReady] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    taskUpdates: true,
  });
  const [savedMsg, setSavedMsg] = useState('');
  const [testingPush, setTestingPush] = useState(false);
  const [testPushResult, setTestPushResult] = useState(null);

  async function handleSendTestPush() {
    setTestingPush(true);
    setTestPushResult(null);

    // Step 1: Check browser notification permission first
    if (!('Notification' in window)) {
      setTestPushResult({ success: false, message: '❌ This browser does not support notifications.' });
      setTestingPush(false);
      return;
    }
    if (Notification.permission !== 'granted') {
      setTestPushResult({ success: false, message: `❌ Notification permission is "${Notification.permission}". Please allow notifications in your browser settings and log in again.` });
      setTestingPush(false);
      return;
    }

    try {
      const res = await api.sendTestNotification(token);
      setTestPushResult({ success: true, message: `✅ ${res.message || 'Notification sent!'} Check your browser for a popup. If you don\'t see it, check Windows notification settings.` });
    } catch (err) {
      setTestPushResult({ success: false, message: `❌ ${err.message || 'Failed to send test notification'}` });
    } finally {
      setTestingPush(false);
    }
  }

  // Apply the persisted theme the instant this page mounts (also covers
  // the case where the app was reloaded and this is the first page seen).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Load the real Google Translate widget once, then it stays available
  // for the lifetime of the tab. Hidden via CSS, driven programmatically.
  useEffect(() => {
    if (window.google?.translate?.TranslateElement) {
      setTranslateReady(true);
      return;
    }
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,ta,hi,ml',
          autoDisplay: false,
        },
        'google_translate_element'
      );
      setTranslateReady(true);
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(''), 2200);
    return () => clearTimeout(t);
  }, [savedMsg]);

  function changeTheme(themeKey) {
    setTheme(themeKey);
    applyTheme(themeKey);
    setSavedMsg('Theme updated');
  }

  function changeLanguage(langCode, attempt = 0) {
    setCurrentLang(langCode);
    localStorage.setItem('app_lang', langCode);

    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
      setSavedMsg(`Language set to ${LANGUAGES.find((l) => l.code === langCode)?.label || langCode}`);
      return;
    }

    // Widget script can still be loading (slow connection) — retry briefly
    // before telling the person it isn't ready yet.
    if (attempt < 10) {
      setTimeout(() => changeLanguage(langCode, attempt + 1), 300);
      return;
    }
    setSavedMsg('');
    alert('Translation is still loading. Please wait a moment and try again.');
  }

  function updateNotification(key, value) {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    setSavedMsg('Preference saved');
  }

  return (
    <div style={S.page}>
      <GlobalStyle />
      {/* Required by Google's widget to build its (hidden) language dropdown */}
      <div id="google_translate_element" />

      <div style={S.container}>
        <h1 style={S.h1}>⚙️ Settings &amp; Preferences</h1>
        <p style={S.intro}>Customize your language, screen appearance, and how you'd like to be notified.</p>

        {savedMsg && (
          <div
            role="status"
            style={{
              background: COLOR.greenTint,
              border: `2px solid ${COLOR.green}`,
              color: COLOR.green,
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 18,
            }}
          >
            ✓ {savedMsg}
          </div>
        )}

        {/* SECTION 1: LANGUAGE */}
        <div style={S.card}>
          <h2 style={S.h2}>🌐 Language / மொழி</h2>
          <p style={S.sub}>
            Choose the language you're most comfortable reading. The whole app will switch to it.
            {!translateReady && (
              <span style={{ display: 'block', color: COLOR.gold, marginTop: 6, fontSize: 14 }}>
                Loading translator…
              </span>
            )}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {LANGUAGES.map((lang) => {
              const selected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className="sp-focusable"
                  aria-pressed={selected}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    ...btnBase,
                    flexDirection: 'column',
                    gap: 4,
                    minHeight: 84,
                    fontSize: 18,
                    background: selected ? COLOR.navy : COLOR.card,
                    color: selected ? COLOR.onNavy : COLOR.navyDark,
                    border: selected ? `2px solid ${COLOR.navy}` : `2px solid ${COLOR.border}`,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{lang.flag}</span>
                  <span>{lang.native}</span>
                  {lang.code !== 'en' && (
                    <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.85 }}>{lang.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: THEME */}
        <div style={S.card}>
          <h2 style={S.h2}>🎨 Screen Appearance</h2>
          <p style={S.sub}>Pick whichever is easiest on your eyes. It applies immediately, everywhere in the app.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {THEMES.map((t) => {
              const selected = theme === t.key;
              const preview = THEME_PREVIEW[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  className="sp-focusable"
                  aria-pressed={selected}
                  onClick={() => changeTheme(t.key)}
                  style={{
                    fontFamily: FONT,
                    border: selected ? `3px solid ${COLOR.gold}` : `2px solid ${COLOR.border}`,
                    borderRadius: 16,
                    padding: 20,
                    background: preview.bg,
                    color: preview.fg,
                    cursor: 'pointer',
                    textAlign: 'center',
                    minHeight: 130,
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {selected ? '✓ ' : ''}
                    {t.title}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{t.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: NOTIFICATIONS */}
        <div style={S.card}>
          <h2 style={S.h2}>🔔 Notifications &amp; Alerts</h2>
          <p style={S.sub}>Choose how you want to hear about new requests and updates.</p>

          <BigToggle
            label="Email alerts"
            description="Get an email for new requests and task updates"
            checked={notifications.emailAlerts}
            onChange={(v) => updateNotification('emailAlerts', v)}
          />
          <BigToggle
            label="SMS text alerts"
            description="Get a text message for urgent tasks"
            checked={notifications.smsAlerts}
            onChange={(v) => updateNotification('smsAlerts', v)}
          />
          <BigToggle
            label="Task status updates"
            description="Get notified when a helper accepts or completes your request"
            checked={notifications.taskUpdates}
            onChange={(v) => updateNotification('taskUpdates', v)}
          />

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLOR.border}` }}>
            <button
              type="button"
              className="sp-focusable"
              onClick={handleSendTestPush}
              disabled={testingPush}
              style={{
                ...btnBase,
                background: COLOR.navy,
                color: COLOR.onNavy,
                fontSize: 16,
                padding: '12px 24px',
              }}
            >
              {testingPush ? 'Sending Test Push...' : '🧪 Send Test Push Notification'}
            </button>
            {testPushResult && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  color: testPushResult.success ? COLOR.green : COLOR.red,
                }}
              >
                {testPushResult.success ? '✓ ' : '❌ '} {testPushResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}