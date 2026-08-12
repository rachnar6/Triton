import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api';
import ProfileAlertBanner from '../components/ProfileAlertBanner.jsx';
import SeniorSidebar, { SIDEBAR_WIDTH, MOBILE_BAR_HEIGHT } from '../components/SeniorSidebar.jsx';
import { applyTheme, getStoredTheme } from '../theme.js';

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — tuned for older adults: strong contrast, generous  */
/*  sizing (WCAG 2.1 AAA target ≥ 24px body text, ≥ 44px tap targets). */
/*  Values are CSS custom properties from theme.js, so this page       */
/*  re-colors live whenever the person changes their theme in          */
/*  Settings — on this page or any other. */
/* ------------------------------------------------------------------ */
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

const FONT = "'Atkinson Hyperlegible', 'Trebuchet MS', Verdana, sans-serif";

const btnBase = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 20,
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  minHeight: 60,
  padding: '14px 22px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const S = {
  page: { fontFamily: FONT, color: COLOR.text, background: COLOR.bg, minHeight: '100%' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' },
  h1: { fontSize: 32, fontWeight: 800, color: COLOR.navyDark, margin: '0 0 20px', lineHeight: 1.25 },
  h2: { fontSize: 23, fontWeight: 800, color: COLOR.navyDark, margin: '30px 0 14px' },
  card: {
    background: COLOR.card,
    border: `1px solid ${COLOR.border}`,
    borderRadius: 18,
    padding: 24,
    boxShadow: '0 2px 10px rgba(23,59,94,0.06)',
  },
  errorBox: {
    background: COLOR.redTint,
    border: `2px solid ${COLOR.red}`,
    color: COLOR.red,
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  primaryBtn: { ...btnBase, background: COLOR.navy, color: COLOR.onNavy, width: '100%' },
  goldBtn: { ...btnBase, background: COLOR.gold, color: COLOR.onNavy, width: '100%' },
  outlineBtn: {
    ...btnBase,
    background: COLOR.card,
    color: COLOR.navy,
    border: `2px solid ${COLOR.navy}`,
  },
  dangerBtn: { ...btnBase, background: COLOR.red, color: COLOR.onNavy },
  label: { fontSize: 18, fontWeight: 700, color: COLOR.navyDark, display: 'block', marginBottom: 8 },
  textarea: {
    width: '100%',
    fontFamily: FONT,
    fontSize: 20,
    padding: 16,
    borderRadius: 12,
    border: `2px solid ${COLOR.border}`,
    resize: 'vertical',
    boxSizing: 'border-box',
  },
};

/* ------------------------------------------------------------------ */
/*  ICON SET — bold, rounded-stroke line icons. Every icon is always   */
/*  paired with a visible text label in this file; icons here add a    */
/*  fast visual anchor for scanning, they never carry meaning alone.   */
/* ------------------------------------------------------------------ */

function Icon({ children, size = 24, strokeWidth = 2.3, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

function IconCart(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2.4l2.1 11.3a2 2 0 0 0 2 1.7h8.4a2 2 0 0 0 2-1.6L21 8H6" />
    </Icon>
  );
}

function IconBulb(props) {
  return (
    <Icon {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.4h6c0-1 .3-1.8 1-2.4A6.5 6.5 0 0 0 12 2z" />
    </Icon>
  );
}

function IconSmartphone(props) {
  return (
    <Icon {...props}>
      <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </Icon>
  );
}

function IconPaw(props) {
  return (
    <Icon {...props}>
      <circle cx="6.5" cy="9.3" r="1.7" />
      <circle cx="10.6" cy="6" r="1.7" />
      <circle cx="15" cy="6" r="1.7" />
      <circle cx="18.6" cy="9.8" r="1.7" />
      <path d="M8 14.6c0-2.2 1.9-4 4.2-4s4.2 1.8 4.2 4c0 2.3-1.9 3.2-4.2 3.2s-4.2-.9-4.2-3.2z" />
    </Icon>
  );
}

function IconAlertTriangle(props) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

function IconMic(props) {
  return (
    <Icon {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </Icon>
  );
}

function IconSquare(props) {
  return (
    <Icon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function IconSend(props) {
  return (
    <Icon {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </Icon>
  );
}

function IconUsers(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="8.5" r="2.6" />
      <path d="M15.5 14.3c2.7.4 5 2.4 5 5.7" />
    </Icon>
  );
}

function IconMapPin(props) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </Icon>
  );
}

function IconCar(props) {
  return (
    <Icon {...props}>
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <rect x="2.5" y="13" width="19" height="5.5" rx="1.5" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="17" cy="18.5" r="1.6" />
    </Icon>
  );
}

function IconStarFilled({ size = 16, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      {...rest}
    >
      <path d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.6 6.6-.7L12 2.5z" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function IconClock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Icon>
  );
}

function IconUserCheck(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20.5c0-3.9 2.9-6.5 6.5-6.5s6.5 2.6 6.5 6.5" />
      <path d="M16.3 11.6l1.8 1.8 3.2-3.6" />
    </Icon>
  );
}

function IconLoader(props) {
  return (
    <Icon {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  );
}

function IconBell(props) {
  return (
    <Icon {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  );
}

function IconPhoneCall(props) {
  return (
    <Icon {...props}>
      <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 1h2a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.7a2 2 0 0 1-.5 2.1L7.1 8.6a16 16 0 0 0 6.3 6.3l1.1-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2.1z" />
    </Icon>
  );
}

function IconMessageCircle(props) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
    </Icon>
  );
}

function IconX(props) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Icon>
  );
}

function IconShieldCheck(props) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v6c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </Icon>
  );
}

