import RequestViewer from './RequestViewer';
import ResponseViewer from './ResponseViewer';
import { formatClock, formatDuration, timeAgo } from '../utils/formatDate';
import { getStatusInfo } from '../utils/statusCode';

/**
 * Full request/response detail view.
 * Accepts a "live" entry from the client interceptor or a persisted log
 * document returned by GET /api/http-logs/:id.
 */
const HttpInspector = ({ entry }) => {
  if (!entry) return null;

  const info = getStatusInfo(entry.status ?? entry.statusCode);
  const timestamp = entry.timestamp;
  const duration = entry.duration;

  const summary = {
    method: entry.method,
    endpoint: entry.endpoint,
    status: entry.status ?? entry.statusCode,
    duration,
    timestamp,
    requestHeaders: entry.requestHeaders,
    requestBody: entry.requestBody,
    responseHeaders: entry.responseHeaders,
    responseBody: entry.responseBody,
  };

  return (
    <div className="inspector">
      <div className="inspector__summary">
        <span className="inspector__summary-item">
          <span className="inspector__summary-label">Time</span>
          {formatClock(timestamp)}
        </span>
        <span className="inspector__summary-item">
          <span className="inspector__summary-label">Duration</span>
          {formatDuration(duration)}
        </span>
        <span className="inspector__summary-item">
          <span className="inspector__summary-label">Status</span>
          <span className={`badge badge--${info.tone}`}>
            {summary.status || 0} {info.label}
          </span>
        </span>
        <span className="inspector__summary-item">
          <span className="inspector__summary-label">Recorded</span>
          {timeAgo(timestamp)}
        </span>
      </div>

      <RequestViewer entry={summary} />
      <ResponseViewer entry={summary} />

      <p className="inspector__note">
        Sensitive fields such as <code>password</code> and <code>authorization</code> are masked by
        both the client and the server before a log record is stored.
      </p>
    </div>
  );
};

export default HttpInspector;
