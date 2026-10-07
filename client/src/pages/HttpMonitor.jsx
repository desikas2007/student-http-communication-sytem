import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Radio,
  Server,
  Trash2,
  RefreshCw,
  Inbox,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import HttpInspector from '../components/HttpInspector';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import LoadingSpinner, { SkeletonRows } from '../components/LoadingSpinner';
import LifecycleFlow from '../components/LifecycleFlow';
import HttpConceptCards from '../components/HttpConceptCards';

import { useHttpMonitor } from '../hooks/useHttpMonitor';
import { fetchLogs, fetchStatistics } from '../services/httpLogService';
import { errorMessage } from '../services/api';
import { formatClock, formatDuration, timeAgo } from '../utils/formatDate';

const COLORS = { success: '#16A34A', danger: '#DC2626', info: '#2563EB', accent: '#7C3AED', warning: '#D97706' };

/** Converts a persisted HttpLog document into the inspector entry shape. */
const toEntry = (log) => ({
  id: log._id,
  method: log.method,
  endpoint: log.endpoint,
  status: log.statusCode,
  duration: log.duration,
  timestamp: log.timestamp,
  requestHeaders: log.requestHeaders,
  requestBody: log.requestBody,
  responseHeaders: log.responseHeaders,
  responseBody: log.responseBody,
  source: 'server',
});

