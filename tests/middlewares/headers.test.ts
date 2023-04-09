import { test, expect } from 'vitest';
import useReflare from '../../src';

interface HTTPBinGetResponse {
  headers: Record<string, string>;
  origin: string;
}

const request = new Request(
  'https://localhost/get',
  {
    headers: new Headers({
      host: 'github.com',
      'cf-connecting-ip': '1.1.1.1',
      'user-agent': 'Mozilla/5.0',
    }),
    method: 'GET',
  },
);

test('headers.ts -> X-Forwarded headers', async () => {
  const reflare = await useReflare();

  reflare.push({
    path: '/*',
    upstream: { domain: 'httpbin.org' },
  });

  const response = await reflare.handle(request);
  const requestInfo = await response.json() as HTTPBinGetResponse;
  expect(requestInfo.headers['X-Forwarded-Host']).toMatch('github.com');
  expect(requestInfo.origin).toMatch(/(1.1.1.1)/i);
});

test('headers.ts -> request header', async () => {
  const reflare = await useReflare();

  reflare.push({
    path: '/*',
    upstream: { domain: 'httpbin.org' },
    headers: {
      request: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=100',
      },
      response: {
        'x-response-header': 'Hello from reflare',
      },
    },
  });

  const response = await reflare.handle(request);
  const requestInfo = await response.json() as HTTPBinGetResponse;
  expect(requestInfo.headers['Accept-Encoding']).toMatch('gzip, deflate, br');
  expect(requestInfo.headers.Accept)
    .toMatch('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  expect(requestInfo.headers['Cache-Control']).toMatch('max-age=100');
});

test('headers.ts -> response header', async () => {
  const reflare = await useReflare();
  reflare.push({
    path: '/*',
    upstream: { domain: 'httpbin.org' },
    headers: {
      request: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=100',
      },
      response: {
        'x-response-header': 'Hello from reflare',
        Connection: 'keep-alive',
        'Content-Type': 'application/json',
      },
    },
  });

  const response = await reflare.handle(request);
  expect(response.status).toBe(200);
  expect(response.headers.get('x-response-header')).toMatch('Hello from reflare');
  expect(response.headers.get('connection')).toMatch('keep-alive');
  expect(response.headers.get('content-type')).toMatch('application/json');
});

test('headers.ts -> delete request header', async () => {
  const reflare = await useReflare();

  reflare.push({
    path: '/*',
    upstream: { domain: 'httpbin.org' },
    headers: {
      request: {
        'X-Forwarded-Proto': '',
        'X-Forwarded-For': '',
        'X-Forwarded-Host': '',
        'User-Agent': '',
        'Header-Not-Exist': '',
      },
    },
  });

  const response = await reflare.handle(request);
  const requestInfo = await response.json() as HTTPBinGetResponse;
  expect(requestInfo.headers['X-Forwarded-For']).toBeUndefined();
  expect(requestInfo.headers['X-Forwarded-Host']).toBeUndefined();
  expect(requestInfo.headers['X-Forwarded-Proto']).toBeUndefined();
  expect(requestInfo.headers['User-Agent']).toBeUndefined();
  expect(requestInfo.headers['Header-Not-Exist']).toBeUndefined();
});

test('headers.ts -> delete response header', async () => {
  const reflare = await useReflare();

  reflare.push({
    path: '/*',
    upstream: { domain: 'httpbin.org' },
    headers: {
      response: {
        Server: '',
        'Content-Type': '',
        'Header-Not-Exist': '',
      },
    },
  });

  const response = await reflare.handle(request);
  expect(response.headers.has('Server')).toBeFalsy();
  expect(response.headers.has('Content-Type')).toBeFalsy();
  expect(response.headers.has('Header-Not-Exist')).toBeFalsy();
});
