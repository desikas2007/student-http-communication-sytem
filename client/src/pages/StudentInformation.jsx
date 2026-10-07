import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Hash,
  Building2,
  GraduationCap,
  Users,
  Phone,
  Activity,
  FileText,
} from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { fetchProfile, submitInformation, updateInformation } from '../services/studentService';
import { errorMessage } from '../services/api';
import { formatDateTime } from '../utils/formatDate';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
];

const EMPTY_FORM = {
  name: '',
  registerNumber: '',
  email: '',
  department: DEPARTMENTS[0],
  year: 3,
  section: '',
  phone: '',
};

/**
 * Student information form.
 * Submits with POST /api/students/information -> 201 Created,
 * partial updates use PUT -> 200 OK.
 */
const StudentInformation = () => {
  const toast = useToast();

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await fetchProfile();
      const student = data.student;
      setForm({
        name: student.name || '',
        registerNumber: student.registerNumber || '',
        email: student.email || '',
        department: student.department || DEPARTMENTS[0],
        year: student.year || 3,
        section: student.section || '',
        phone: student.phone || '',
      });
      if (student.informationSubmitted && student.submittedAt) {
        setSubmitted({ at: student.submittedAt, code: student.informationSubmitted ? 201 : 200 });
      }
    } catch (err) {
      setProfileError(err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (form.name.trim().length < 3) errors.name = 'Full name must be at least 3 characters';
    if (!/^[A-Za-z0-9/-]{4,24}$/.test(form.registerNumber.trim()))
      errors.registerNumber = 'Use 4-24 letters or digits, e.g. 23CSE101';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
    if (!form.department) errors.department = 'Select your department';
    if (!form.year || form.year < 1 || form.year > 5) errors.year = 'Year must be between 1 and 5';
    if (!/^[A-Za-z]{1,3}$/.test(form.section.trim())) errors.section = 'Section must be 1-3 letters';
    if (!/^[0-9+-\s]{7,15}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 7-15 digit phone number';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const applyServerErrors = (error) => {
    if (error.status === 400 && Array.isArray(error.errors) && error.errors.length) {
      const mapped = {};
      error.errors.forEach((issue) => {
        if (issue.field) mapped[issue.field] = issue.message;
      });
      setFieldErrors(mapped);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      registerNumber: form.registerNumber.trim().toUpperCase(),
      email: form.email.trim(),
      department: form.department,
      year: Number(form.year),
      section: form.section.trim().toUpperCase(),
      phone: form.phone.trim(),
    };

    setSubmitting(true);
    try {
      const data = await submitInformation(payload);
      setSubmitted({ at: new Date().toISOString(), code: 201 });
      toast.success('Student information submitted successfully', 'HTTP 201 Created');
      // Refresh from the server so the stored record is what we display.
      setForm({
        ...payload,
        name: data.data?.student?.name || payload.name,
      });
    } catch (err) {
      setSubmitError(err);
      applyServerErrors(err);
      toast.error(`Submission failed · HTTP ${err.status || 0}`, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setSubmitError(null);
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      registerNumber: form.registerNumber.trim().toUpperCase(),
      email: form.email.trim(),
      department: form.department,
      year: Number(form.year),
      section: form.section.trim().toUpperCase(),
      phone: form.phone.trim(),
    };

    setSubmitting(true);
    try {
      await updateInformation(payload);
      setSubmitted({ at: new Date().toISOString(), code: 200 });
      toast.success('Student information updated', 'HTTP 200 OK');
    } catch (err) {
      setSubmitError(err);
      applyServerErrors(err);
      toast.error(`Update failed · HTTP ${err.status || 0}`, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="page">
        <LoadingSpinner label="Loading your profile (GET /api/students/profile)" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="page">
        <ErrorMessage
          title="Could not load your profile"
          message={errorMessage(profileError)}
          status={profileError.status}
          errorCode={profileError.errorCode}
          onRetry={loadProfile}
        />
      </div>
    );
  }

  const departmentOptions = DEPARTMENTS.includes(form.department)
    ? DEPARTMENTS
    : [form.department, ...DEPARTMENTS].filter(Boolean);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Student Information</h2>
          <p className="page__subtitle">
            Submitting this form sends a <code>POST /api/students/information</code> request with a
            JSON body to the Express server.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/http-monitor">
          <Activity size={16} /> Inspect the request
        </Link>
      </div>

      {submitted ? (
        <section className="success-panel" role="status">
          <span className="success-panel__icon">
            <CheckCircle2 size={22} />
          </span>
          <div className="success-panel__body">
            <h3>Student information submitted successfully.</h3>
            <p>
              The server responded with{' '}
              <span className="badge badge--success">
                {submitted.code} {submitted.code === 201 ? 'Created' : 'OK'}
              </span>{' '}
              and the record was stored in MongoDB.
            </p>
            <p className="muted">Last submission: {formatDateTime(submitted.at)}</p>
          </div>
          <div className="success-panel__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setSubmitted(null)}>
              <FileText size={15} /> Edit information
            </button>
            <Link className="btn btn--primary" to="/request-history">
              View in history
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid-2 grid-2--form">
        {/* ---------- Form ---------- */}
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">{submitted ? 'Update information' : 'Information form'}</h3>
              <p className="card__subtitle">All fields are required - incomplete data returns 400</p>
            </div>
          </header>

          {submitError ? (
            <div className="alert alert--error" role="alert">
              <AlertTriangle size={17} />
              <div>
                <p className="alert__title">
                  HTTP {submitError.status || 0} · {submitError.errorCode}
                </p>
                <p className="alert__text">{submitError.message}</p>
                {submitError.status === 409 ? (
                  <p className="alert__text muted">
                    Another student already uses that register number or email (duplicate record).
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="full-name">
                <User size={14} /> Full Name
              </label>
              <input
                id="full-name"
                className={`input ${fieldErrors.name ? 'input--invalid' : ''}`}
                value={form.name}
                onChange={update('name')}
                placeholder="Arul Palanivel"
              />
              {fieldErrors.name ? <p className="field__error">{fieldErrors.name}</p> : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="register-number">
                <Hash size={14} /> Register Number
              </label>
              <input
                id="register-number"
                className={`input ${fieldErrors.registerNumber ? 'input--invalid' : ''}`}
                value={form.registerNumber}
                onChange={update('registerNumber')}
                placeholder="23CSE101"
              />
              {fieldErrors.registerNumber ? (
                <p className="field__error">{fieldErrors.registerNumber}</p>
              ) : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="info-email">
                <Mail size={14} /> Email
              </label>
              <input
                id="info-email"
                type="email"
                className={`input ${fieldErrors.email ? 'input--invalid' : ''}`}
                value={form.email}
                onChange={update('email')}
                placeholder="student@college.edu"
              />
              {fieldErrors.email ? <p className="field__error">{fieldErrors.email}</p> : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="department">
                <Building2 size={14} /> Department
              </label>
              <select
                id="department"
                className={`input input--select ${fieldErrors.department ? 'input--invalid' : ''}`}
                value={form.department}
                onChange={update('department')}
              >
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              {fieldErrors.department ? <p className="field__error">{fieldErrors.department}</p> : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="year">
                <GraduationCap size={14} /> Year
              </label>
              <select
                id="year"
                className={`input input--select ${fieldErrors.year ? 'input--invalid' : ''}`}
                value={form.year}
                onChange={update('year')}
              >
                {[1, 2, 3, 4, 5].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
              {fieldErrors.year ? <p className="field__error">{fieldErrors.year}</p> : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="section">
                <Users size={14} /> Section
              </label>
              <input
                id="section"
                className={`input ${fieldErrors.section ? 'input--invalid' : ''}`}
                value={form.section}
                onChange={update('section')}
                placeholder="A"
                maxLength={3}
              />
              {fieldErrors.section ? <p className="field__error">{fieldErrors.section}</p> : null}
            </div>

            <div className="field field--full">
              <label className="field__label" htmlFor="phone">
                <Phone size={14} /> Phone Number
              </label>
              <input
                id="phone"
                className={`input ${fieldErrors.phone ? 'input--invalid' : ''}`}
                value={form.phone}
                onChange={update('phone')}
                placeholder="9876543210"
                inputMode="tel"
              />
              {fieldErrors.phone ? <p className="field__error">{fieldErrors.phone}</p> : null}
            </div>

            <div className="form-actions field--full">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit information (POST)
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleUpdate}
                disabled={submitting}
              >
                Save changes (PUT)
              </button>
            </div>
          </form>
        </section>

        {/* ---------- Explanation ---------- */}
        <aside className="card card--aside">
          <header className="card__header">
            <div>
              <h3 className="card__title">What happens on submit</h3>
              <p className="card__subtitle">Browser → server → MongoDB → browser</p>
            </div>
          </header>

          <ol className="steps-list">
            <li>
              <span className="steps-list__index">1</span>
              React validates the fields locally, then builds a JSON body.
            </li>
            <li>
              <span className="steps-list__index">2</span>
              Axios sends <strong>POST /api/students/information</strong> with{' '}
              <code>Authorization: Bearer &lt;JWT&gt;</code>.
            </li>
            <li>
              <span className="steps-list__index">3</span>
              Express runs helmet, CORS, the request logger, rate limiting and express-validator.
            </li>
            <li>
              <span className="steps-list__index">4</span>
              The controller checks for duplicate register numbers and writes the document to
              MongoDB.
            </li>
            <li>
              <span className="steps-list__index">5</span>
              The server replies <strong>201 Created</strong> with a JSON body, or 400 / 409 on
              failure.
            </li>
            <li>
              <span className="steps-list__index">6</span>
              The HTTP Monitor records the exchange and React shows the result.
            </li>
          </ol>

          <div className="code-hint">
            <p className="code-hint__title">Request payload</p>
            <pre>
              <code>{`{
  "name": "${form.name || 'Your name'}",
  "registerNumber": "${form.registerNumber || '23CSE101'}",
  "email": "${form.email || 'student@college.edu'}",
  "department": "${form.department}",
  "year": ${Number(form.year) || 3},
  "section": "${form.section || 'A'}",
  "phone": "${form.phone || '9876543210'}"
}`}</code>
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentInformation;