/** Developer style HTTP communication dashboard. */
const HttpMonitor = () => {
  const { entries: liveEntries, stats: liveStats, clear } = useHttpMonitor();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [serverLogs, setServerLogs] = useState([]);
  const [tab, setTab] = useState('live');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, logData] = await Promise.all([
        fetchStatistics(),
        fetchLogs({ limit: 50 }),
      ]);
      setStats(statData.statistics);
      setServerLogs(logData.logs || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const methodData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'GET', count: stats.get },
      { name: 'POST', count: stats.post },
      { name: 'PUT', count: stats.put },
      { name: 'DELETE', count: stats.delete },
    ].filter((row) => row.count > 0);
  }, [stats]);

  const outcomeData = useMemo(
    () =>
      stats
        ? [
            { name: 'Successful (2xx)', value: stats.successful },
            { name: 'Failed (4xx/5xx)', value: stats.failed },
          ].filter((row) => row.value > 0)
        : [],
    [stats]
  );

  const statusData = useMemo(
    () =>
      stats
        ? stats.statusCodes.map((row) => ({
            name: String(row.statusCode),
            count: row.count,
            fill: row.statusCode >= 500 ? COLORS.danger : row.statusCode >= 400 ? COLORS.warning : COLORS.success,
          }))
        : [],
    [stats]
  );

  const rows = tab === 'live' ? liveEntries : serverLogs.map(toEntry);

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h2 className="page__title">HTTP Communication Monitor</h2>
            <p className="page__subtitle">GET /api/http-logs/statistics</p>
          </div>
        </div>
        <div className="stat-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="stat-card stat-card--skeleton" key={index}>
              <div className="skeleton-block" style={{ height: 14, width: '60%' }} />
              <div className="skeleton-block" style={{ height: 28, width: '40%', marginTop: 12 }} />
            </div>
          ))}
        </div>
        <SkeletonRows rows={6} />
        <LoadingSpinner label="Loading HTTP statistics" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorMessage
          title="HTTP monitor unavailable"
          message={errorMessage(error)}
          status={error.status}
          errorCode={error.errorCode}
          onRetry={load}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">HTTP Communication Monitor</h2>
          <p className="page__subtitle">
            Every request the browser sends and every response the college server returns -
            stored in MongoDB and mirrored live in this tab.
          </p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button type="button" className="btn btn--ghost" onClick={clear}>
            <Trash2 size={15} /> Clear live session
          </button>
        </div>
      </div>

      {/* ---------- Key statistics ---------- */}
      <section className="stat-grid stat-grid--6" aria-label="HTTP statistics">
        <StatCard icon={Activity} label="Total Requests" value={stats?.total ?? 0} hint="Persisted logs" tone="primary" />
        <StatCard icon={ArrowUpRight} label="GET Requests" value={stats?.get ?? 0} hint="Retrieving data" tone="info" />
        <StatCard icon={Radio} label="POST Requests" value={stats?.post ?? 0} hint="Sending data" tone="accent" />
        <StatCard icon={CheckCircle2} label="Successful" value={stats?.successful ?? 0} hint="2xx responses" tone="success" />
        <StatCard icon={XCircle} label="Failed" value={stats?.failed ?? 0} hint="4xx / 5xx responses" tone="danger" />
        <StatCard
          icon={Timer}
          label="Avg Response Time"
          value={formatDuration(stats?.averageResponseTime ?? 0)}
          hint={`fastest ${formatDuration(stats?.fastestResponseTime ?? 0)}`}
          tone="warning"
        />
      </section>

      {/* ---------- Charts ---------- */}
      <div className="grid-3">
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">GET vs POST</h3>
              <p className="card__subtitle">Requests by HTTP method</p>
            </div>
          </header>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={methodData} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} width={50} />
                <Tooltip cursor={{ fill: '#EFF6FF' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={54}>
                  {methodData.map((row) => (
                    <Cell
                      key={row.name}
                      fill={row.name === 'POST' ? COLORS.accent : row.name === 'GET' ? COLORS.info : COLORS.warning}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Success vs Failure</h3>
              <p className="card__subtitle">Outcome of every recorded response</p>
            </div>
          </header>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {outcomeData.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Cell key={index} fill={index === 0 ? COLORS.success : COLORS.danger} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">Status Distribution</h3>
              <p className="card__subtitle">How often each status code was returned</p>
            </div>
          </header>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} width={50} />
                <Tooltip cursor={{ fill: '#EFF6FF' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {statusData.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ---------- Request table ---------- */}
      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">Request Table</h3>
            <p className="card__subtitle">Click any row to open the full request / response inspector</p>
          </div>
          <div className="tabs" role="tablist" aria-label="Request source">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'live'}
              className={`tab ${tab === 'live' ? 'tab--active' : ''}`}
              onClick={() => setTab('live')}
            >
              Live session ({liveEntries.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'server'}
              className={`tab ${tab === 'server' ? 'tab--active' : ''}`}
              onClick={() => setTab('server')}
            >
              Server logs ({serverLogs.length})
            </button>
          </div>
        </header>

        {rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={tab === 'live' ? 'No requests in this browser session yet' : 'No persisted logs yet'}
            message={
              tab === 'live'
                ? 'Navigate the portal - every Axios request is captured here instantly.'
                : 'Interact with the portal and the backend logger will persist each exchange.'
            }
            action={
              <Link className="btn btn--secondary" to="/api-test-center">
                Open API Test Center
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table--monitor">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Method</th>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col">Duration</th>
                  <th scope="col" aria-label="Open detail" />
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((entry) => (
                  <tr
                    key={entry.id}
                    className="row-clickable"
                    tabIndex={0}
                    onClick={() => setSelected(entry)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(entry);
                      }
                    }}
                  >
                    <td className="mono">{formatClock(entry.timestamp)}</td>
                    <td>
                      <StatusBadge method={entry.method} />
                    </td>
                    <td className="mono mono--truncate">{entry.endpoint}</td>
                    <td>
                      <StatusBadge code={entry.status} />
                    </td>
                    <td className={entry.duration > 500 ? 'duration--slow' : undefined}>
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="cell-peek">
                      {tab === 'server' ? timeAgo(entry.timestamp) : 'live'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="legend-row">
          <span className="legend-item legend-item--get">GET - retrieve data</span>
          <span className="legend-item legend-item--post">POST - send data</span>
          <span className="legend-item legend-item--2xx">2xx - success</span>
          <span className="legend-item legend-item--4xx">4xx - client error</span>
          <span className="legend-item legend-item--5xx">5xx - server error</span>
        </div>
      </section>

      {/* ---------- Lifecycle ---------- */}
      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">HTTP Request Lifecycle</h3>
            <p className="card__subtitle">From a click in the browser to data in MongoDB and back</p>
          </div>
          <Link className="text-link" to="/api-test-center">
            Try it yourself <ArrowUpRight size={14} />
          </Link>
        </header>
        <LifecycleFlow />
      </section>

      {/* ---------- Educational analysis ---------- */}
      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">HTTP Analysis</h3>
            <p className="card__subtitle">Methods and status codes used throughout this portal</p>
          </div>
          <span className="pill pill--accent">
            <Server size={13} /> Express + MongoDB
          </span>
        </header>
        <HttpConceptCards />
      </section>

      {/* ---------- Detail modal ---------- */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.method} ${String(selected.endpoint).split('?')[0]}` : ''}
        subtitle={selected ? `${selected.source === 'live' ? 'Live browser session' : 'Persisted server log'}` : ''}
        size="xl"
      >
        {selected ? <HttpInspector entry={selected} /> : null}
      </Modal>
    </div>
  );
};

export default HttpMonitor;
