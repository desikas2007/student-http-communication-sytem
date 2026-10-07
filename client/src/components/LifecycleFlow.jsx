import { Monitor, Send, Server, Route, Code, Database, Reply, ArrowDown } from 'lucide-react';
import { LIFECYCLE_STEPS } from '../utils/statusCode';

const ICONS = {
  Monitor,
  Send,
  Server,
  Route,
  Code,
  Database,
  Reply,
};

/**
 * Visualises one complete HTTP round trip:
 * Browser -> HTTP Request -> Express -> Route -> Controller -> MongoDB
 * -> HTTP Response -> Browser.
 */
const LifecycleFlow = ({ compact = false }) => (
  <div className={`lifecycle ${compact ? 'lifecycle--compact' : ''}`}>
    <ol className="lifecycle__list">
      {LIFECYCLE_STEPS.map((step, index) => {
        const Icon = ICONS[step.icon] || Monitor;
        const isClient = step.title === 'Browser';
        const isTransport = step.title.startsWith('HTTP');
        return (
          <li className="lifecycle__item" key={step.id}>
            <div
              className={[
                'lifecycle__node',
                isClient ? 'lifecycle__node--client' : '',
                isTransport ? 'lifecycle__node--transport' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="lifecycle__icon" aria-hidden="true">
                <Icon size={compact ? 15 : 18} />
              </span>
              <span className="lifecycle__text">
                <span className="lifecycle__title">{step.title}</span>
                {!compact ? <span className="lifecycle__subtitle">{step.subtitle}</span> : null}
              </span>
            </div>
            {index < LIFECYCLE_STEPS.length - 1 ? (
              <ArrowDown className="lifecycle__arrow" size={14} aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  </div>
);

export default LifecycleFlow;
