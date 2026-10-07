/** HTTP status code and method metadata used across the monitor UI. */

export const STATUS_MESSAGES = {
  100: 'Continue',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/** Short explanations used by the HTTP analysis cards. */
export const STATUS_DESCRIPTIONS = {
  200: 'Request successfully processed.',
  201: 'New resource successfully created.',
  204: 'Request succeeded, no content returned.',
  301: 'Resource permanently moved to a new URL.',
  304: 'Resource not modified since the last request.',
  400: 'Server cannot process invalid request data.',
  401: 'Authentication failed or the token is missing.',
  403: 'Authenticated, but not allowed to access this resource.',
  404: 'Requested resource does not exist.',
  405: 'The HTTP method is not allowed for this route.',
  409: 'The request conflicts with an existing record.',
  413: 'The request body is larger than the server allows.',
  422: 'Request syntax is valid but the data is not.',
  429: 'Too many requests - slow down and retry later.',
  500: 'Unexpected server-side error.',
  502: 'The server received an invalid response upstream.',
  503: 'The service is temporarily unavailable.',
  504: 'The server timed out waiting for an upstream response.',
};

/** Colour tone for a status code. 2xx green, 4xx orange, 5xx red. */
export const statusTone = (code) => {
  const value = Number(code) || 0;
  if (value >= 200 && value < 300) return 'success';
  if (value >= 300 && value < 400) return 'redirect';
  if (value >= 400 && value < 500) return 'warning';
  if (value >= 500) return 'danger';
  return 'neutral';
};

export const getStatusInfo = (code) => {
  const value = Number(code) || 0;
  return {
    code: value,
    label: STATUS_MESSAGES[value] || (value ? 'Unknown' : 'No response'),
    message: STATUS_MESSAGES[value] || (value ? 'Unrecognised status code' : 'Request failed before a response was received'),
    description: STATUS_DESCRIPTIONS[value] || (value ? 'Response returned by the server.' : 'No HTTP response was received.'),
    tone: statusTone(value),
    category: statusTone(value),
  };
};

export const METHOD_TONES = {
  GET: 'info',
  POST: 'accent',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
  HEAD: 'neutral',
  OPTIONS: 'neutral',
};

export const getMethodInfo = (method = 'GET') => {
  const key = String(method).toUpperCase();
  return {
    method: key,
    tone: METHOD_TONES[key] || 'neutral',
    description:
      key === 'GET'
        ? 'Used to retrieve information from the college server.'
        : key === 'POST'
          ? 'Used to send information to the college server.'
          : key === 'PUT' || key === 'PATCH'
            ? 'Used to update existing information on the server.'
            : 'Used to remove a resource from the server.',
  };
};

/** Educational content shown on the HTTP Monitor analysis section. */
export const HTTP_CONCEPTS = [
  { id: 'get', kind: 'method', title: 'GET', text: 'Used to retrieve information from the college server.' },
  { id: 'post', kind: 'method', title: 'POST', text: 'Used to send information to the college server.' },
  { id: '200', kind: 'status', code: 200, title: '200 OK', text: 'Request successfully processed.' },
  { id: '201', kind: 'status', code: 201, title: '201 Created', text: 'New resource successfully created.' },
  { id: '400', kind: 'status', code: 400, title: '400 Bad Request', text: 'Server cannot process invalid request data.' },
  { id: '401', kind: 'status', code: 401, title: '401 Unauthorized', text: 'Authentication failed.' },
  { id: '404', kind: 'status', code: 404, title: '404 Not Found', text: 'Requested resource does not exist.' },
  { id: '500', kind: 'status', code: 500, title: '500 Internal Server Error', text: 'Unexpected server-side error.' },
];

/** Steps of the request lifecycle visualised on the dashboard. */
export const LIFECYCLE_STEPS = [
  { id: 1, title: 'Browser', subtitle: 'Student clicks / submits', icon: 'Monitor' },
  { id: 2, title: 'HTTP Request', subtitle: 'GET / POST + headers', icon: 'Send' },
  { id: 3, title: 'Express Server', subtitle: 'Middleware chain', icon: 'Server' },
  { id: 4, title: 'Route', subtitle: 'URL -> handler', icon: 'Route' },
  { id: 5, title: 'Controller', subtitle: 'Business logic', icon: 'Code' },
  { id: 6, title: 'MongoDB', subtitle: 'Read / write data', icon: 'Database' },
  { id: 7, title: 'HTTP Response', subtitle: 'Status + JSON body', icon: 'Reply' },
  { id: 8, title: 'Browser', subtitle: 'React renders the result', icon: 'Monitor' },
];
