import { Middleware } from '../../types/middleware';

/**
 * The `useCORS` middleware modifies the HTTP headers related to CORS
 * (Cross-Origin Resource Sharing) on the response.
 * @param context - The context of the middleware pipeline
 * @param next - The function to invoke the next middleware in the pipeline
 */
export const useCORS: Middleware = async (
  context,
  next,
) => {
  await next();

  const { request, response, route } = context;

  const corsOptions = route.cors;
  if (corsOptions === undefined) {
    return;
  }

  const {
    origin,
    methods,
    exposedHeaders,
    allowedHeaders,
    credentials,
    maxAge,
  } = corsOptions;

  const requestOrigin = request.headers.get('origin');
  if (requestOrigin === null || origin === false) {
    return;
  }

  if (origin === true) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
  } else if (Array.isArray(origin)) {
    if (origin.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    }
  } else if (origin === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  if (Array.isArray(methods)) {
    response.headers.set('Access-Control-Allow-Methods', methods.join(','));
  } else if (methods === '*') {
    response.headers.set('Access-Control-Allow-Methods', '*');
  } else {
    const requestMethod = request.headers.get('Access-Control-Request-Method');
    if (requestMethod !== null) {
      response.headers.set('Access-Control-Allow-Methods', requestMethod);
    }
  }

  if (Array.isArray(exposedHeaders)) {
    response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(','));
  } else if (exposedHeaders === '*') {
    response.headers.set('Access-Control-Expose-Headers', '*');
  }

  if (Array.isArray(allowedHeaders)) {
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(','));
  } else if (allowedHeaders === '*') {
    response.headers.set('Access-Control-Allow-Headers', '*');
  } else {
    const requestHeaders = request.headers.get('Access-Control-Request-Headers');
    if (requestHeaders !== null) {
      response.headers.set('Access-Control-Allow-Headers', requestHeaders);
    }
  }

  if (credentials === true) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (maxAge !== undefined && Number.isInteger(maxAge)) {
    response.headers.set('Access-Control-Max-Age', maxAge.toString());
  }
};
