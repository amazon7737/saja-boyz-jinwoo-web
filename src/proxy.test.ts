import { NextRequest } from 'next/server';
import { afterEach, expect, test, vi } from 'vitest';

import { proxy } from './proxy';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('articleDocument404KeepsItsAddressAndDoesNotMisclassifyApiErrors', async () => {
  const id = 'a'.repeat(64);
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', request);
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const document = (articleId = id, headers?: HeadersInit) =>
    new NextRequest(
      'https://hyunghyung.vercel.app/incidents/' + articleId + '?tracking=test',
      { headers },
    );

  request.mockResolvedValueOnce(new Response('missing', { status: 404 }));
  const missing = await proxy(document());
  expect(missing.status).toBe(404);
  const fallback = new URL(missing.headers.get('x-middleware-rewrite')!);
  expect(fallback.origin).toBe('https://hyunghyung.vercel.app');
  expect(fallback.pathname).toBe('/__missing-article');
  expect(fallback.search).toBe('');

  expect(missing.headers.get('cache-control')).toContain('no-store');
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(String(url)).toBe('https://news.example.invalid/news/' + id);
  expect(options).toMatchObject({ method: 'GET', cache: 'no-store' });
  expect(options?.signal).toBeInstanceOf(AbortSignal);

  request.mockReset();
  const invalid = await proxy(document('invalid'));
  expect(invalid.status).toBe(404);
  expect(request).not.toHaveBeenCalled();

  request.mockResolvedValueOnce(
    new Response('PRIVATE_UPSTREAM', { status: 200 }),
  );
  const success = await proxy(document());
  expect(success.headers.get('x-middleware-next')).toBe('1');
  expect(success.headers.get('x-middleware-rewrite')).toBeNull();

  const expectUnavailable = (result: Awaited<ReturnType<typeof proxy>>) => {
    const fallback = new URL(result.headers.get('x-middleware-rewrite')!);

    expect(fallback.origin).toBe('https://hyunghyung.vercel.app');
    expect(fallback.pathname).toBe('/article-unavailable/' + id);
    expect(fallback.search).toBe('');
  };

  for (const status of [429, 500, 503]) {
    request.mockResolvedValueOnce(new Response('PRIVATE_UPSTREAM', { status }));
    expectUnavailable(await proxy(document()));
  }
  request.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
  expectUnavailable(await proxy(document()));
  request.mockRejectedValueOnce(new TypeError('PRIVATE_NETWORK_ERROR'));
  expectUnavailable(await proxy(document()));

  request.mockReset();
  expect(
    (await proxy(document(id, { RSC: '1' }))).headers.get('x-middleware-next'),
  ).toBe('1');
  expect(request).not.toHaveBeenCalled();
  request.mockResolvedValueOnce(new Response(null, { status: 404 }));
  const head = await proxy(
    new NextRequest('https://hyunghyung.vercel.app/incidents/' + id, {
      method: 'HEAD',
    }),
  );
  expect(head.status).toBe(404);
  expect(request).toHaveBeenCalledTimes(1);
  request.mockReset();
  const post = await proxy(
    new NextRequest('https://hyunghyung.vercel.app/incidents/' + id, {
      method: 'POST',
    }),
  );
  expect(post.headers.get('x-middleware-next')).toBe('1');
  expect(request).not.toHaveBeenCalled();
  for (const base of [
    '',
    'javascript:unsafe',
    'https://user:password@news.example.invalid',
  ]) {
    vi.stubEnv('NEWS_API_BASE_URL', base);
    expectUnavailable(await proxy(document()));
  }
  expect(request).not.toHaveBeenCalled();
});
