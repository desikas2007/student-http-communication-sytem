import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Consistent error state with an optional retry action.
 * Shows the HTTP status code and error code returned by the server.
 */
const ErrorMessage = ({
  title = 'Something went wrong',
  message,
  status,
  errorCode,
  onRetry,
  retryLabel = 'Retry',
}) => (
  <div className="state-panel state-panel--error" role="alert">
    <span className="state-panel__icon state-panel__icon--error">
      <AlertTriangle size={22} />
    </span>
    <div className="state-panel__content">
      <h3 className="state-panel__title">{title}</h3>
      <p className="state-panel__message">{message}</p>
      {status ? (
        <p className="state-panel__meta">
          HTTP {status}
          {errorCode ? ` · ${errorCode}` : ''}
        </p>
      ) : errorCode ? (
        <p className="state-panel__meta">{errorCode}</p>
      ) : null}
    </div>
    {onRetry ? (
      <button type="button" className="btn btn--secondary" onClick={onRetry}>
        <RefreshCw size={15} />
        {retryLabel}
      </button>
    ) : null}
  </div>
);

/** Empty state used when a request succeeded but returned no records. */
export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="state-panel state-panel--empty">
    {Icon ? (
      <span className="state-panel__icon">
        <Icon size={22} />
      </span>
    ) : null}
    <div className="state-panel__content">
      <h3 className="state-panel__title">{title}</h3>
      <p className="state-panel__message">{message}</p>
    </div>
    {action}
  </div>
);

export default ErrorMessage;
