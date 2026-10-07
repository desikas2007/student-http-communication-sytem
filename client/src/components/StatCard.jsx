/**
 * Dashboard statistic card.
 * @param {{icon: React.ComponentType, label: string, value: string|number, hint?: string, tone?: string}} props
 */
const StatCard = ({ icon: Icon, label, value, hint, tone = 'primary' }) => (
  <article className={`stat-card stat-card--${tone}`}>
    <div className="stat-card__head">
      <span className="stat-card__icon" aria-hidden="true">
        {Icon ? <Icon size={18} /> : null}
      </span>
      <span className="stat-card__label">{label}</span>
    </div>
    <p className="stat-card__value">{value}</p>
    {hint ? <p className="stat-card__hint">{hint}</p> : null}
  </article>
);

export default StatCard;
