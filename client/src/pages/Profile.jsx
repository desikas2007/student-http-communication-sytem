import { Link } from 'react-router-dom';
import { User, Mail, Hash, Building2, GraduationCap, Users, Phone, ShieldCheck, KeyRound, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../components/Sidebar';
import { formatDateTime } from '../utils/formatDate';

/** Decodes the payload of a JWT without verifying it (display only). */
const decodeToken = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

/** Student profile page - GET /api/students/profile. */
const Profile = () => {
  const { user } = useAuth();
  const token = (() => {
    try {
      return localStorage.getItem('shcs_token') || sessionStorage.getItem('shcs_session_token');
    } catch {
      return null;
    }
  })();
  const claims = decodeToken(token || '');

  const details = [
    { icon: User, label: 'Full name', value: user?.name },
    { icon: Hash, label: 'Register number', value: user?.registerNumber },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Building2, label: 'Department', value: user?.department },
    { icon: GraduationCap, label: 'Year', value: user?.year ? `Year ${user.year}` : '-' },
    { icon: Users, label: 'Section', value: user?.section ? `Section ${user.section}` : '-' },
    { icon: Phone, label: 'Phone', value: user?.phone || '-' },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Profile</h2>
          <p className="page__subtitle">
            Loaded with <code>GET /api/auth/me</code> and <code>GET /api/students/profile</code>
          </p>
        </div>
        <Link className="btn btn--secondary" to="/student-information">
          Edit information
        </Link>
      </div>

      <div className="grid-2">
        <section className="card profile-card">
          <div className="profile-card__head">
            <span className="avatar avatar--xl">{initials(user?.name)}</span>
            <div>
              <h3 className="profile-card__name">{user?.name}</h3>
              <p className="profile-card__meta">
                {user?.registerNumber} · {user?.department}
              </p>
              <p className="profile-card__badges">
                <span className={`badge ${user?.informationSubmitted ? 'badge--success' : 'badge--warning'}`}>
                  {user?.informationSubmitted ? 'Information submitted' : 'Information pending'}
                </span>
                <span className="badge badge--info">Year {user?.year} · {user?.section}</span>
              </p>
            </div>
          </div>

          <dl className="detail-list">
            {details.map((item) => (
              <div className="detail-list__row" key={item.label}>
                <dt>
                  <item.icon size={15} /> {item.label}
                </dt>
                <dd>{item.value || '-'}</dd>
              </div>
            ))}
            <div className="detail-list__row">
              <dt>
                <Clock size={15} /> Account created
              </dt>
              <dd>{user?.createdAt ? formatDateTime(user.createdAt) : '-'}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Session &amp; security</h3>
              <p className="card__subtitle">How the browser proves who it is</p>
            </div>
            <span className="pill pill--success">
              <ShieldCheck size={13} /> JWT
            </span>
          </header>

          <div className="code-hint">
            <p className="code-hint__title">
              <KeyRound size={13} /> Authorization header sent with every request
            </p>
            <pre>
              <code>Authorization: Bearer ********</code>
            </pre>
            <p className="code-hint__note">
              The raw token is never rendered in the UI. It is attached by the Axios request
              interceptor in <code>services/api.js</code> and masked before any log is stored.
            </p>
          </div>

          {claims ? (
            <dl className="detail-list">
              <div className="detail-list__row">
                <dt>Subject (sub)</dt>
                <dd className="mono">{claims.sub || claims.id || '-'}</dd>
              </div>
              <div className="detail-list__row">
                <dt>Issued at</dt>
                <dd>{claims.iat ? formatDateTime(claims.iat * 1000) : '-'}</dd>
              </div>
              <div className="detail-list__row">
                <dt>Expires at</dt>
                <dd>{claims.exp ? formatDateTime(claims.exp * 1000) : '-'}</dd>
              </div>
              <div className="detail-list__row">
                <dt>Algorithm</dt>
                <dd>HS256 (HMAC-SHA256)</dd>
              </div>
            </dl>
          ) : (
            <p className="muted">No token claims available for this session.</p>
          )}

          <div className="security-notes">
            <p>Passwords are hashed with bcrypt (cost 12) and never stored or logged in plain text.</p>
            <p>Protected routes return 401 when the token is missing, expired or invalid.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
