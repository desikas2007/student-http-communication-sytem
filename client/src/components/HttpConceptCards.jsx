import { HTTP_CONCEPTS, getMethodInfo, getStatusInfo } from '../utils/statusCode';

/**
 * Educational cards explaining HTTP methods and status codes.
 */
const HttpConceptCards = () => (
  <div className="concept-grid">
    {HTTP_CONCEPTS.map((concept) => {
      const isMethod = concept.kind === 'method';
      const info = isMethod ? getMethodInfo(concept.title) : getStatusInfo(concept.code);
      return (
        <article className={`concept-card concept-card--${isMethod ? info.tone : info.tone}`} key={concept.id}>
          <header className="concept-card__head">
            <span className={`badge badge--${isMethod ? info.tone : info.tone} badge--method`}>
              {concept.title}
            </span>
            <span className="concept-card__kind">{isMethod ? 'HTTP Method' : 'Status Code'}</span>
          </header>
          <p className="concept-card__text">{concept.text}</p>
        </article>
      );
    })}
  </div>
);

export default HttpConceptCards;
