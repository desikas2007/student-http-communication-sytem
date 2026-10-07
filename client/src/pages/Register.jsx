import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Hash,
  Building2,
  Users,
  Phone,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { register as registerAccount } from '../services/authService';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
];

const YEARS = [1, 2, 3, 4, 5];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_NUMBER_PATTERN = /^[A-Za-z0-9]{4,24}$/;
const SECTION_PATTERN = /^[A-Za-z0-9]{1,4}$/;
const PHONE_PATTERN = /^[0-9]{7,15}$/;

const EMPTY_FORM = {
  name: '',
  registerNumber: '',
  email: '',
  department: DEPARTMENTS[0],
  year: 3,
  section: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

/**
 * Sign Up page.
 * The account is written to MongoDB with POST /api/auth/register and only after
 * that request answers 201 Created does the browser move to the login page.
 */
const Register = () => {
  const { isAuthenticated, loading: sessionLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // A signed-in visitor has no reason to see the sign-up form.
  if (!sessionLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const setField = (name) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const validate = () => {
    const errors = {};
    const trimmed = {
      name: form.name.trim(),
      registerNumber: form.registerNumber.trim(),
      email: form.email.trim(),
      section: form.section.trim(),
      phone: form.phone.trim(),
    };

    if (!trimmed.name) errors.name = 'Full name is required';
    else if (trimmed.name.length < 2) errors.name = 'Name must be at least 2 characters';

    if (!trimmed.registerNumber) errors.registerNumber = 'Register number is required';
    else if (!REGISTER_NUMBER_PATTERN.test(trimmed.registerNumber))
      errors.registerNumber = 'Use 4-24 letters or digits (e.g. 23CSE101)';

    if (!trimmed.email) errors.email = 'Email is required';
    else if (!EMAIL_PATTERN.test(trimmed.email)) errors.email = 'Enter a valid email address';

    if (!form.department) errors.department = 'Select your department';
    if (!YEARS.includes(Number(form.year))) errors.year = 'Select your year of study';

    if (!trimmed.section) errors.section = 'Section is required';
    else if (!SECTION_PATTERN.test(trimmed.section)) errors.section = 'Section must be 1-4 characters';

    if (trimmed.phone && !PHONE_PATTERN.test(trimmed.phone))
      errors.phone = 'Phone must be 7-15 digits';

    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password';
    else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await registerAccount({
        name: form.name.trim(),
        registerNumber: form.registerNumber.trim(),
        email: form.email.trim(),
        department: form.department,
        year: Number(form.year),
        section: form.section.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      // The record is in MongoDB now - hand the student over to the login page.
      setSuccess(data.message || 'Account created successfully.');
      toast.success('Account created', 'Saved to the database · HTTP 201 Created');
      navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      const serverErrors = Array.isArray(err.errors) ? err.errors : [];
      if (serverErrors.length) {
        setFieldErrors((current) => ({
          ...current,
          ...serverErrors.reduce((acc, issue) => {
            if (issue.field) acc[issue.field] = issue.message;
            return acc;
          }, {}),
        }));
      }
      setError({
        status: err.status || 0,
        message: err.message,
        code: err.errorCode,
      });
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="login-brand__title">Create your student account</h1>
          <p className="login-brand__subtitle">
            Fill in your details once. The record is stored in the college database, and you sign in
            with the same email and password afterwards.
          </p>

          <ul className="login-brand__points">
            <li>
              <ShieldCheck size={16} /> Password is hashed with bcrypt before it is stored
            </li>
            <li>
              <KeyRound size={16} /> Sign-in is verified against the database only
            </li>
            <li>
              <ArrowRight size={16} /> Your dashboard then loads your own stored data
            </li>
          </ul>

          <div className="login-flow" aria-hidden="true">
            <span>Form</span>
            <ArrowRight size={14} />
            <span>POST /api/auth/register</span>
            <ArrowRight size={14} />
            <span>MongoDB</span>
            <ArrowRight size={14} />
            <span>Login</span>
          </div>
        </div>
      </section>

      {/* ---------- Right: sign-up form ---------- */}
      <section className="login-panel">
        <div className="login-panel__inner login-panel__inner--wide">
          <header className="login-panel__header">
            <h2>Sign up</h2>
            <p>Register a new student account.</p>
          </header>

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
                <p className="alert__title">HTTP 201 Created</p>
                <p className="alert__text">{success}</p>
              </div>
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="field field--full">
                <label className="field__label" htmlFor="name">
                  <User size={14} /> Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`input ${fieldErrors.name ? 'input--invalid' : ''}`}
                  placeholder="Arul Palanivel"
                  value={form.name}
                  autoComplete="name"
                  onChange={setField('name')}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name ? <p className="field__error">{fieldErrors.name}</p> : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="registerNumber">
                  <Hash size={14} /> Register number
                </label>
                <input
                  id="registerNumber"
                  name="registerNumber"
                  type="text"
                  className={`input ${fieldErrors.registerNumber ? 'input--invalid' : ''}`}
                  placeholder="23CSE101"
                  value={form.registerNumber}
                  onChange={setField('registerNumber')}
                  aria-invalid={Boolean(fieldErrors.registerNumber)}
                />
                {fieldErrors.registerNumber ? (
                  <p className="field__error">{fieldErrors.registerNumber}</p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="section">
                  <Users size={14} /> Section
                </label>
                <input
                  id="section"
                  name="section"
                  type="text"
                  className={`input ${fieldErrors.section ? 'input--invalid' : ''}`}
                  placeholder="A"
                  maxLength={4}
                  value={form.section}
                  onChange={setField('section')}
                  aria-invalid={Boolean(fieldErrors.section)}
                />
                {fieldErrors.section ? <p className="field__error">{fieldErrors.section}</p> : null}
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="email">
                  <Mail size={14} /> Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`input ${fieldErrors.email ? 'input--invalid' : ''}`}
                  placeholder="student@college.edu"
                  value={form.email}
                  autoComplete="email"
                  onChange={setField('email')}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? <p className="field__error">{fieldErrors.email}</p> : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="department">
                  <Building2 size={14} /> Department
                </label>
                <select
                  id="department"
                  name="department"
                  className={`input input--select ${fieldErrors.department ? 'input--invalid' : ''}`}
                  value={form.department}
                  onChange={setField('department')}
                  aria-invalid={Boolean(fieldErrors.department)}
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                {fieldErrors.department ? (
                  <p className="field__error">{fieldErrors.department}</p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="year">
                  <GraduationCap size={14} /> Year
                </label>
                <select
                  id="year"
                  name="year"
                  className={`input input--select ${fieldErrors.year ? 'input--invalid' : ''}`}
                  value={form.year}
                  onChange={setField('year')}
                  aria-invalid={Boolean(fieldErrors.year)}
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
                {fieldErrors.year ? <p className="field__error">{fieldErrors.year}</p> : null}
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="phone">
                  <Phone size={14} /> Phone <span className="field__optional">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  className={`input ${fieldErrors.phone ? 'input--invalid' : ''}`}
                  placeholder="9876543210"
                  value={form.phone}
                  autoComplete="tel"
                  onChange={setField('phone')}
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone ? <p className="field__error">{fieldErrors.phone}</p> : null}
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
                    placeholder="At least 6 characters"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={setField('password')}
                    aria-invalid={Boolean(fieldErrors.password)}
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
                {fieldErrors.password ? <p className="field__error">{fieldErrors.password}</p> : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="confirmPassword">
                  <ShieldCheck size={14} /> Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${fieldErrors.confirmPassword ? 'input--invalid' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={setField('confirmPassword')}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword ? (
                  <p className="field__error">{fieldErrors.confirmPassword}</p>
                ) : null}
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving POST /api/auth/register…
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Create account
                </>
              )}
            </button>
          </form>

          <p className="login-panel__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <Link className="btn btn--ghost btn--block login-panel__back" to="/login">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Register;
