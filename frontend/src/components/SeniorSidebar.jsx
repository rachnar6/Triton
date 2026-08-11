import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, User, ClipboardList, Settings, LogOut } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SENIOR SIDEBAR — a permanent, always-visible left navigation panel */
/*  that replaces the small "Hi, NAME ▾" dropdown menu.                */
/*                                                                      */
/*  Why: for older adults, anything hidden behind a menu that must be  */
/*  discovered and opened is a barrier — small tap target, extra step, */
/*  easy to dismiss by accident. Putting Profile / Activity / Settings /*/
/*  Log Out in plain sight, as big labeled buttons, removes that step  */
/*  entirely. Uses the same design tokens (COLOR / FONT) as the rest   */
/*  of the app, pulled from the shared CSS custom properties in        */
/*  theme.js, so it re-colors with the user's chosen theme.            */
/* ------------------------------------------------------------------ */

const COLOR = {
  bg: 'var(--sp-bg)',
  card: 'var(--sp-card)',
  navy: 'var(--sp-navy)',
  navyDark: 'var(--sp-navyDark)',
  gold: 'var(--sp-gold)',
  goldTint: 'var(--sp-goldTint)',
  red: 'var(--sp-red)',
  redTint: 'var(--sp-redTint)',
  border: 'var(--sp-border)',
  onNavy: 'var(--sp-onNavy)',
};

// Sidebar-specific overrides: cream background with dark text/icons,
// instead of the app-wide navy panel. Gold stays as the accent color
// so active states still read clearly against the lighter background.
const SIDEBAR_BG = '#f6f1e4';
const SIDEBAR_TEXT = '#1f2f28';
const SIDEBAR_TEXT_MUTED = 'rgba(31,47,40,0.65)';
const SIDEBAR_BORDER = 'rgba(31,47,40,0.12)';
const SIDEBAR_HOVER = 'rgba(31,47,40,0.06)';
const SIDEBAR_ACTIVE = 'rgba(224,166,61,0.22)';

const FONT = "'Atkinson Hyperlegible', 'Trebuchet MS', Verdana, sans-serif";

// Sidebar width on desktop / height of the tab bar on mobile.
// Exported so the page layout can offset its content by the same amount.
export const SIDEBAR_WIDTH = 250;
export const MOBILE_BAR_HEIGHT = 84;

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', match: (p) => p === '/' },
  { to: '/profile', icon: User, label: 'Profile', match: (p) => p.startsWith('/profile') },
  { to: '/activity', icon: ClipboardList, label: 'Activity & Task History', match: (p) => p.startsWith('/activity') },
  { to: '/settings', icon: Settings, label: 'Settings', match: (p) => p.startsWith('/settings') },
];

function GlobalStyle() {
  return (
    <style>{`
      .sps-focusable:focus-visible {
        outline: 3px solid ${COLOR.gold};
        outline-offset: 2px;
      }
      .sps-item {
        transition: background-color 0.15s ease;
      }
      .sps-item:hover, .sps-item:focus-visible {
        background-color: ${SIDEBAR_HOVER};
      }
      .sps-mobilebar { display: none; }
      .sps-sidebar { display: flex; }

      /* Below this width, swap the tall left sidebar for a fixed
         bottom tab bar — still big, still always visible, but usable
         on a phone screen without eating all the horizontal space. */
      @media (max-width: 860px) {
        .sps-sidebar { display: none; }
        .sps-mobilebar { display: flex; }
      }
    `}</style>
  );
}

export default function SeniorSidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const initial = (user?.fullName || user?.name || '?').charAt(0).toUpperCase();

  function handleLogoutClick() {
    if (confirmingLogout) {
      onLogout?.();
    } else {
      setConfirmingLogout(true);
      setTimeout(() => setConfirmingLogout(false), 4000);
    }
  }

  return (
    <>
      <GlobalStyle />

      {/* ---------- DESKTOP / TABLET: full-height left panel ---------- */}
      <nav
        aria-label="Main menu"
        className="sps-sidebar"
        style={{
          fontFamily: FONT,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          background: SIDEBAR_BG,
          flexDirection: 'column',
          zIndex: 900,
          boxShadow: '2px 0 12px rgba(15,42,68,0.10)',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          className="sps-focusable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '22px 20px',
            textDecoration: 'none',
            color: SIDEBAR_TEXT,
            fontWeight: 800,
            fontSize: 20,
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          }}
        >
          <Home size={26} strokeWidth={2.25} />
          NeighborCare
        </Link>

        {/* Who's logged in */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '18px 20px',
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: COLOR.gold,
              color: COLOR.navyDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 19,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: SIDEBAR_TEXT,
                fontWeight: 800,
                fontSize: 16,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName || 'My Account'}
            </div>
            <div style={{ color: SIDEBAR_TEXT_MUTED, fontSize: 13 }}>Senior Member</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.match(location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="sps-item sps-focusable"
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  minHeight: 60,
                  padding: '12px 14px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: SIDEBAR_TEXT,
                  fontWeight: 700,
                  fontSize: 18,
                  background: active ? SIDEBAR_ACTIVE : 'transparent',
                  borderLeft: active ? `4px solid ${COLOR.gold}` : '4px solid transparent',
                }}
              >
                <span style={{ display: 'flex', width: 30, justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={26} strokeWidth={2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Log out anchored at the bottom, always in view */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="sps-focusable"
            onClick={handleLogoutClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 56,
              borderRadius: 12,
              background: confirmingLogout ? COLOR.red : 'transparent',
              color: confirmingLogout ? '#fff' : SIDEBAR_TEXT,
              border: confirmingLogout ? `2px solid ${COLOR.red}` : `2px solid ${SIDEBAR_BORDER}`,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            <LogOut size={18} strokeWidth={2.25} />
            {confirmingLogout ? 'Tap again to confirm' : 'Log Out'}
          </button>
        </div>
      </nav>

      {/* ---------- MOBILE: fixed bottom tab bar ---------- */}
      <nav
        aria-label="Main menu"
        className="sps-mobilebar"
        style={{
          fontFamily: FONT,
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: MOBILE_BAR_HEIGHT,
          background: SIDEBAR_BG,
          zIndex: 900,
          boxShadow: '0 -2px 12px rgba(15,42,68,0.10)',
          justifyContent: 'space-around',
          alignItems: 'stretch',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="sps-item sps-focusable"
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textDecoration: 'none',
                color: SIDEBAR_TEXT,
                borderTop: active ? `3px solid ${COLOR.gold}` : '3px solid transparent',
              }}
            >
              <Icon size={24} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          className="sps-item sps-focusable"
          onClick={handleLogoutClick}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: SIDEBAR_TEXT,
            cursor: 'pointer',
          }}
        >
          <LogOut size={24} strokeWidth={2} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>
            {confirmingLogout ? 'Confirm?' : 'Log Out'}
          </span>
        </button>
      </nav>
    </>
  );
}