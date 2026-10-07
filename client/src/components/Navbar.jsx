import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { NAV_SECTIONS, EXTRA_PAGE_TITLES, initials } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { fetchHealth } from '../services/httpLogService';

/** Resolves the current pathname to a human readable page title. */
const titleForPath = (pathname) => {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.end ? pathname === item.to : pathname.startsWith(item.to)) return item.label;
    }
  }
  // Routes that are intentionally not part of the sidebar navigation.
  if (EXTRA_PAGE_TITLES[pathname]) return EXTRA_PAGE_TITLES[pathname];
  if (pathname === '/login') return 'Sign in';
  return 'Not found';
};

/**
 * Top bar: mobile menu trigger, page title, live API status and the user chip.
 */
const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [health, setHealth] = useState({ state: 'checking' });

  // Lightweight heartbeat so the portal can show real backend/database state.
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const data = await fetchHealth();
        if (!mounted) return;
        setHealth({
          state: data.database === 'connected' ? 'online' : 'degraded',
          database: data.database,
        });
      } catch (error) {
        if (!mounted) return;
        setHealth({ state: error.status === 429 ? 'checking' : 'offline' });
      }
    };

    check();
    const timer = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const status = {
    online: { label: 'API Online', className: 'status-dot--online' },
    degraded: { label: 'API Online · DB degraded', className: 'status-dot--warning' },
    offline: { label: 'API Offline', className: 'status-dot--offline' },
    checking: { label: 'Checking…', className: 'status-dot--checking' },
  }[health.state];

  return (
    <header className="navbar">
      <button
        type="button"
        className="icon-btn navbar__menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-controls="app-sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="navbar__title">
        <h1>{titleForPath(location.pathname)}</h1>
        <p className="navbar__crumb">Student Communication Portal</p>
      </div>

      <div className="navbar__actions">
        <span className={`api-pill ${status.className}`}>
          {health.state === 'checking' ? (
            <Loader2 size={13} className="spin" />
          ) : health.state === 'offline' ? (
            <WifiOff size={13} />
          ) : (
            <Wifi size={13} />
          )}
          {status.label}
        </span>

        <Link
          to="/profile"
          className="navbar__user"
          aria-label="Open profile"
          title="Profile"
        >
          <span className="avatar">{initials(user?.name)}</span>
          <div className="navbar__user-text">
            <p className="navbar__user-name">{user?.name || 'Student'}</p>
            <p className="navbar__user-role">{user?.department || ''}</p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
