import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Loader2, CheckCircle2, XCircle, FlaskConical, RefreshCw, Terminal } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { JsonBlock } from '../components/RequestViewer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, publicApi, API_BASE_URL, normalizeError } from '../services/api';
import { logHttpEntry } from '../hooks/useHttpMonitor';
import { formatDuration } from '../utils/formatDate';

const DEMO_EMAIL = 'student@college.edu';
const DEMO_PASSWORD = 'password';

/**
 * Executes one request and returns { status, payload, duration, error }.
 * Requests sent through `api` are recorded by the Axios interceptor;
 * unauthenticated requests are recorded manually so nothing is missed.
 */
const call = async ({ method, url, data, auth = true }) => {
  const client = auth ? api : publicApi;
  const started = Date.now();
  let status = 0;
  let payload = null;
  let error = null;

  try {
    const response = await client.request({ method, url, data });
    status = response.status;
    payload = response.data;
  } catch (rawError) {
    const normalized = normalizeError(rawError);
    status = normalized.status;
    payload = rawError.response ? rawError.response.data : { message: normalized.message };
    error = normalized;
  }

  const duration = Date.now() - started;

  if (!auth) {
    logHttpEntry({
      timestamp: new Date().toISOString(),
      method: method.toUpperCase(),
      endpoint: url,
      url: `${API_BASE_URL}${url}`,
      status,
      duration,
      requestHeaders: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(auth ? {} : { authorization: '(none - public request)' }),
      },
      requestBody: data || null,
      responseHeaders: payload ? { 'content-type': 'application/json' } : {},
      responseBody: payload,
      source: 'test',
    });
  }

  return { status, payload, duration, error };
};

