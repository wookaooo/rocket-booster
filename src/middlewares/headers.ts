import { Middleware } from '../../types/middleware';

export const setForwardedHeaders = (
  headers: Headers,
): void => {
  headers.set('X-Forwarded-Proto', 'https');

  const host = headers.get('Host');
  if (host !== null) {
    headers.set('X-Forwarded-Host', host);
  }

  const ip = headers.get('cf-connecting-ip');
  const forwardedForHeader = headers.get('X-Forwarded-For');
  if (ip !== null && forwardedForHeader === null) {
    headers.set('X-Forwarded-For', ip);
  }
};

/**
 * The `useHeaders` middleware modifies the headers of the request and response.
 * - The middleware adds `X-Forwarded-Proto`, `X-Forwarded-For`, and
 * `X-Forwarded-Host` headers to indicate that the client is connecting to the
 * upstream through a reverse proxy.
 * - The middleware adds customized headers to the request and response.
 * @param context - The context of the middleware pipeline
 * @param next - The function to invoke the next middleware in the pipeline
 */
export const useHeaders: Middleware = async (
  context,
  next,
) => {
  const { request, route } = context;
  setForwardedHeaders(request.headers);

  if (route.headers === undefined) {
    await next();
    return;
  }

  if (route.headers.request !== undefined) {
    for (const [key, value] of Object.entries(route.headers.request)) {
      if (value.length === 0) {
        request.headers.delete(key);
      } else {
        request.headers.set(key, value);
      }
    }
  }

  await next();

  const { response } = context;
  if (route.headers.response !== undefined) {
    for (const [key, value] of Object.entries(route.headers.response)) {
      if (value.length === 0) {
        response.headers.delete(key);
      } else {
        response.headers.set(key, value);
      }
    }
  }
};
