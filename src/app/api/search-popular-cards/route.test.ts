import { afterEach, expect, test, vi } from 'vitest';
import { GET } from './route';

const id = 'a'.repeat(64);
const id2 = 'b'.repeat(64);
const makeRequest = (...ids: string[]) => {
  const params = new URLSearchParams();
  ids.forEach((value) => params.append('id', value));
  return new Request(
    'https://example.invalid/api/search-popular-cards?' + params,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('popularCardsProxyValidatesIdsAndReturnsSanitizedDetailsInOrder', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const value = new URL(String(input)).pathname.split('/').pop();
    if (value === id2) return new Response('', { status: 404 });
    return Response.json({
      article_id: value,
      image_status: 'ready',
      image_url: `/images/${value}.jpg`,
      privateField: 'secret',
      article: {
        title: '화재 소식',
        description: '기사 요약',
        pubDate: '2026-10-01',
        originallink: 'https://example.org',
        link: '',
        secret: 'secret',
      },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const response = await GET(makeRequest(id, id2));
  const json = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(json.items.map((item: { status: string }) => item.status)).toEqual([
    'success',
    'not-found',
  ]);
  expect(JSON.stringify(json)).not.toContain('secret');
  expect(json.items[0].item.article_id).toBe(id);
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const invalid of [[], [id, id], ['../secret'], [id, id2, id, id2]]) {
    expect((await GET(makeRequest(...invalid))).status).toBe(400);
  }
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('popularCardsPropagatesCallerCancellationToEveryDetailRequest', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const controller = new AbortController();
  const signals: AbortSignal[] = [];
  const fetcher = vi.fn((_input: RequestInfo | URL, options: RequestInit) => {
    const signal = options.signal!;
    signals.push(signal);
    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), {
        once: true,
      });
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const params = new URLSearchParams();
  params.append('id', id);
  params.append('id', id2);
  const request = new Request(
    'https://example.invalid/api/search-popular-cards?' + params,
    { signal: controller.signal },
  );
  const pending = GET(request);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(signals).toHaveLength(2);
  expect(signals.every((signal) => !signal.aborted)).toBe(true);
  controller.abort();
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  const json = await (await pending).json();
  expect(json.items.map((item: { status: string }) => item.status)).toEqual([
    'error',
    'error',
  ]);
});

test('popularCardsRetainsTheFiveSecondDeadlineWhenCallerDoesNotCancel', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const deadline = new AbortController();
  const timeout = vi
    .spyOn(AbortSignal, 'timeout')
    .mockReturnValue(deadline.signal);
  const caller = new AbortController();
  const signals: AbortSignal[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((_input: RequestInfo | URL, options: RequestInit) => {
      const signal = options.signal!;
      signals.push(signal);
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
      });
    }),
  );
  try {
    const request = new Request(
      'https://example.invalid/api/search-popular-cards?id=' + id,
      { signal: caller.signal },
    );
    const pending = GET(request);
    expect(timeout).toHaveBeenCalledWith(5000);
    expect(signals).toHaveLength(1);
    deadline.abort();
    expect(signals[0].aborted).toBe(true);
    expect(caller.signal.aborted).toBe(false);
    const json = await (await pending).json();
    expect(json.items[0].status).toBe('error');
  } finally {
    timeout.mockRestore();
  }
});
