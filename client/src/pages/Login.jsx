import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertTriangle,
  UserPlus,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { firstName } from '../utils/formatDate';

/**
 * Evaluator demo account (created by the seed script). It is never rendered in
 * the normal sign-in form - it lives only inside the demo panel, so a real
 * student is not confused by sample credentials.
 */
const DEMO_EMAIL = 'student@college.edu';
const DEMO_PASSWORD = 'password';

/** Split-screen sign in page: branding on the left, credentials form on the right. */
const Login = () => {
  const { login, isAuthenticated, loading: sessionLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const registered = Boolean(location.state?.registered);

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDemoCreds, setShowDemoCreds] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const from = location.state?.from?.pathname || '/';

  // Already signed in -> go straight to the dashboard.
  if (!sessionLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await login(email.trim(), password, remember);
      setSuccess('Login successful. Redirecting…');
      toast.success('Login successful', `HTTP 200 OK · Welcome back, ${firstName(data.student.name)}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const describeError = (err) => ({
    status: err.status || 0,
    message:
      err.status === 401
        ? 'Invalid email or password. Please check your credentials and try again.'
        : err.status === 429
          ? 'Too many login attempts. Please wait a moment and try again.'
          : err.message,
    code: err.errorCode,
  });

  /**
   * Evaluator shortcut: signs in with the sample account in one click and drops
   * the visitor straight into the portal, already populated with sample data.
   */
  const handleDemoLogin = async () => {
    setError(null);
    setSuccess('');
    setDemoLoading(true);
    try {
      const data = await login(DEMO_EMAIL, DEMO_PASSWORD, true);
      toast.success('Demo session started', `HTTP 200 OK · Signed in as ${firstName(data.student.name)}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.status === 401
          ? {
              status: 401,
              message:
                'The demo account is not available. Run "npm run seed" once to create the sample data, then try again.',
              code: 'DEMO_ACCOUNT_MISSING',
            }
          : describeError(err)
      );
    } finally {
      setDemoLoading(false);
    }
  };

  /** Reveals the sample credentials inside the demo panel only. */
  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setError(null);
  };

  return (
    <div className="login-page">
      {/* ---------- Left: college branding ---------- */}
      <section className="login-brand">
        <div className="login-brand__inner">
          <span className="brand-mark brand-mark--lg" aria-hidden="true">
            <GraduationCap size={26} />
          </span>
          <p className="login-brand__eyebrow">Department of Computer Science &amp; Engineering</p>
          <h1 className="login-brand__title">Student Communication Portal</h1>
          <p className="login-brand__subtitle">
            Securely access your academic information - examinations, profile data and a live view of
            every HTTP request your browser sends to the college server.
          </p>

          <ul className="login-brand__points">
            <li>
              <ShieldCheck size={16} /> JWT protected APIs with bcrypt hashed passwords
            </li>
            <li>
              <KeyRound size={16} /> GET retrieves data · POST submits data
            </li>
            <li>
              <ArrowRight size={16} /> Every request, response and status code is monitored
            </li>
          </ul>

          <div className="login-flow" aria-hidden="true">
            <span>Browser</span>
            <ArrowRight size={14} />
            <span>React</span>
            <ArrowRight size={14} />
            <span>HTTP</span>
            <ArrowRight size={14} />
            <span>Express</span>
            <ArrowRight size={14} />
            <span>MongoDB</span>
          </div>
        </div>
      </section>

      {/* ---------- Right: login form ---------- */}
      <section className="login-panel">
        <div className="login-panel__inner">
          <header className="login-panel__header">
            <h2>Sign in</h2>
            <p>Use your college account to continue.</p>
          </header>

          {registered && !error ? (
            <div className="alert alert--success" role="status">
              <ShieldCheck size={17} />
              <div>
                <p className="alert__title">HTTP 201 Created</p>
                <p className="alert__text">
                  Your account was saved to the database. Sign in with your email and password to
                  continue.
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="alert alert--error" role="alert">
              <AlertTriangle size={17} />
              <div>
                <p className="alert__title">
                  {error.status ? `HTTP ${error.status}` : 'Connection error'}
                  {error.code ? ` · ${error.code}` : ''}
                </p>
                <p className="alert__text">{error.message}</p>
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="alert alert--success" role="status">
              <ShieldCheck size={17} />
              <div>
                <p className="alert__title">HTTP 200 OK</p>
                <p className="alert__text">{success}</p>
              </div>
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="email">
                <Mail size={14} /> Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input ${fieldErrors.email ? 'input--invalid' : ''}`}
                placeholder="student@college.edu"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? (
                <p className="field__error" id="email-error">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                <KeyRound size={14} /> Password
              </label>
              <div className="input-affix">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${fieldErrors.password ? 'input--invalid' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="input-affix__btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="field__error" id="password-error">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div className="login-form__row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link className="link-button" to="/register">
                Create an account
              </Link>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Sending POST /api/auth/login…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo access - the only place sample credentials are shown. */}
          <div className="demo-access">
            <div className="demo-access__head">
              <span className="demo-access__icon" aria-hidden="true">
                <PlayCircle size={16} />
              </span>
              <div>
                <p className="demo-access__title">Evaluator demo</p>
                <p className="demo-access__text">
                  Explore the portal instantly with the sample college account and sample data.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={handleDemoLogin}
              disabled={demoLoading || submitting}
            >
              {demoLoading ? (
                <>
                  <Loader2 size={16} className="spin" /> Opening demo…
                </>
              ) : (
                <>
                  <PlayCircle size={16} /> Enter demo site
                </>
              )}
            </button>

            <div className="demo-access__foot">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowDemoCreds((value) => !value)}
                aria-expanded={showDemoCreds}
              >
                {showDemoCreds ? 'Hide demo credentials' : 'Show demo credentials'}
              </button>
              {showDemoCreds ? (
                <div className="demo-access__creds">
                  <p className="demo-access__cred">
                    <Mail size={13} /> {DEMO_EMAIL}
                  </p>
                  <p className="demo-access__cred">
                    <KeyRound size={13} /> {DEMO_PASSWORD}
                  </p>
                  <button type="button" className="link-button" onClick={fillDemo}>
                    Fill these into the form
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <p className="login-panel__footer">
            New here? <Link to="/register">Create a student account</Link>
          </p>

          <Link className="btn btn--ghost btn--block login-panel__back" to="/register">
            <UserPlus size={15} /> Sign up
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Login;
