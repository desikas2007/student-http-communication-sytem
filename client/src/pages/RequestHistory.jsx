import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, History, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import HttpInspector from '../components/HttpInspector';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import LoadingSpinner, { SkeletonRows } from '../components/LoadingSpinner';
import { fetchLogs } from '../services/httpLogService';
import { errorMessage } from '../services/api';
import { formatDateTime, formatDuration, timeAgo } from '../utils/formatDate';

/** Paginated view over the HTTP logs persisted by the backend. */
const RequestHistory = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(1);
  const [method, setMethod] = useState('');
  const [statusClass, setStatusClass] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (method) params.method = method;
      if (search.trim()) params.search = search.trim();
      const data = await fetchLogs(params);
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, method, search]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!statusClass) return logs;
    const min = Number(statusClass[0]) * 100;
    return logs.filter((log) => log.statusCode >= min && log.statusCode < min + 100);
  }, [logs, statusClass]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const resetFilters = () => {
    setMethod('');
    setStatusClass('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Request History</h2>
          <p className="page__subtitle">
            Server-side archive from <code>GET /api/http-logs</code> ·{' '}
            {pagination.total} records for your account
          </p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : undefined} /> Refresh
        </button>
      </div>

      <section className="card card--flush">
        <form className="filters" onSubmit={applyFilters}>
          <div className="field field--search">
            <label className="sr-only" htmlFor="history-search">
              Search endpoints
            </label>
            <Search size={15} className="filters__icon" />
            <input
              id="history-search"
              className="input input--search"
              placeholder="Search endpoint…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="sr-only" htmlFor="history-method">
              Method
            </label>
            <select
              id="history-method"
              className="input input--select"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="field">
            <label className="sr-only" htmlFor="history-status">
              Status class
            </label>
            <select
              id="history-status"
              className="input input--select"
              value={statusClass}
              onChange={(event) => setStatusClass(event.target.value)}
            >
              <option value="">All status codes</option>
              <option value="2">2xx Success</option>
              <option value="4">4xx Client error</option>
              <option value="5">5xx Server error</option>
            </select>
          </div>

          <button type="submit" className="btn btn--secondary">
            <Filter size={14} /> Apply
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetFilters}>
            Reset
          </button>
        </form>
      </section>

      {loading ? (
        <section className="card">
          <SkeletonRows rows={6} height={50} />
          <LoadingSpinner label="Loading request history" />
        </section>
      ) : error ? (
        <ErrorMessage
          title="Could not load request history"
          message={errorMessage(error)}
          status={error.status}
          errorCode={error.errorCode}
          onRetry={load}
        />
      ) : filtered.length === 0 ? (
        <section className="card">
          <EmptyState
            icon={History}
            title="No matching requests"
            message="No stored HTTP logs match the current filters."
            action={
              <button type="button" className="btn btn--secondary" onClick={resetFilters}>
                Clear filters
              </button>
            }
          />
        </section>
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Method</th>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log._id}
                    className="row-clickable"
                    tabIndex={0}
                    onClick={() => setSelected(log)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(log);
                      }
                    }}
                  >
                    <td>
                      {formatDateTime(log.timestamp)}
                      <span className="cell-sub">{timeAgo(log.timestamp)}</span>
                    </td>
                    <td>
                      <StatusBadge method={log.method} />
                    </td>
                    <td className="mono mono--truncate">{log.endpoint}</td>
                    <td>
                      <StatusBadge code={log.statusCode} />
                    </td>
                    <td>{formatDuration(log.duration)}</td>
                    <td className="mono">{log.requestId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="pagination__label">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </span>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.method} ${String(selected.endpoint).split('?')[0]}` : ''}
        subtitle={selected ? `Persisted server log · ${formatDateTime(selected.timestamp)}` : ''}
        size="xl"
      >
        {selected ? (
          <HttpInspector
            entry={{
              id: selected._id,
              method: selected.method,
              endpoint: selected.endpoint,
              status: selected.statusCode,
              duration: selected.duration,
              timestamp: selected.timestamp,
              requestHeaders: selected.requestHeaders,
              requestBody: selected.requestBody,
              responseHeaders: selected.responseHeaders,
              responseBody: selected.responseBody,
              source: 'server',
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
};

export default RequestHistory;
