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
