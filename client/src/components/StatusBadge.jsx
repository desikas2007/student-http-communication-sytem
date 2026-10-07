import { getStatusInfo, getMethodInfo, STATUS_MESSAGES } from '../utils/statusCode';

/**
 * Colour coded badge for HTTP methods and status codes.
 *   <StatusBadge method="GET" />            -> blue GET chip
 *   <StatusBadge code={200} />              -> green 200 OK chip
 *   <StatusBadge code={401} compact />      -> orange 401 chip
 */
const StatusBadge = ({ code, method, compact = false, label }) => {
  if (method) {
    const info = getMethodInfo(method);
    return (
      <span className={`badge badge--${info.tone} badge--method`} title={info.description}>
        {info.method}
      </span>
    );
  }

  const info = getStatusInfo(code);
  const text = label || (compact ? String(code) : `${code} ${info.label}`);

  return (
    <span className={`badge badge--${info.tone}`} title={info.message}>
      {text}
    </span>
  );
};

/** Status message for a code, e.g. "OK", "Created". */
export const statusLabel = (code) => STATUS_MESSAGES[code] || '';

export default StatusBadge;
