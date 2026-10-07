import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarClock,
  Activity,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Server,
  Database,
  Monitor,
  Zap,
  Inbox,
  User,
  FileText,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner, { SkeletonRows } from '../components/LoadingSpinner';
import LifecycleFlow from '../components/LifecycleFlow';

import { useAuth } from '../context/AuthContext';
import { fetchExaminations } from '../services/examService';
import { fetchLogs, fetchStatistics, fetchHealth } from '../services/httpLogService';
import { formatDate, formatDuration, greeting, firstName, relativeDaysLabel, daysUntil } from '../utils/formatDate';
import { errorMessage } from '../services/api';

/** Authenticated dashboard: statistics, upcoming exam, recent traffic, system status. */
const Dashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examinations, setExaminations] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [health, setHealth] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [examData, statData, logData] = await Promise.all([
        fetchExaminations(),
        fetchStatistics(),
        fetchLogs({ limit: 6 }),
      ]);
      setExaminations(examData.examinations || []);
      setStats(statData.statistics);
      setRecentLogs(logData.logs || []);
      try {
        setHealth(await fetchHealth());
      } catch {
        setHealth(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = examinations
    .filter((exam) => new Date(exam.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const completed = examinations.filter((exam) => new Date(exam.date) < today);

  const chartData = recentLogs
    .slice(0, 8)
    .reverse()
    .map((log) => ({
      name: `${log.method} ${log.endpoint.replace('/api', '').split('?')[0] || '/'}`,
      duration: Number(log.duration) || 0,
      status: log.statusCode,
    }));

  const quickActions = [
    { to: '/examinations', label: 'View Examinations', icon: FileText, description: 'GET /api/exams' },
    { to: '/student-information', label: 'Submit Information', icon: User, description: 'POST /api/students/information' },
    { to: '/http-monitor', label: 'HTTP Monitor', icon: Activity, description: 'Live request inspector' },
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h2 className="page__title">Loading dashboard</h2>
            <p className="page__subtitle">Fetching examinations and HTTP statistics…</p>
          </div>
        </div>
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="stat-card stat-card--skeleton" key={index}>
              <div className="skeleton-block" style={{ height: 14, width: '55%' }} />
              <div className="skeleton-block" style={{ height: 30, width: '35%', marginTop: 14 }} />
            </div>
          ))}
        </div>
        <SkeletonRows rows={5} />
        <LoadingSpinner label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorMessage
          title="Unable to load the dashboard"
          message={errorMessage(error)}
          status={error.status}
          errorCode={error.errorCode}
          onRetry={load}
        />
      </div>
    );
  }

  const nextExam = upcoming[0];

  return (
    <div className="page">
      {/* ---------- Welcome ---------- */}
      <section className="welcome">
        <div>
          <h2 className="welcome__title">
            {greeting()}, {firstName(user?.name)}
          </h2>
          <p className="welcome__subtitle">
            {formatDate(new Date())} · Here is what is happening with your account and the
            college server today.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/http-monitor">
          <Activity size={16} /> Open HTTP Monitor
        </Link>
      </section>

      {/* ---------- Statistics ---------- */}
      <section className="stat-grid" aria-label="Statistics">
        <StatCard
          icon={CalendarClock}
          label="Upcoming Exams"
          value={upcoming.length}
          hint={nextExam ? `Next: ${nextExam.subject}` : 'No scheduled exams'}
          tone="primary"
        />
        <StatCard
          icon={CalendarCheck}
          label="Completed Exams"
          value={completed.length}
          hint={`${examinations.length} total in this semester`}
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="HTTP Requests"
          value={stats?.total ?? 0}
          hint="Recorded by the backend logger"
          tone="accent"
        />
        <StatCard
          icon={CheckCircle2}
          label="Successful Requests"
          value={stats?.successful ?? 0}
          hint={`${stats?.failed ?? 0} failed · avg ${formatDuration(stats?.averageResponseTime ?? 0)}`}
          tone="warning"
        />
      </section>

      <div className="grid-2">
        {/* ---------- Upcoming examination ---------- */}
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Upcoming Examination</h3>
              <p className="card__subtitle">Delivered to your browser by GET /api/exams</p>
            </div>
            <Link className="text-link" to="/examinations">
              View all <ArrowRight size={14} />
            </Link>
          </header>

          {nextExam ? (
            <div className="exam-highlight">
              <div className="exam-highlight__top">
                <span className="pill pill--primary">{nextExam.examType}</span>
                <span className="pill">{relativeDaysLabel(nextExam.date)}</span>
              </div>
              <h4 className="exam-highlight__subject">{nextExam.subject}</h4>
              <p className="exam-highlight__code">
                {nextExam.subjectCode} · Semester {nextExam.semester}
              </p>
              <dl className="exam-highlight__meta">
                <div>
                  <dt>Date</dt>
                  <dd>{formatDate(nextExam.date)}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>
                    {nextExam.startTime} - {nextExam.endTime}
                  </dd>
                </div>
                <div>
                  <dt>Room</dt>
                  <dd>{nextExam.room}</dd>
                </div>
              </dl>
              {nextExam.instructions ? (
                <p className="exam-highlight__note">{nextExam.instructions}</p>
              ) : null}
            </div>
          ) : (
            <p className="muted">No upcoming examinations scheduled.</p>
          )}

          <ul className="mini-list">
            {upcoming.slice(1, 4).map((exam) => (
              <li key={exam._id}>
                <span className="mini-list__main">
                  <strong>{exam.subject}</strong>
                  <span className="muted">{exam.subjectCode}</span>
                </span>
                <span className="mini-list__meta">
                  {formatDate(exam.date)} · {relativeDaysLabel(exam.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Communication overview ---------- */}
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Communication Overview</h3>
              <p className="card__subtitle">Response time of your most recent HTTP requests</p>
            </div>
            <span className="pill pill--accent">
              <Zap size={13} /> avg {formatDuration(stats?.averageResponseTime ?? 0)}
            </span>
          </header>

          {chartData.length ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="ms" width={60} />
                  <Tooltip
                    cursor={{ fill: '#EFF6FF' }}
                    formatter={(value) => [`${value} ms`, 'Duration']}
                  />
                  <Bar dataKey="duration" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">No request history yet - interact with the portal to see traffic.</p>
          )}
        </section>
      </div>

      {/* ---------- Recent HTTP requests ---------- */}
      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">Recent HTTP Requests</h3>
            <p className="card__subtitle">Persisted by the Express request logger</p>
          </div>
          <Link className="text-link" to="/request-history">
            Request history <ArrowRight size={14} />
          </Link>
        </header>

        {recentLogs.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Method</th>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="mono">{new Date(log.timestamp).toLocaleTimeString('en-GB')}</td>
                    <td>
                      <StatusBadge method={log.method} />
                    </td>
                    <td className="mono mono--truncate">{log.endpoint}</td>
                    <td>
                      <StatusBadge code={log.statusCode} />
                    </td>
                    <td>{formatDuration(log.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No HTTP requests recorded yet.</p>
        )}
      </section>

      <div className="grid-2">
        {/* ---------- Quick actions ---------- */}
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Quick Actions</h3>
              <p className="card__subtitle">Jump straight to a workflow</p>
            </div>
          </header>
          <div className="quick-grid">
            {quickActions.map((action) => (
              <Link className="quick-action" to={action.to} key={action.to}>
                <span className="quick-action__icon">
                  <action.icon size={17} />
                </span>
                <span className="quick-action__text">
                  <strong>{action.label}</strong>
                  <span className="muted">{action.description}</span>
                </span>
                <ArrowRight size={15} className="quick-action__arrow" />
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- System status ---------- */}
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">System Status</h3>
              <p className="card__subtitle">Verified through GET /api/health</p>
            </div>
            <button type="button" className="icon-btn" onClick={load} aria-label="Refresh status">
              <RefreshCw size={16} />
            </button>
          </header>

          <ul className="status-list">
            <li>
              <span className="status-list__label">
                <Monitor size={15} /> Frontend
              </span>
              <span className="badge badge--success">Connected</span>
            </li>
            <li>
              <span className="status-list__label">
                <Server size={15} /> Backend
              </span>
              <span className={`badge ${health ? 'badge--success' : 'badge--danger'}`}>
                {health ? 'Online' : 'Offline'}
              </span>
            </li>
            <li>
              <span className="status-list__label">
                <Database size={15} /> Database
              </span>
              <span className={`badge ${health?.database === 'connected' ? 'badge--success' : 'badge--warning'}`}>
                {health?.database === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </li>
            <li>
              <span className="status-list__label">
                <Zap size={15} /> API
              </span>
              <span className={`badge ${health ? 'badge--success' : 'badge--danger'}`}>
                {health ? 'Operational' : 'Unavailable'}
              </span>
            </li>
            <li>
              <span className="status-list__label">
                <Inbox size={15} /> Exams loaded
              </span>
              <span className="badge badge--info">{examinations.length} records</span>
            </li>
          </ul>

          <div className="next-exam-strip">
            <span className="muted">Days until next exam</span>
            <strong>{nextExam ? Math.max(daysUntil(nextExam.date), 0) : '-'}</strong>
          </div>
        </section>
      </div>

      {/* ---------- Lifecycle ---------- */}
      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">HTTP Request Lifecycle</h3>
            <p className="card__subtitle">
              Every action in this portal travels through the full round trip below
            </p>
          </div>
        </header>
        <LifecycleFlow />
      </section>
    </div>
  );
};

export default Dashboard;
