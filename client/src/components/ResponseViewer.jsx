import { getStatusInfo, STATUS_MESSAGES } from '../utils/statusCode';
import { formatDuration, formatDateTime } from '../utils/formatDate';
import { JsonBlock, KeyValueTable } from './RequestViewer';

/**
 * RESPONSE panel of the inspector: status line, headers, body and timing.
 */
const ResponseViewer = ({ entry }) => {
  const info = getStatusInfo(entry.status);
  const hasBody =
    entry.responseBody !== null && entry.responseBody !== undefined && entry.responseBody !== '';

  return (
    <section className="io-panel">
      <header className={`io-panel__header io-panel__header--response io-panel__header--${info.tone}`}>
        <span className="io-panel__title">Response</span>
        <span className="io-panel__line">
          <span className={`badge badge--${info.tone}`}>
            {entry.status || 0} {info.label}
          </span>
          <code className="io-panel__url">
            HTTP/1.1 {entry.status || 0} {STATUS_MESSAGES[entry.status] || info.label}
          </code>
        </span>
      </header>

      <div className="io-panel__grid">
        <div className="io-block">
          <h4 className="io-block__title">Response headers</h4>
          <KeyValueTable data={entry.responseHeaders} />
        </div>

        <div className="io-block">
          <h4 className="io-block__title">Timing</h4>
          <dl className="timing-list">
            <div>
              <dt>Response time</dt>
              <dd className="timing-list__strong">{formatDuration(entry.duration)}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{formatDateTime(entry.timestamp)}</dd>
            </div>
            <div>
              <dt>Status class</dt>
              <dd>
                {info.tone === 'success'
                  ? '2xx · Success'
                  : info.tone === 'warning'
                    ? '4xx · Client error'
                    : info.tone === 'danger'
                      ? '5xx · Server error'
                      : info.tone === 'redirect'
                        ? '3xx · Redirection'
                        : 'No response received'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="io-block">
        <h4 className="io-block__title">Body</h4>
        {hasBody ? (
          <JsonBlock value={entry.responseBody} />
        ) : (
          <p className="json-block__empty">No response body received.</p>
        )}
      </div>
    </section>
  );
};

export default ResponseViewer;
