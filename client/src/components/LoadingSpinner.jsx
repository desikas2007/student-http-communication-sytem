/** Accessible loading indicator used by every async view. */
const LoadingSpinner = ({ label = 'Loading', size = 'md', fullPage = false }) => (
  <div className={fullPage ? 'spinner-page' : 'spinner-inline'} role="status" aria-live="polite">
    <span className={`spinner spinner--${size}`} aria-hidden="true" />
    <span className="spinner__label">{label}...</span>
  </div>
);

/** Skeleton rows used while tables and lists are loading. */
export const SkeletonRows = ({ rows = 4, height = 44 }) => (
  <div className="skeleton-list" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="skeleton-row"
        style={{ height }}
        // eslint-disable-next-line react/no-array-index-key
      />
    ))}
  </div>
);

export default LoadingSpinner;