function IconSparkles(props) {
  return (
    <Icon {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M5.6 5.6l2.8 2.8" />
      <path d="M15.6 15.6l2.8 2.8" />
      <path d="M18.4 5.6l-2.8 2.8" />
      <path d="M8.4 15.6l-2.8 2.8" />
    </Icon>
  );
}

function IconGrid(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </Icon>
  );
}

function IconChevronDown(props) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

function IconPencil(props) {
  return (
    <Icon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { key: 'GROCERIES', Icon: IconCart, label: 'Heavy Groceries', hint: 'Carrying bags, market runs' },
  { key: 'FIX_BULBS', Icon: IconBulb, label: 'Fix & Bulbs', hint: 'Hard-to-reach lights, minor fixes' },
  { key: 'TECH_HELP', Icon: IconSmartphone, label: 'Phone & Tech Help', hint: 'Smartphone setup, Wi-Fi troubleshooting' },
  { key: 'PET_CARE', Icon: IconPaw, label: 'Pet & Walk Care', hint: 'Dog walking, feeding assistance' },
  { key: 'OTHER', Icon: IconSparkles, label: 'Other Request', hint: 'Something else not listed here' },
];

// Rating-modal dismissals are remembered here so a completed-but-unrated
// task doesn't keep re-popping the modal on every polling cycle — see
// DISMISSED_RATINGS_KEY usage in the component below.
const DISMISSED_RATINGS_KEY = 'sp_dismissed_rating_task_ids';

function loadDismissedRatingIds() {
  try {
    const raw = localStorage.getItem(DISMISSED_RATINGS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistDismissedRatingIds(set) {
  try {
    // Keep this from growing forever — only need the most recent ones.
    const arr = Array.from(set).slice(-50);
    localStorage.setItem(DISMISSED_RATINGS_KEY, JSON.stringify(arr));
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

/* Injects the accessible typeface, a couple of small purposeful
   animations (listening pulse, focus ring), and the layout offset that
   keeps page content clear of the fixed SeniorSidebar — a left column
   on desktop/tablet, a bottom tab bar on phones. */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');

      .sp-focusable:focus-visible {
        outline: 3px solid ${COLOR.gold};
        outline-offset: 2px;
      }
      @keyframes sp-pulse {
        0% { box-shadow: 0 0 0 0 rgba(227,167,61,0.55); }
        70% { box-shadow: 0 0 0 16px rgba(227,167,61,0); }
        100% { box-shadow: 0 0 0 0 rgba(227,167,61,0); }
      }
      .sp-listening { animation: sp-pulse 1.6s infinite; }
      @media (prefers-reduced-motion: reduce) {
        .sp-listening { animation: none; }
      }
      @keyframes sp-spin { to { transform: rotate(360deg); } }
      .sp-spin { animation: sp-spin 1.8s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .sp-spin { animation: none; }
      }
      @keyframes sp-live-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .sp-live-dot { animation: sp-live-dot 1.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .sp-live-dot { animation: none; }
      }

      /* Keeps content clear of the fixed sidebar (desktop/tablet)
         or the fixed bottom tab bar (phones). Same 860px breakpoint
         SeniorSidebar uses to switch layouts, kept in sync. */
      .sp-with-sidebar {
        margin-left: ${SIDEBAR_WIDTH}px;
        padding-bottom: 0;
      }
      @media (max-width: 860px) {
        .sp-with-sidebar {
          margin-left: 0;
          padding-bottom: ${MOBILE_BAR_HEIGHT}px;
        }
      }
    `}</style>
  );
}

export default function SeniorPortal() {
  const { token, user, logout } = useAuth();
  const [task, setTask] = useState(null);
  const [volunteersData, setVolunteersData] = useState({ sameSubRegion: [], otherSubRegions: [] });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [description, setDescription] = useState('');
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedTaskToRate, setCompletedTaskToRate] = useState(null);
  const recognitionRef = useRef(null);

  // Tasks whose rating prompt the person already saw (submitted OR
  // skipped) this session/device — persisted so a reload doesn't bring
  // the modal back for the same task.
  const dismissedRatingIdsRef = useRef(loadDismissedRatingIds());

  function markRatingDismissed(taskId) {
    if (!taskId) return;
    dismissedRatingIdsRef.current.add(taskId);
    persistDismissedRatingIds(dismissedRatingIdsRef.current);
  }

  useEffect(() => {
    // Re-apply whatever theme was last chosen in Settings, in case this
    // page is the first one to load in a fresh tab.
    applyTheme(getStoredTheme());

    refresh();
    fetchNearbyVolunteers();
    const interval = setInterval(() => {
      refresh();
      fetchNearbyVolunteers();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Inside refresh() function:
async function refresh() {
  try {
    const { task } = await api.myTask(token);
    // Included EN_ROUTE and ARRIVED stages:
    if (task && ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(task.status)) {
      setTask(task);
    } else {
      if (
        task &&
        task.status === 'COMPLETED' &&
        !task.rating &&
        !dismissedRatingIdsRef.current.has(task._id)
      ) {
        setCompletedTaskToRate(task);
        setShowRatingModal(true);
      }
      setTask(null);
    }
  } catch (err) {
    // ignore polling errors
  } finally {
    setLoading(false);
  }
}

// Update hasActiveTask evaluation:
const hasActiveTask = task && ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(task.status);

  async function fetchNearbyVolunteers() {
    try {
      const res = await api.getNearbyVolunteers?.(token);
      if (res) {
        setVolunteersData({
          sameSubRegion: res.sameSubRegion || [],
          otherSubRegions: res.otherSubRegions || res.volunteers || [],
        });
      }
    } catch (err) {
      console.warn('Could not load nearby volunteers list');
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Please type your request instead.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  // Direct-invite flow: if there's already a pending request, invite this
  // volunteer to it via the real invite endpoint (optimistically updating
  // the task so the "Asked" badge shows immediately). Otherwise this is
  // a brand-new request targeted at this volunteer from the start.
  async function handleAskHelp(invitedVolunteerId) {
    if (task && task.status === 'PENDING') {
      try {
        const res = await api.inviteVolunteer(task._id, invitedVolunteerId, token);
        setTask(res.task || { ...task, invitedVolunteer: invitedVolunteerId });
        alert('Direct request sent to helper successfully!');
        refresh();
      } catch (err) {
        alert(err.message || 'Failed to send request');
      }
      return;
    }
    submitRequest(null, invitedVolunteerId);
  }

  async function submitRequest(e, invitedVolunteerId = null) {
    if (e) e.preventDefault();
    setError('');
    if (!category) return setError('Please select what kind of help you need.');
    if (category === 'OTHER' && !customCategory.trim()) return setError('Please specify your custom category.');
    if (!description.trim()) return setError('Please describe your request, by speaking or typing.');

    setSubmitting(true);

    const sendApiRequest = async (lat, lng) => {
      try {
        const payload = {
          category: category === 'OTHER' ? customCategory.trim() : category,
          description,
          urgency: 'MEDIUM',
          latitude: lat,
          longitude: lng,
        };
        if (scheduledTime) {
          payload.scheduledTime = scheduledTime;
        }
        if (invitedVolunteerId) {
          payload.invitedVolunteer = invitedVolunteerId;
        }

        await api.createTask(payload, token);
        setCategory(null);
        setCustomCategory('');
        setShowCategories(false);
        setDescription('');
        setScheduledTime('');
        setSelectedVolunteer(null);
        refresh();
      } catch (err) {
        setError(err.message || 'Failed to submit request');
      } finally {
        setSubmitting(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendApiRequest(pos.coords.latitude, pos.coords.longitude),
        () => sendApiRequest(undefined, undefined),
        { timeout: 8000 }
      );
    } else {
      sendApiRequest(undefined, undefined);
    }
  }

  async function cancelRequest() {
    if (!task) return;
    try {
      await api.cancelTask(task._id, token);
      setTask(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <>
        <GlobalStyle />
        <SeniorSidebar user={user} onLogout={logout} />
        <div
          className="sp-with-sidebar"
          style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconLoader size={26} className="sp-spin" style={{ color: COLOR.navy }} />
            <p style={{ fontSize: 22, fontWeight: 700, color: COLOR.navy, margin: 0 }}>Loading your requests…</p>
          </div>
        </div>
      </>
    );
  }

  const invitedId = task?.invitedVolunteer?._id || task?.invitedVolunteer;
  const selectedCategoryMeta = category ? CATEGORIES.find((c) => c.key === category) : null;

  return (
    <>
      <GlobalStyle />
      <SeniorSidebar user={user} onLogout={logout} />
      <div className="sp-with-sidebar" style={S.page}>
        <div style={S.container}>
          <ProfileAlertBanner user={user} />

          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* LEFT COLUMN: Request Form / Active Task */}
            <div style={{ flex: '1 1 520px', minWidth: 300 }}>
              <h1 style={S.h1}>What do you need help with today?</h1>
              {error && (
                <div style={S.errorBox}>
                  <IconAlertTriangle size={22} />
                  <span>{error}</span>
                </div>
              )}

              {hasActiveTask ? (
                <ActiveRequestCard task={task} token={token} onCancel={cancelRequest} />
              ) : (
                <form onSubmit={(e) => submitRequest(e)}>
                  <h2 style={S.h2}>Step 1 — Choose a category</h2>

                  {selectedCategoryMeta && !showCategories ? (
                    /* ---------- Collapsed: selected-category summary ---------- */
                    <button
                      type="button"
                      className="sp-focusable"
                      onClick={() => setShowCategories(true)}
                      style={{
                        fontFamily: FONT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        minHeight: 76,
                        padding: '14px 18px',
                        borderRadius: 16,
                        cursor: 'pointer',
                        border: `2px solid ${COLOR.gold}`,
                        background: COLOR.goldTint,
                        boxShadow: '0 2px 8px rgba(227,167,61,0.25)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: '#fff',
                            color: COLOR.navyDark,
                            flexShrink: 0,
                          }}
                        >
                          <selectedCategoryMeta.Icon size={26} />
                        </span>
                        <span style={{ textAlign: 'left' }}>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 13,
                              fontWeight: 700,
                              color: COLOR.textMuted,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Selected category
                          </span>
                          <span style={{ display: 'block', fontSize: 19, fontWeight: 800, color: COLOR.navyDark }}>
                            {category === 'OTHER' && customCategory.trim() ? customCategory : selectedCategoryMeta.label}
                          </span>
                        </span>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 15,
                          fontWeight: 700,
                          color: COLOR.navy,
                          flexShrink: 0,
                        }}
                      >
                        <IconPencil size={16} />
                        Change
                      </span>
                    </button>
                  ) : !showCategories ? (
                    /* ---------- Collapsed: nothing selected yet ---------- */
                    <button
                      type="button"
                      className="sp-focusable"
                      onClick={() => setShowCategories(true)}
                      style={{ ...S.outlineBtn, width: '100%', fontSize: 20, justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconGrid size={22} />
                        View Categories
                      </span>
                      <IconChevronDown size={20} />
                    </button>
                  ) : (
                    /* ---------- Expanded: category grid ---------- */
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                          gap: 14,
                        }}
                      >
                        {CATEGORIES.map((c) => {
                          const selected = category === c.key;
                          const CatIcon = c.Icon;
                          return (
                            <button
                              type="button"
                              key={c.key}
                              className="sp-focusable"
                              onClick={() => {
                                setCategory(c.key);
                                setShowCategories(false);
                              }}
                              aria-pressed={selected}
                              style={{
                                fontFamily: FONT,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 6,
                                textAlign: 'left',
                                minHeight: 128,
                                padding: '18px 18px',
                                borderRadius: 16,
                                cursor: 'pointer',
                                border: selected ? `3px solid ${COLOR.gold}` : `2px solid ${COLOR.border}`,
                                background: selected ? COLOR.goldTint : '#fff',
                                boxShadow: selected ? '0 2px 8px rgba(227,167,61,0.35)' : '0 1px 4px rgba(23,59,94,0.05)',
                              }}
                            >
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 46,
                                  height: 46,
                                  borderRadius: 12,
                                  background: selected ? '#fff' : COLOR.bg,
                                  color: COLOR.navyDark,
                                }}
                              >
                                <CatIcon size={26} />
                              </span>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 20,
                                  fontWeight: 800,
                                  color: COLOR.navyDark,
                                }}
                              >
                                {selected && <IconCheck size={18} style={{ color: COLOR.navy }} />}
                                {c.label}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 400, color: COLOR.textMuted }}>{c.hint}</span>
                            </button>
                          );
                        })}
                      </div>
                      {category && (
                        <button
                          type="button"
                          className="sp-focusable"
                          onClick={() => setShowCategories(false)}
                          style={{
                            marginTop: 12,
                            background: 'transparent',
                            border: 'none',
                            color: COLOR.navy,
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: 'pointer',
                            padding: '6px 2px',
                          }}
                        >
                          Done
                        </button>
                      )}
                    </>
                  )}

                  {category === 'OTHER' && (
                    <div style={{ marginTop: 16 }}>
                      <label style={S.label}>Specify your request category <span style={{color: COLOR.red}}>*</span></label>
                      <input
                        type="text"
                        style={{ ...S.textarea, height: 60, fontSize: 18 }}
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Gardening, Organizing, Reading..."
                      />
                    </div>
                  )}

                  <h2 style={S.h2}>Step 2 — Tell us more</h2>
                  <button
                    type="button"
                    className={`sp-focusable ${listening ? 'sp-listening' : ''}`}
                    onClick={startListening}
                    style={{ ...S.goldBtn, fontSize: 22, marginBottom: 14 }}
                  >
                    <IconMic size={26} />
                    {listening ? 'Listening… speak now' : 'Tap & Speak What You Need'}
                  </button>

                  <div style={{ marginBottom: 6 }}>
                    <label style={S.label}>Or type your request</label>
                    <textarea
                      className="sp-focusable"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Example: I need help carrying groceries from the market to my house"
                      style={S.textarea}
                    />
                  </div>

                  {/* Scheduling: optional date+time picker */}
                  <div style={{ marginBottom: 6 }}>
                    <label style={S.label}>Schedule for a specific time? (optional)</label>
                    <input
                      type="datetime-local"
                      className="sp-focusable"
                      value={scheduledTime}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      style={{
                        width: '100%',
                        fontFamily: FONT,
                        fontSize: 18,
                        padding: 14,
                        borderRadius: 12,
                        border: `2px solid ${COLOR.border}`,
                        boxSizing: 'border-box',
                        background: scheduledTime ? '#eff6ff' : COLOR.card,
                        color: scheduledTime ? '#1d4ed8' : COLOR.text,
                        fontWeight: scheduledTime ? 700 : 400,
                      }}
                    />
                    {scheduledTime && (
                      <div style={{ fontSize: 14, color: '#1d4ed8', marginTop: 6, fontWeight: 600 }}>
                        📅 Booking for: {new Date(scheduledTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        <button
                          type="button"
                          onClick={() => setScheduledTime('')}
                          style={{ marginLeft: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                        >
                          ✕ Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="sp-focusable"
                    style={{ ...S.primaryBtn, fontSize: 22, marginTop: 18, opacity: submitting ? 0.7 : 1 }}
                  >
                    <IconSend size={22} />
                    {submitting ? 'Sending your request…' : 'Send Request to Nearby Neighbours'}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT COLUMN: Active Helpers Near You */}
            <div style={{ flex: '1 1 320px', width: '100%' }}>
              <div style={{ ...S.card, position: 'sticky', top: 20 }}>
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 20,
                    fontWeight: 800,
                    color: COLOR.navyDark,
                    margin: '0 0 4px',
                  }}
                >
                  <IconUsers size={22} style={{ color: COLOR.navy }} />
                  Helpers Near You
                  <span
                    className="sp-live-dot"
                    aria-hidden="true"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: COLOR.green,
                      display: 'inline-block',
                      marginLeft: 2,
                    }}
                  />
                </h3>
                <p style={{ fontSize: 16, color: COLOR.textMuted, marginBottom: 18 }}>
                  Available in{' '}
                  <strong style={{ color: COLOR.navyDark }}>
                    {user?.subRegion ? `${user.subRegion}, ${user.city}` : user?.city}
                  </strong>
                </p>

                {!volunteersData.sameSubRegion?.length && !volunteersData.otherSubRegions?.length ? (
                  <p style={{ fontSize: 17, color: COLOR.textMuted }}>Searching for nearby helpers in {user?.city}…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 14,
                          fontWeight: 800,
                          color: COLOR.green,
                          marginBottom: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <IconMapPin size={16} />
                        In {user?.subRegion || 'Your Area'}
                      </div>
                      {volunteersData.sameSubRegion?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {volunteersData.sameSubRegion.map((vol) => (
                            <VolunteerCard
                              key={vol._id}
                              vol={vol}
                              isExactMatch={true}
                              isInvited={invitedId === vol._id}
                              onSelect={() => setSelectedVolunteer(vol)}
                              onNeedHelp={() => handleAskHelp(vol._id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 15,
                            color: COLOR.textMuted,
                            background: COLOR.bg,
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: `1px dashed ${COLOR.border}`,
                          }}
                        >
                          No volunteers available in {user?.subRegion || 'your area'} right now.
                        </div>
                      )}
                    </div>

                    {volunteersData.otherSubRegions?.length > 0 && (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 14,
                            fontWeight: 800,
                            color: COLOR.navy,
                            marginBottom: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          <IconCar size={16} />
                          Nearby in {user?.city} ({volunteersData.otherSubRegions.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {volunteersData.otherSubRegions.map((vol) => (
                            <VolunteerCard
                              key={vol._id}
                              vol={vol}
                              isExactMatch={false}
                              isInvited={invitedId === vol._id}
                              onSelect={() => setSelectedVolunteer(vol)}
                              onNeedHelp={() => handleAskHelp(vol._id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedVolunteer && (
            <VolunteerProfileModal
              volunteer={selectedVolunteer}
              onClose={() => setSelectedVolunteer(null)}
              onNeedHelp={() => {
                const volId = selectedVolunteer._id;
                setSelectedVolunteer(null);
                handleAskHelp(volId);
              }}
            />
          )}

          {showRatingModal && completedTaskToRate && (
            <RatingModal
              task={completedTaskToRate}
              token={token}
              onClose={() => {
                // "Skip" — remember this task so it doesn't pop again.
                markRatingDismissed(completedTaskToRate._id);
                setShowRatingModal(false);
              }}
              onSubmitted={() => {
                markRatingDismissed(completedTaskToRate._id);
                setShowRatingModal(false);
                refresh();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// Calculates real-time distance between volunteer GPS and Senior Location
function getDistanceText(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '';
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  if (d < 1) {
    return `approx. ${Math.round(d * 1000)} meters away`;
  }
  return `approx. ${d.toFixed(1)} km away`;
}

function VolunteerCard({ vol, isExactMatch, isInvited, onSelect, onNeedHelp }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="sp-focusable"
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        border: isInvited
          ? `2px solid ${COLOR.green}`
          : isExactMatch
          ? `2px solid ${COLOR.green}`
          : `1.5px solid ${COLOR.border}`,
        backgroundColor: isInvited ? COLOR.greenTint : isExactMatch ? COLOR.greenTint : '#FAFBFD',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: isExactMatch ? COLOR.green : COLOR.navy,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 20,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {vol.profilePicture ? (
          <img src={vol.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          vol.fullName.charAt(0).toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 17,
            color: COLOR.navyDark,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vol.fullName}
        </div>
        <div style={{ fontSize: 14, color: COLOR.textMuted, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconStarFilled size={14} style={{ color: COLOR.gold }} />
            {vol.avgRating || '5.0'} · {vol.tasksCompleted || 0} tasks
          </span>
          <span>
            {vol.subRegion ? `${vol.subRegion}, ` : ''}
            {vol.city}
          </span>
          {vol.bookings && vol.bookings.length > 0 && (
            <span style={{ color: '#0369a1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0f2fe', padding: '2px 6px', borderRadius: 6, fontSize: 12, marginTop: 4, width: 'fit-content' }}>
              📅 Booked: {vol.bookings.map(b => new Date(b).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })).join(', ')}
            </span>
          )}
        </div>
      </div>

      {vol.isBusy ? (
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: COLOR.red,
            background: COLOR.redTint,
            padding: '6px 10px',
            borderRadius: 8,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Busy
        </span>
      ) : isInvited ? (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 800,
            color: COLOR.green,
            background: COLOR.greenTint,
            border: `2px solid ${COLOR.green}`,
            padding: '6px 10px',
            borderRadius: 8,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <IconCheck size={13} />
          Asked
        </span>
      ) : (
        <button
          type="button"
          className="sp-focusable"
          style={{ ...btnBase, background: COLOR.navy, color: COLOR.onNavy, minHeight: 44, fontSize: 15, padding: '10px 14px', flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onNeedHelp();
          }}
        >
          Ask Help
        </button>
      )}
    </div>
  );
}

function ActiveRequestCard({ task, token, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await api.sendMessage(task._id, { text: 'Voice message', type: 'VOICE', audioUrl: base64Audio }, token);
          fetchMessages();
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not supported');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  const statusMeta = {
    PENDING: { label: 'Searching nearby…', Icon: IconClock, color: COLOR.gold, bg: COLOR.goldTint },
    ASSIGNED: { label: 'Helper Assigned', Icon: IconUserCheck, color: COLOR.green, bg: COLOR.greenTint },
    EN_ROUTE: { label: 'Helper En Route', Icon: IconCar, color: '#0284c7', bg: '#e0f2fe' },
    ARRIVED: { label: 'Helper At Your Door!', Icon: IconMapPin, color: '#059669', bg: '#d1fae5' },
    IN_PROGRESS: { label: 'Help In Progress', Icon: IconLoader, color: COLOR.navy, bg: '#E9EFF6' },
  }[task.status] || { label: task.status, Icon: null, color: COLOR.navy, bg: '#eee' };

  const StatusIcon = statusMeta.Icon;

  // Calculate live distance if coordinates exist
  const distanceStr =
    task.volunteerLocation?.latitude &&
    task.location?.coordinates?.[1] &&
    getDistanceText(
      task.volunteerLocation.latitude,
      task.volunteerLocation.longitude,
      task.location.coordinates[1],
      task.location.coordinates[0]
    );

  return (
    <div style={{ ...S.card, marginTop: 4 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontWeight: 800,
          fontSize: 15,
          color: statusMeta.color,
          background: statusMeta.bg,
          padding: '6px 14px',
          borderRadius: 20,
          marginBottom: 12,
        }}
      >
        {StatusIcon && (
          <StatusIcon size={16} className={task.status === 'IN_PROGRESS' ? 'sp-spin' : undefined} />
        )}
        {statusMeta.label}
      </span>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLOR.navyDark, margin: '0 0 6px' }}>{task.description}</h2>
      <p style={{ color: COLOR.textMuted, fontSize: 17, margin: 0 }}>Category: {task.category.replace('_', ' ')}</p>

      {/* PENDING STATE */}
      {task.status === 'PENDING' && (
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 17, lineHeight: 1.5 }}>
            {task.invitedVolunteer ? (
              <>
                We've sent a direct priority request to{' '}
                <strong>{task.invitedVolunteer?.fullName || 'your chosen helper'}</strong>.
              </>
            ) : (
              <>
                We're letting trusted neighbours nearby know. You can also tap <strong>"Ask Help"</strong> next to
                any helper on the right to ask them directly.
              </>
            )}
          </p>
          <button type="button" className="sp-focusable" style={S.dangerBtn} onClick={onCancel}>
            Cancel Request
          </button>
        </div>
      )}

      {/* ACTIVE HELPER REAL-TIME PROGRESS TRACKER */}
      {task.volunteer && task.status !== 'PENDING' && (
        <div style={{ marginTop: 20 }}>
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 20,
              fontWeight: 800,
              color: COLOR.navyDark,
            }}
          >
            {task.status === 'ARRIVED' ? (
              <>
                <IconMapPin size={20} style={{ color: '#059669' }} />
                Helper Arrived!
              </>
            ) : (
              <>
                <IconSparkles size={20} style={{ color: COLOR.gold }} />
                Helper Found!
              </>
            )}
          </h3>

          {/* REAL-TIME GPS TRACKING BANNER + LIVE MAP */}
          {task.status === 'EN_ROUTE' && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  background: '#e0f2fe',
                  border: '2px solid #0284c7',
                  padding: 14,
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <IconCar size={20} style={{ color: '#0369a1', marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, color: '#0369a1', fontSize: 16 }}>
                    {task.volunteer.fullName} is on their way!
                  </div>
                  {distanceStr && (
                    <div style={{ fontSize: 14, color: '#075985', marginTop: 2 }}>
                      📡 Live Location: <strong>{distanceStr}</strong>
                    </div>
                  )}
                </div>
              </div>
              {/* Live volunteer map */}
              {task.volunteerLocation?.latitude && task.volunteerLocation?.longitude ? (
                <iframe
                  title="Volunteer Live Location"
                  width="100%"
                  height="220"
                  style={{ border: '2px solid #0284c7', borderTop: 'none', borderRadius: '0 0 12px 12px', display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${task.volunteerLocation.latitude},${task.volunteerLocation.longitude}&z=15&output=embed`}
                />
              ) : (
                <div style={{ background: '#bae6fd', borderRadius: '0 0 12px 12px', padding: '10px 14px', fontSize: 14, color: '#0c4a6e', border: '2px solid #0284c7', borderTop: 'none' }}>
                  Waiting for volunteer's GPS signal…
                </div>
              )}
            </div>
          )}

          {task.status === 'ARRIVED' && (
            <div
              style={{
                background: '#d1fae5',
                border: '2px solid #059669',
                padding: 14,
                borderRadius: 12,
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <IconBell size={20} style={{ color: '#047857', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: 16 }}>
                  {task.volunteer.fullName} has arrived at your door!
                </div>
                <div style={{ fontSize: 14, color: '#065f46', marginTop: 2 }}>
                  Please give your helper the 4-digit Door PIN shown below.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            {task.volunteer.profilePicture && (
              <img
                src={task.volunteer.profilePicture}
                alt=""
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: COLOR.navyDark }}>{task.volunteer.fullName}</div>
              <a
                href={`tel:${task.volunteer.phone}`}
                className="sp-focusable"
                style={{ ...btnBase, background: COLOR.navy, color: COLOR.onNavy, marginTop: 8, textDecoration: 'none' }}
              >
                <IconPhoneCall size={19} />
                Call Helper
              </a>
            </div>
          </div>

          {/* Door PIN — only revealed once the volunteer has physically arrived */}
          {task.status === 'ARRIVED' && (
            <div
              style={{
                background: COLOR.goldTint,
                padding: 18,
                borderRadius: 14,
                border: `2px solid ${COLOR.gold}`,
                marginBottom: 18,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: COLOR.navyDark }}>🔐 Door PIN</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 15, color: COLOR.textMuted }}>
                Your helper is at the door — share this code with them:
              </p>
              <div style={{ fontSize: 44, fontWeight: 800, color: COLOR.navyDark, letterSpacing: 10, marginTop: 10 }}>
                {task.verificationPin}
              </div>
            </div>
          )}

          {/* Waiting message shown before arrival */}
          {(task.status === 'ASSIGNED' || task.status === 'EN_ROUTE') && (
            <div
              style={{
                background: '#f0f9ff',
                padding: 14,
                borderRadius: 12,
                border: '1.5px dashed #7dd3fc',
                marginBottom: 18,
                fontSize: 15,
                color: '#075985',
                textAlign: 'center',
              }}
            >
              🔒 Door PIN will appear here once your helper arrives at your door.
            </div>
          )}

          {/* CHAT / VOICE HUB */}
          <div style={{ borderTop: `1px solid ${COLOR.border}`, paddingTop: 18 }}>
            <h4
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 18,
                fontWeight: 800,
                color: COLOR.navyDark,
                marginBottom: 10,
              }}
            >
              <IconMessageCircle size={19} style={{ color: COLOR.navy }} />
              Message Your Helper
            </h4>
            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                background: '#fff',
                border: `2px solid ${COLOR.border}`,
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              {messages.length === 0 ? (
                <p style={{ fontSize: 15, color: COLOR.textMuted, margin: 0 }}>
                  No messages yet. Say hello or leave a voice note!
                </p>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} style={{ marginBottom: 10, fontSize: 16 }}>
                    <strong style={{ color: COLOR.navyDark }}>{m.senderName}:</strong>{' '}
                    {m.type === 'VOICE' ? (
                      <audio controls src={m.audioUrl} style={{ display: 'block', height: 36, marginTop: 4 }} />
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendTextMsg} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="sp-focusable"
                placeholder="Type a message…"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                style={{
                  flex: '1 1 160px',
                  padding: '12px 14px',
                  fontSize: 16,
                  fontFamily: FONT,
                  borderRadius: 10,
                  border: `2px solid ${COLOR.border}`,
                }}
              />
              <button
                type="submit"
                className="sp-focusable"
                style={{ ...btnBase, background: COLOR.navy, color: COLOR.onNavy, minHeight: 48, fontSize: 16, padding: '10px 18px' }}
              >
                <IconSend size={17} />
                Send
              </button>
              <button
                type="button"
                className="sp-focusable"
                aria-label={isRecording ? 'Stop recording voice message' : 'Record a voice message'}
                style={{
                  ...btnBase,
                  minHeight: 48,
                  fontSize: 16,
                  padding: '10px 16px',
                  background: isRecording ? COLOR.red : '#fff',
                  color: isRecording ? '#fff' : COLOR.navy,
                  border: isRecording ? 'none' : `2px solid ${COLOR.navy}`,
                }}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <IconSquare size={16} /> : <IconMic size={17} />}
                {isRecording ? 'Stop' : 'Voice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VolunteerProfileModal({ volunteer, onClose, onNeedHelp }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,42,68,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 18,
          padding: 26,
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: COLOR.navy,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {volunteer.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: COLOR.navyDark }}>{volunteer.fullName}</h2>
              <p
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  margin: '3px 0 0 0',
                  fontSize: 15,
                  color: COLOR.textMuted,
                }}
              >
                <IconMapPin size={14} />
                {volunteer.subRegion ? `${volunteer.subRegion}, ` : ''}
                {volunteer.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="sp-focusable"
            style={{
              background: COLOR.bg,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 8,
              color: COLOR.navyDark,
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        <div
          style={{
            background: COLOR.bg,
            padding: 16,
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 22,
                fontWeight: 800,
                color: COLOR.navyDark,
              }}
            >
              <IconStarFilled size={18} style={{ color: COLOR.gold }} />
              {volunteer.avgRating || '5.0'}
            </div>
            <div style={{ fontSize: 13, color: COLOR.textMuted }}>Average Rating</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLOR.navyDark }}>{volunteer.tasksCompleted || 0}</div>
            <div style={{ fontSize: 13, color: COLOR.textMuted }}>Tasks Done</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {volunteer.isVerified ? (
                <IconShieldCheck size={22} style={{ color: COLOR.green }} />
              ) : (
                <IconAlertTriangle size={22} style={{ color: COLOR.gold }} />
              )}
            </div>
            <div style={{ fontSize: 13, color: COLOR.textMuted }}>{volunteer.isVerified ? 'Verified' : 'Unverified'}</div>
          </div>
        </div>

        {volunteer.bookings && volunteer.bookings.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 17, fontWeight: 800, color: COLOR.navyDark, margin: '0 0 8px 0' }}>
              📅 Booked Times
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {volunteer.bookings.map((b, idx) => (
                <span key={idx} style={{
                  background: '#e0f2fe', color: '#0369a1',
                  fontSize: 13, fontWeight: 700,
                  padding: '6px 12px', borderRadius: 8,
                }}>
                  {new Date(b).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              ))}
            </div>
          </div>
        )}

        <h4 style={{ fontSize: 17, fontWeight: 800, color: COLOR.navyDark }}>
          Community Feedback ({volunteer.reviews?.length || 0})
        </h4>
        <div style={{ maxHeight: 190, overflowY: 'auto', marginBottom: 22 }}>
          {volunteer.reviews && volunteer.reviews.length > 0 ? (
            volunteer.reviews.map((rev, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${COLOR.border}`, padding: '12px 0', fontSize: 15 }}>
                <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', color: COLOR.navyDark }}>
                  <span>{rev.seniorName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: COLOR.gold }}>
                    <IconStarFilled size={14} style={{ color: COLOR.gold }} />
                    {rev.rating}/5
                  </span>
                </div>
                {rev.comment && (
                  <div style={{ color: COLOR.textMuted, fontSize: 14, marginTop: 3 }}>"{rev.comment}"</div>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: 14, color: COLOR.textMuted }}>No written comments yet. Highly rated helper!</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {volunteer.isBusy ? (
            <div
              style={{
                flex: '1 1 200px',
                textAlign: 'center',
                color: COLOR.red,
                fontWeight: 700,
                fontSize: 16,
                padding: 12,
                background: COLOR.redTint,
                borderRadius: 10,
              }}
            >
              Currently busy with another task
            </div>
          ) : (
            <button type="button" className="sp-focusable" style={{ ...S.primaryBtn, flex: '1 1 200px' }} onClick={onNeedHelp}>
              <IconUserCheck size={19} />
              Ask This Helper
            </button>
          )}
          <button type="button" className="sp-focusable" style={{ ...S.outlineBtn, flex: '1 1 140px' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingModal({ task, token, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.rateTask(task._id, { rating, reviewText }, token);
      onSubmitted();
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,42,68,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 18, padding: 26, fontFamily: FONT }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            marginTop: 0,
            fontSize: 22,
            fontWeight: 800,
            color: COLOR.navyDark,
          }}
        >
          <IconSparkles size={22} style={{ color: COLOR.gold }} />
          Rate Your Helper
        </h2>
        <p style={{ fontSize: 16, color: COLOR.textMuted, lineHeight: 1.5 }}>
          How was your experience with <strong style={{ color: COLOR.navyDark }}>{task.volunteer?.fullName || 'your helper'}</strong>?
        </p>

        <div style={{ margin: '18px 0' }}>
          <label style={S.label}>Star Rating</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {stars.map((n) => (
              <button
                type="button"
                key={n}
                className="sp-focusable"
                onClick={() => setRating(n)}
                aria-pressed={rating === n}
                style={{
                  ...btnBase,
                  minHeight: 52,
                  padding: '10px 14px',
                  fontSize: 18,
                  background: rating === n ? COLOR.goldTint : '#fff',
                  border: rating === n ? `2px solid ${COLOR.gold}` : `2px solid ${COLOR.border}`,
                  color: COLOR.navyDark,
                }}
              >
                {n}
                <IconStarFilled size={17} style={{ color: COLOR.gold }} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={S.label}>Comments / Review</label>
          <textarea
            className="sp-focusable"
            rows={3}
            placeholder="Write a brief thank you or review for other seniors to see…"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            style={S.textarea}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="submit" className="sp-focusable" style={{ ...S.primaryBtn, flex: '1 1 180px' }} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
          <button type="button" className="sp-focusable" style={{ ...S.outlineBtn, flex: '1 1 120px' }} onClick={onClose}>
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}