import { NextRequest } from 'next/server';
import { expect, test, vi } from 'vitest';

import { proxy } from './proxy';

test('article documents rewrite once without loading the upstream in proxy', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const id = 'a'.repeat(64);
  for (const method of ['GET', 'HEAD']) {
    const request = new NextRequest(
      `https://hyunghyung.vercel.app/incidents/${id}?tracking=test`,
      { method },
    );
    const response = proxy(request);
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
    expect(proxy(request).headers.get('x-middleware-next')).toBe('1');
  }
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

test('internal document and Next data endpoints cannot be requested directly', () => {
  const id = 'a'.repeat(64);
  for (const path of [
    `/article-document/${id}`,
    `/_next/data/build/article-document/${id}.json`,
  ]) {
    const response = proxy(
      new NextRequest(`https://hyunghyung.vercel.app${path}`),
    );
    expect(response.status).toBe(404);
  }
});

test('article document rewrite preserves the original server origin without trusting Host', () => {
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
      proxy(request).headers.get('x-middleware-rewrite')!,
    );
    expect(destination.origin).toBe('http://127.0.0.1:3456');
    expect(destination.pathname).toBe('/article-document/' + id);
    expect(destination.search).toBe('?q=a%2Bb');
  } finally {
    vi.unstubAllEnvs();
  }
});