/** Educational test harness for the documented TC01-TC11 test cases. */
const ApiTestCenter = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busyAll, setBusyAll] = useState(false);

  // Register number that already belongs to a different seeded student.
  const duplicateRegister =
    user?.registerNumber === '23CSE102' ? '23CSE101' : '23CSE102';

  const validInformation = useMemo(
    () => ({
      name: user?.name || 'Arul Palanivel',
      registerNumber: user?.registerNumber || '23CSE101',
      email: user?.email || DEMO_EMAIL,
      department: user?.department || 'Computer Science and Engineering',
      year: Number(user?.year) || 3,
      section: user?.section || 'A',
      phone: user?.phone || '9876543210',
    }),
    [user]
  );

  const tests = useMemo(
    () => [
      {
        id: 'TC01',
        title: 'Valid student login',
        method: 'POST',
        endpoint: '/api/auth/login',
        expected: 200,
        auth: false,
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        note: 'Credentials in the request body are masked as ******** in the stored log.',
      },
      {
        id: 'TC02',
        title: 'Invalid password',
        method: 'POST',
        endpoint: '/api/auth/login',
        expected: 401,
        auth: false,
        data: { email: DEMO_EMAIL, password: 'wrong-password' },
      },
      {
        id: 'TC03',
        title: 'Missing email',
        method: 'POST',
        endpoint: '/api/auth/login',
        expected: 400,
        auth: false,
        data: { password: DEMO_PASSWORD },
      },
      {
        id: 'TC04',
        title: 'View examination details',
        method: 'GET',
        endpoint: '/api/exams',
        expected: 200,
        auth: true,
      },
      {
        id: 'TC05',
        title: 'Submit valid student information',
        method: 'POST',
        endpoint: '/api/students/information',
        expected: 201,
        auth: true,
        data: validInformation,
        note: 'This really writes a document to MongoDB.',
      },
      {
        id: 'TC06',
        title: 'Submit incomplete student information',
        method: 'POST',
        endpoint: '/api/students/information',
        expected: 400,
        auth: true,
        data: { name: user?.name || 'Arul Palanivel' },
      },
      {
        id: 'TC07',
        title: 'Submit duplicate register number',
        method: 'POST',
        endpoint: '/api/students/information',
        expected: 409,
        auth: true,
        data: { ...validInformation, registerNumber: duplicateRegister },
        note: `Uses the register number ${duplicateRegister}, which belongs to another seeded student.`,
      },
      {
        id: 'TC08',
        title: 'Access protected API without JWT',
        method: 'GET',
        endpoint: '/api/auth/me',
        expected: 401,
        auth: false,
      },
      {
        id: 'TC09',
        title: 'Request invalid endpoint',
        method: 'GET',
        endpoint: '/api/invalid',
        expected: 404,
        auth: false,
      },
      {
        id: 'TC10',
        title: 'Excessive requests (rate limit)',
        method: 'POST',
        endpoint: '/api/auth/login',
        expected: 429,
        auth: false,
        data: { email: DEMO_EMAIL, password: 'wrong-password' },
        manual: true,
        note: 'Sends up to 11 login attempts within one minute. The login limiter then returns 429 for ~60 seconds, so this case is not part of "Run all".',
      },
      {
        id: 'TC11',
        title: 'Simulated server/database failure',
        method: 'GET',
        endpoint: '/api/demo/server-error',
        expected: 500,
        auth: false,
      },
    ],
    [validInformation, duplicateRegister, user]
  );

  const record = (id, result, expected) => {
    setResults((current) => ({
      ...current,
      [id]: { ...result, expected, passed: result.status === expected, at: new Date().toISOString() },
    }));
  };

  const runOne = async (test) => {
    setRunning(test.id);
    try {
      if (test.id === 'TC10') {
        const started = Date.now();
        let last = null;
        for (let attempt = 0; attempt < 11; attempt += 1) {
          // eslint-disable-next-line no-await-in-loop
          last = await call({
            method: test.method,
            url: test.endpoint,
            data: test.data,
            auth: test.auth,
          });
          if (last.status === 429) break;
        }
        const result = { ...last, duration: Date.now() - started };
        record(test.id, result, test.expected);
        setDetail({ test, result });
        return result;
      }

      const result = await call({
        method: test.method,
        url: test.endpoint,
        data: test.data,
        auth: test.auth,
      });
      record(test.id, result, test.expected);
      setDetail({ test, result });
      return result;
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    setBusyAll(true);
    setResults({});
    let passed = 0;
    let failed = 0;

    for (const test of tests.filter((item) => !item.manual)) {
      // eslint-disable-next-line no-await-in-loop
      const result = await runOne(test);
      if (result.status === test.expected) passed += 1;
      else failed += 1;
    }

    setBusyAll(false);
    if (failed === 0) toast.success(`All automated cases passed (${passed})`, 'Expected status codes matched');
    else toast.error(`${failed} case(s) failed`, `${passed} passed`);
  };

  const reset = () => {
    setResults({});
    setDetail(null);
  };

  const passedCount = Object.values(results).filter((item) => item.passed).length;
  const executedCount = Object.keys(results).length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">API Test Center</h2>
          <p className="page__subtitle">
            Runs the documented test cases against the live Express server at{' '}
            <code>{API_BASE_URL}</code>. Nothing is mocked.
          </p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--primary" onClick={runAll} disabled={busyAll}>
            {busyAll ? <Loader2 size={16} className="spin" /> : <Play size={16} />} Run all cases
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset} disabled={busyAll}>
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </div>

      <section className="stat-grid stat-grid--3">
        <article className="stat-card stat-card--primary">
          <div className="stat-card__head">
            <span className="stat-card__icon">
              <FlaskConical size={18} />
            </span>
            <span className="stat-card__label">Test cases</span>
          </div>
          <p className="stat-card__value">{tests.length}</p>
          <p className="stat-card__hint">TC01 - TC11</p>
        </article>
        <article className="stat-card stat-card--success">
          <div className="stat-card__head">
            <span className="stat-card__icon">
              <CheckCircle2 size={18} />
            </span>
            <span className="stat-card__label">Passed</span>
          </div>
          <p className="stat-card__value">{passedCount}</p>
          <p className="stat-card__hint">Status code matched expectation</p>
        </article>
        <article className="stat-card stat-card--danger">
          <div className="stat-card__head">
            <span className="stat-card__icon">
              <XCircle size={18} />
            </span>
            <span className="stat-card__label">Failed / not run</span>
          </div>
          <p className="stat-card__value">{tests.length - passedCount}</p>
          <p className="stat-card__hint">{executedCount} executed so far</p>
        </article>
      </section>

      <section className="card">
        <header className="card__header">
          <div>
            <h3 className="card__title">Test cases</h3>
            <p className="card__subtitle">Each row performs a real HTTP request from your browser</p>
          </div>
          <Link className="text-link" to="/http-monitor">
            Watch them in the monitor
          </Link>
        </header>

        <div className="table-wrap">
          <table className="data-table data-table--tests">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Test case</th>
                <th scope="col">Request</th>
                <th scope="col">Expected</th>
                <th scope="col">Result</th>
                <th scope="col" aria-label="Run" />
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const result = results[test.id];
                const isRunning = running === test.id;
                return (
                  <tr key={test.id} className={result ? (result.passed ? 'row-passed' : 'row-failed') : undefined}>
                    <td className="mono">{test.id}</td>
                    <td>
                      <span className="cell-strong">{test.title}</span>
                      {test.note ? <span className="cell-sub">{test.note}</span> : null}
                    </td>
                    <td className="mono mono--truncate">
                      {test.method} {test.endpoint}
                      {test.data ? <span className="cell-sub">with JSON body</span> : null}
                    </td>
                    <td>
                      <StatusBadge code={test.expected} compact />
                    </td>
                    <td>
                      {result ? (
                        <span className="test-result">
                          <StatusBadge code={result.status} compact />
                          <span className={result.passed ? 'test-result__pass' : 'test-result__fail'}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                          <span className="muted">{formatDuration(result.duration)}</span>
                        </span>
                      ) : (
                        <span className="muted">Not run</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => runOne(test)}
                        disabled={Boolean(running) || busyAll}
                      >
                        {isRunning ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
                        {isRunning ? 'Running' : 'Run'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {detail ? (
        <section className="card">
          <header className="card__header">
            <div>
              <h3 className="card__title">
                <Terminal size={16} /> {detail.test.id} · {detail.test.title}
              </h3>
              <p className="card__subtitle">
                {detail.test.method} {detail.test.endpoint}
              </p>
            </div>
            <StatusBadge code={detail.result.status} />
          </header>

          <div className="io-panel__grid">
            <div className="io-block">
              <h4 className="io-block__title">Request body</h4>
              <JsonBlock value={detail.test.data || null} emptyLabel="No request body (GET)" />
            </div>
            <div className="io-block">
              <h4 className="io-block__title">
                Response body · {formatDuration(detail.result.duration)}
              </h4>
              <JsonBlock value={detail.result.payload} emptyLabel="No response body" />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ApiTestCenter;
