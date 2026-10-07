import { Braces } from 'lucide-react';

/** Renders a JSON-ish payload with light syntax colouring. */
export const JsonBlock = ({ value, emptyLabel = 'No body' }) => {
  if (value === null || value === undefined || value === '') {
    return <p className="json-block__empty">{emptyLabel}</p>;
  }

  const text =
    typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 2);

  return (
    <pre className="json-block" tabIndex={0}>
      <code>{text}</code>
    </pre>
  );
};

/** Key/value table used for headers and query parameters. */
export const KeyValueTable = ({ data, emptyLabel = 'None' }) => {
  const entries = Object.entries(data || {});
  if (!entries.length) return <p className="kv-empty">{emptyLabel}</p>;

  return (
    <table className="kv-table">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <td className="kv-table__key">{key}</td>
            <td className="kv-table__value">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * REQUEST panel of the inspector: method, URL, headers, query, body.
 */
const RequestViewer = ({ entry }) => {
  const [path, query = ''] = String(entry.endpoint || '').split('?');
  const queryPairs = query
    ? Object.fromEntries(new URLSearchParams(query).entries())
    : {};

  return (
    <section className="io-panel">
      <header className="io-panel__header io-panel__header--request">
        <span className="io-panel__title">Request</span>
        <span className="io-panel__line">
          <span className={`badge badge--${entry.method === 'POST' ? 'accent' : 'info'}`}>
            {entry.method}
          </span>
          <code className="io-panel__url">{path}</code>
        </span>
      </header>

      <div className="io-panel__grid">
        <div className="io-block">
          <h4 className="io-block__title">Headers</h4>
          <KeyValueTable data={entry.requestHeaders} />
        </div>

        <div className="io-block">
          <h4 className="io-block__title">
            Query parameters <Braces size={13} />
          </h4>
          <KeyValueTable data={queryPairs} emptyLabel="No query parameters" />
        </div>
      </div>

      <div className="io-block">
        <h4 className="io-block__title">Body</h4>
        <JsonBlock value={entry.requestBody} emptyLabel="No request body (typical for GET)" />
      </div>
    </section>
  );
};

export default RequestViewer;
