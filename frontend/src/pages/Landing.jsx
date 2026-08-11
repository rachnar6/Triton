import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

/*
  Design tokens — "the porch light" concept.
  A lit lamp post is the one signature image on this page: it stands in
  for what NeighborCare actually is — a small, warm point of light on
  someone's own street, not a call centre. Everything else stays quiet
  around it.

  --ink     #1D2B3A  deep navy-charcoal, body copy + impact band
  --sage    #EAF1EC  soft sage-mist page background
  --sage-d  #D3E2D8  deeper sage, borders / dashed path
  --amber   #F2A93E  the lamp glow — primary accent
  --amber-d #C9821F  pressed / high-contrast amber (buttons, links)
  --teal    #2F6E64  the volunteer figure, "someone showing up"
  --clay    #B8763F  the senior figure, warmth without cliché terracotta
  --paper   #FBF8F1  card surface, warm near-white
*/

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ tasksCompleted: 0, activeVolunteers: 0, avgResponseMinutes: 0 });

  useEffect(() => {
    api.publicStats().then(setStats).catch(() => {});
  }, []);

  function go(role) {
    navigate('/login-register', { state: { role } });
  }

  return (
    <div className="nc-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .nc-landing {
          --ink: #1D2B3A;
          --sage: #EAF1EC;
          --sage-d: #D3E2D8;
          --amber: #F2A93E;
          --amber-d: #C9821F;
          --teal: #2F6E64;
          --clay: #B8763F;
          --paper: #FBF8F1;

          font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--ink);
          background: var(--sage);
        }

        .nc-landing * { box-sizing: border-box; }

        /* ---------- hero ---------- */

        .nc-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 460px);
          gap: 48px;
          align-items: center;
          max-width: 1180px;
          margin: 0 auto;
          padding: 76px 32px 64px;
        }

        .nc-eyebrow {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--amber-d);
          margin: 0 0 18px;
        }

        .nc-h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: clamp(34px, 4.6vw, 54px);
          line-height: 1.08;
          letter-spacing: -0.01em;
          margin: 0 0 22px;
        }

        .nc-lede {
          font-size: 17px;
          line-height: 1.65;
          color: #3C4C5C;
          max-width: 46ch;
          margin: 0 0 34px;
        }

        .nc-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .nc-btn {
          font-family: 'Public Sans', sans-serif;
          font-weight: 700;
          font-size: 15.5px;
          padding: 14px 24px;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .nc-btn:hover { transform: translateY(-1px); }

        .nc-btn:focus-visible {
          outline: 3px solid var(--teal);
          outline-offset: 3px;
        }

        .nc-btn-primary {
          background: var(--amber);
          color: #29200A;
          box-shadow: 0 6px 0 var(--amber-d);
        }
        .nc-btn-primary:hover { box-shadow: 0 8px 0 var(--amber-d); }
        .nc-btn-primary:active { transform: translateY(2px); box-shadow: 0 3px 0 var(--amber-d); }

        .nc-btn-outline {
          background: transparent;
          border-color: var(--ink);
          color: var(--ink);
        }
        .nc-btn-outline:hover { background: rgba(29,43,58,0.06); }

        /* ---------- illustration ---------- */

        .nc-illus-wrap {
          background: var(--paper);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 1px 2px rgba(29,43,58,0.06), 0 18px 36px -18px rgba(29,43,58,0.28);
        }

        .nc-illus-wrap svg { display: block; width: 100%; height: auto; }

        .nc-bulb, .nc-glow {
          transform-origin: 120px 150px;
          animation: nc-pulse 3.6s ease-in-out infinite;
        }

        @keyframes nc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }

        @media (prefers-reduced-motion: reduce) {
          .nc-bulb, .nc-glow { animation: none; }
        }

        /* ---------- path divider ---------- */

        .nc-divider {
          display: flex;
          justify-content: center;
          padding: 6px 0 46px;
        }

        /* ---------- trust section ---------- */

        .nc-trust {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px 78px;
        }

        .nc-trust-head {
          text-align: center;
          max-width: 52ch;
          margin: 0 auto 40px;
        }

        .nc-trust-head h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: clamp(24px, 3vw, 30px);
          margin: 0 0 10px;
        }

        .nc-trust-head p {
          color: #3C4C5C;
          font-size: 15.5px;
          line-height: 1.6;
          margin: 0;
        }

        .nc-trust-grid {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin: 0;
          padding: 0;
        }

        .nc-tcard {
          background: var(--paper);
          border: 1px solid var(--sage-d);
          border-radius: 18px;
          padding: 26px 24px 28px;
        }

        .nc-ticon {
          width: 40px;
          height: 40px;
          margin-bottom: 16px;
        }
        .nc-ticon.teal { color: var(--teal); }
        .nc-ticon.amber { color: var(--amber-d); }
        .nc-ticon.clay { color: var(--clay); }

        .nc-tcard h3 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: 18.5px;
          line-height: 1.3;
          margin: 0 0 10px;
        }

        .nc-tcard p {
          font-size: 14.5px;
          line-height: 1.6;
          color: #3C4C5C;
          margin: 0;
        }

        /* ---------- impact band ---------- */

        .nc-impact {
          background: var(--ink);
          padding: 54px 32px;
        }

        .nc-impact-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          text-align: center;
        }

        .nc-impact-inner dt {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 600;
          color: var(--amber);
          margin: 0 0 8px;
        }

        .nc-impact-inner dd {
          margin: 0;
          font-size: 13.5px;
          letter-spacing: 0.03em;
          color: #C9D3CE;
        }

        @media (max-width: 860px) {
          .nc-hero {
            grid-template-columns: 1fr;
            padding: 52px 24px 40px;
          }
          .nc-illus-wrap { max-width: 380px; margin: 0 auto; order: -1; }
          .nc-trust-grid { grid-template-columns: 1fr; }
          .nc-impact-inner { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>

      {/* ---------- hero ---------- */}
      <section className="nc-hero">
        <div>
          <p className="nc-eyebrow">Neighbor to neighbor, street by street</p>
          <h1 className="nc-h1">Help is a few doors down, not a call centre away.</h1>
          <p className="nc-lede">
            NeighborCare matches seniors with volunteers who already live nearby — ID-verified,
            within a couple of kilometres, and confirmed at the door with a private PIN. Built to
            WCAG-AAA standards, with voice-typed requests for anyone who'd rather speak than type.
          </p>
          <div className="nc-cta-row">
            <button className="nc-btn nc-btn-primary" onClick={() => go('SENIOR')}>
              Request help nearby
            </button>
            <button className="nc-btn nc-btn-outline" onClick={() => go('VOLUNTEER')}>
              Volunteer on my street
            </button>
          </div>
        </div>

        <div className="nc-illus-wrap">
          <svg
            viewBox="0 0 480 420"
            role="img"
            aria-label="A volunteer carrying a grocery bag walks alongside a senior using a cane, near a lit lamp post"
          >
            <defs>
              <radialGradient id="ncLampGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F2A93E" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#F2A93E" stopOpacity="0" />
              </radialGradient>
              <filter id="ncSoftBlur" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>

            {/* ground shadow + dashed path */}
            <ellipse cx="240" cy="378" rx="190" ry="16" fill="#1D2B3A0F" />
            <path d="M20 366 Q240 336 460 366" stroke="#D3E2D8" strokeWidth="3" fill="none" strokeDasharray="1 14" strokeLinecap="round" />

            {/* lamp glow */}
            <circle className="nc-glow" cx="112" cy="140" r="110" fill="url(#ncLampGlow)" filter="url(#ncSoftBlur)" />

            {/* lamp post */}
            <rect x="106" y="160" width="8" height="190" rx="4" fill="#1D2B3A" />
            <rect x="82" y="346" width="56" height="10" rx="5" fill="#1D2B3A" />
            <path d="M88 160 L132 160 L120 138 L100 138 Z" fill="#1D2B3A" />
            <circle className="nc-bulb" cx="110" cy="140" r="12" fill="#F2A93E" />

            {/* volunteer figure */}
            <g transform="translate(258,222)">
              <rect x="-4" y="0" width="15" height="54" rx="7.5" fill="#2F6E64" transform="rotate(13)" />
              <rect x="-17" y="0" width="15" height="54" rx="7.5" fill="#2F6E64" transform="rotate(-9)" />
              <rect x="-24" y="-70" width="50" height="74" rx="21" fill="#2F6E64" />
              <path d="M-20 -50 C-42 -40 -54 -22 -58 4" stroke="#2F6E64" strokeWidth="13" strokeLinecap="round" fill="none" />
              <path d="M20 -50 C37 -38 43 -18 40 3" stroke="#2F6E64" strokeWidth="13" strokeLinecap="round" fill="none" />
              <rect x="29" y="-2" width="24" height="28" rx="6" fill="#F2A93E" />
              <path d="M34 -2 v-9 a5.5 5.5 0 0 1 11 0 v9" stroke="#1D2B3A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="0" cy="-92" r="16" fill="#2F6E64" />
            </g>

            {/* senior figure */}
            <g transform="translate(198,240)">
              <rect x="-4" y="0" width="13" height="44" rx="6.5" fill="#B8763F" transform="rotate(9)" />
              <rect x="-13" y="0" width="13" height="44" rx="6.5" fill="#B8763F" transform="rotate(-7)" />
              <rect x="-21" y="-56" width="44" height="60" rx="19" fill="#B8763F" transform="rotate(5)" />
              <path d="M17 -38 C32 -33 41 -21 47 -4" stroke="#B8763F" strokeWidth="11" strokeLinecap="round" fill="none" />
              <path d="M-15 -18 L-22 42" stroke="#1D2B3A" strokeWidth="4" strokeLinecap="round" />
              <circle cx="-15" cy="-20" r="4.5" fill="#1D2B3A" />
              <circle cx="2" cy="-74" r="14" fill="#B8763F" />
            </g>
          </svg>
        </div>
      </section>

      {/* ---------- path divider ---------- */}
      <div className="nc-divider" aria-hidden="true">
        <svg width="160" height="16" viewBox="0 0 160 16">
          <line x1="0" y1="8" x2="160" y2="8" stroke="#D3E2D8" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round" />
          <circle cx="16" cy="8" r="4" fill="#F2A93E" />
          <circle cx="80" cy="8" r="4" fill="#F2A93E" />
          <circle cx="144" cy="8" r="4" fill="#F2A93E" />
        </svg>
      </div>

      {/* ---------- trust section ---------- */}
      <section className="nc-trust" aria-labelledby="nc-trust-heading">
        <div className="nc-trust-head">
          <h2 id="nc-trust-heading">Built so it earns the trust of both sides of the door</h2>
          <p>Three things a senior's family and a first-time volunteer both ask about, answered plainly.</p>
        </div>

        <ul className="nc-trust-grid">
          <li className="nc-tcard">
            <svg className="nc-ticon teal" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 4 L34 10 V19 C34 28 28 33.5 20 36 C12 33.5 6 28 6 19 V10 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="14" cy="20" r="2.2" fill="currentColor" />
              <circle cx="20" cy="20" r="2.2" fill="currentColor" />
              <circle cx="26" cy="20" r="2.2" fill="currentColor" />
            </svg>
            <h3>A PIN before anyone opens the door</h3>
            <p>Every visit is confirmed with a private 4-digit code shared only between the senior and their matched volunteer. No code, no entry.</p>
          </li>

          <li className="nc-tcard">
            <svg className="nc-ticon amber" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="4" fill="currentColor" />
              <circle cx="20" cy="20" r="11" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
              <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" opacity="0.55" />
            </svg>
            <h3>Neighbors within 2–4 km, not strangers city-wide</h3>
            <p>Requests only reach volunteers who are verified, live in the same city, and are close enough to actually be a neighbor.</p>
          </li>

          <li className="nc-tcard">
            <svg className="nc-ticon clay" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="8" y="17" width="3.5" height="6" rx="1.75" fill="currentColor" />
              <rect x="14" y="11" width="3.5" height="18" rx="1.75" fill="currentColor" />
              <rect x="20" y="6" width="3.5" height="28" rx="1.75" fill="currentColor" />
              <rect x="26" y="11" width="3.5" height="18" rx="1.75" fill="currentColor" />
              <rect x="32" y="17" width="3.5" height="6" rx="1.75" fill="currentColor" />
            </svg>
            <h3>Speak the request, skip the typing</h3>
            <p>One tap turns speech into a request — built for anyone who finds a keyboard slower than a conversation.</p>
          </li>
        </ul>
      </section>

      {/* ---------- impact band ---------- */}
      <section className="nc-impact" aria-label="NeighborCare impact so far">
        <dl className="nc-impact-inner">
          <div>
            <dt>{stats.tasksCompleted}</dt>
            <dd>Tasks completed</dd>
          </div>
          <div>
            <dt>{stats.activeVolunteers}</dt>
            <dd>Active neighborhood volunteers</dd>
          </div>
          <div>
            <dt>{stats.avgResponseMinutes ? `${stats.avgResponseMinutes}m` : '—'}</dt>
            <dd>Average time to respond</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}