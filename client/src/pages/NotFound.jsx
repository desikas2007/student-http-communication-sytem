import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

/** 404 page - also reachable directly to demonstrate GET /api/invalid -> 404. */
const NotFound = () => (
  <div className="not-found">
    <div className="not-found__panel">
      <span className="not-found__code">404</span>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__text">
        The route you requested does not exist in this application - exactly like a request to a
        non-existent API endpoint, which the Express server answers with{' '}
        <code>404 Not Found</code>.
      </p>
      <div className="not-found__actions">
        <Link className="btn btn--primary" to="/">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <Link className="btn btn--secondary" to="/api-test-center">
          <Compass size={16} /> Try GET /api/invalid
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
