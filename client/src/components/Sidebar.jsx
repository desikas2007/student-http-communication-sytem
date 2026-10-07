import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Activity,
  History,
  FlaskConical,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/** Single source of truth for the application navigation. */
export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Academic',
    items: [
      { to: '/examinations', label: 'Examinations', icon: CalendarDays },
      { to: '/student-information', label: 'Student Information', icon: FileText },
    ],
  },
  {
    title: 'HTTP Tools',
    items: [
      { to: '/http-monitor', label: 'HTTP Monitor', icon: Activity },
      { to: '/request-history', label: 'Request History', icon: History },
      { to: '/api-test-center', label: 'API Test Center', icon: FlaskConical },
    ],
  },
];

// The profile page has no sidebar entry on purpose: it is reached only through
// the avatar icon in the top navbar.
export const EXTRA_PAGE_TITLES = { '/profile': 'Profile' };

/** Left navigation rail - collapsible on small screens. */
const Sidebar = ({ open, onClose }) => {
  const { logout, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', 'Your session token was cleared from this browser.');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} id="app-sidebar">
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">
            <GraduationCap size={20} />
          </span>
          <div className="brand-text">
            <p className="brand-text__title">Student Portal</p>
            <p className="brand-text__subtitle">HTTP Communication System</p>
          </div>
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-section__title">{section.title}</p>
              <ul className="nav-section__list">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                      onClick={onClose}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="avatar avatar--sm">{initials(user?.name)}</span>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name || 'Student'}</p>
              <p className="sidebar__user-id">{user?.registerNumber || ''}</p>
            </div>
          </div>
          <button type="button" className="nav-link nav-link--action" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

/** Two-letter avatar initials. */
export const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'ST';

export default Sidebar;
