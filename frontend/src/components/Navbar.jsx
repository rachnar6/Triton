import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, User, ScrollText, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';


// Theme tokens pulled from the landing page (dark green / cream / gold)
const GREEN_DARK = '#12352a';
const GREEN = '#16412f';
const CREAM = '#f6f1e4';
const GOLD = '#e0a63d';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const homeLink = user ? `/${user.role.toLowerCase()}` : '/';

  // Close dropdown menu if user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className="navbar"
      style={{
        position: 'relative',
        zIndex: 100,
        background: `linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
      }}
    >
      <Link
        to={homeLink}
        className="brand"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: CREAM }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(224,166,61,0.15)',
            color: GOLD,
          }}
        >
          <Home size={16} strokeWidth={2.25} />
        </span>
        <span style={{ fontWeight: 700, letterSpacing: 0.3 }}>NeighborCare</span>
      </Link>

      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {!user ? (
          <Link
            to="/login-register"
            className="btn"
            style={{
              background: GOLD,
              color: GREEN_DARK,
              fontWeight: 700,
              border: 'none',
              padding: '9px 18px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Sign In / Register
          </Link>
        ) : (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* User Profile Pill Button */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(246,241,228,0.10)',
                border: '1px solid rgba(246,241,228,0.25)',
                padding: '6px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: CREAM,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: GOLD,
                  color: GREEN_DARK,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                  overflow: 'hidden',
                }}
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%' }} />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <span>Hi, {user.fullName.split(' ')[0]} ({user.role})</span>
              {dropdownOpen ? (
                <ChevronUp size={14} style={{ marginLeft: 2, color: 'rgba(246,241,228,0.7)' }} />
              ) : (
                <ChevronDown size={14} style={{ marginLeft: 2, color: 'rgba(246,241,228,0.7)' }} />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 220,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  borderRadius: 10,
                  border: '1px solid #e2e8df',
                  padding: '6px 0',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5ee' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: GREEN_DARK }}>{user.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.email}
                  </div>
                </div>

                <DropdownLink to="/profile" icon={<User size={16} />} label="Profile" onClick={() => setDropdownOpen(false)} />
                <DropdownLink to="/history" icon={<ScrollText size={16} />} label="Activity & Task History" onClick={() => setDropdownOpen(false)} />
                <DropdownLink to="/settings" icon={<Settings size={16} />} label="Settings" onClick={() => setDropdownOpen(false)} />

                <div style={{ borderTop: '1px solid #f1f5ee', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    fontSize: 14,
                    color: '#dc2626',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  className="dropdown-item"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}

       
      </div>
    </nav>
  );
}

function DropdownLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        fontSize: 14,
        color: '#334155',
        textDecoration: 'none',
        fontWeight: 500,
      }}
      className="dropdown-item"
    >
      <span style={{ display: 'flex', color: '#16412f' }}>{icon}</span>
      {label}
    </Link>
  );
}