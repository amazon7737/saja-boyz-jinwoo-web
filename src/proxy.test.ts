import { NextRequest } from 'next/server';
import { expect, test, vi } from 'vitest';

import { proxy } from './proxy';

test('article documents rewrite once without loading the upstream in proxy', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const id = 'a'.repeat(64);
  for (const method of ['GET', 'HEAD']) {
    const request = new NextRequest(
      `https://hyunghyung.vercel.app/incidents/${id}?tracking=test`,
      { method },
    );
    const response = await proxy(request);
    const destination = new URL(response.headers.get('x-middleware-rewrite')!);
    expect(destination.pathname).toBe(`/article-document/${id}`);
    expect(destination.search).toBe('?tracking=test');
  }
  for (const request of [
    new NextRequest(`https://hyunghyung.vercel.app/incidents/${id}`, {
      headers: { RSC: '1' },
    }),
    new NextRequest(`https://hyunghyung.vercel.app/incidents/${id}`, {
      method: 'POST',
    }),
  ]) {
    expect((await proxy(request)).headers.get('x-middleware-next')).toBe('1');
  }
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

test('internal document and Next data endpoints cannot be requested directly', async () => {
  const id = 'a'.repeat(64);
  for (const path of [
    `/article-document/${id}`,
    `/_next/data/build/article-document/${id}.json`,
  ]) {
    const response = await proxy(
      new NextRequest(`https://hyunghyung.vercel.app${path}`),
    );
    expect(response.status).toBe(404);
  }
});

test('article document rewrite preserves the original server origin without trusting Host', async () => {
  vi.stubEnv('__NEXT_NO_MIDDLEWARE_URL_NORMALIZE', '1');
  try {
    const id = 'a'.repeat(64);
    const request = new NextRequest(
      'http://127.0.0.1:3456/incidents/' + id + '?q=a%2Bb',
      {
        headers: {
          host: 'attacker.invalid',
          'x-forwarded-host': 'attacker.invalid',
        },
      },
    );
    const destination = new URL(
      (await proxy(request)).headers.get('x-middleware-rewrite')!,
    );
    expect(destination.origin).toBe('http://127.0.0.1:3456');
    expect(destination.pathname).toBe('/article-document/' + id);
    expect(destination.search).toBe('?q=a%2Bb');
  } finally {
    vi.unstubAllEnvs();
  }
});

test('archive preflight skips invalid pages and RSC transitions', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  try {
    for (const path of [
      '/archive?page=0',
      '/archive?page=x',
      '/archive?page=99999999999999999',
    ]) {
      const result = await proxy(
        new NextRequest(`https://example.test${path}`),
      );
      expect(result.headers.get('x-middleware-next')).toBe('1');
    }
    const result = await proxy(
      new NextRequest('https://example.test/archive', {
        headers: { RSC: '1' },
      }),
    );
    expect(result.headers.get('x-middleware-next')).toBe('1');
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    fetchSpy.mockRestore();
  }
});

test('archive preflight accepts a healthy upstream response slower than two seconds', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.test');
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_url, options) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => resolve(Response.json({ total: 0, items: [] })),
          2200,
        );
        options?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(options.signal?.reason);
        });
      }),
  );

  try {
    for (const method of ['GET', 'HEAD']) {
      const result = await proxy(
        new NextRequest('https://example.test/archive', { method }),
      );
      expect(result.headers.get('x-middleware-next')).toBe('1');
    }
  } finally {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  }
}, 7000);

test('archive preflight uses one small request and falls back on timeout', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.test');
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        const signal = options?.signal;
        signal?.addEventListener('abort', () => reject(signal.reason));
      }),
  );

  try {
    const started = Date.now();
    const result = await proxy(
      new NextRequest('https://example.test/archive?page=2'),
    );
    const destination = new URL(result.headers.get('x-middleware-rewrite')!);
    expect(destination.pathname).toBe('/archive-document');
    expect(destination.search).toBe('?page=2');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const target = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(target.pathname).toBe('/news');
    expect(target.searchParams.get('offset')).toBe('20');
    expect(target.searchParams.get('limit')).toBe('1');
    expect(Date.now() - started).toBeLessThan(6500);
  } finally {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  }
}, 8000);
