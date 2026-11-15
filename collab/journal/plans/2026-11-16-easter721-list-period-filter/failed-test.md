# 목록 기간 필터 시나리오

## 기간 API
```ts
// file: src/features/article-list/api/list-period.test.ts
import { afterEach, expect, test, vi } from 'vitest';

import { fetchArticleList } from './fetch-articles';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
```
- [x] listRequestIncludesSelectedPeriod — 기간 적용 응답의 요청에 선택한 기간과 기존 인기순 및 offset을 전달한다.
```ts
test('listRequestIncludesSelectedPeriod', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn()
    .mockResolvedValue(
      Response.json(
        { total: 0, items: [] },
        { headers: { 'X-News-Period': '7d' } },
      ),
    );
  vi.stubGlobal('fetch', request);

  const result = await Reflect.apply(fetchArticleList, undefined, [
    undefined,
    20,
    'popular',
    undefined,
    '7d',
  ]);

  expect(result).not.toBeNull();
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.searchParams.get('period')).toBe('7d');
  expect(url.searchParams.get('sort')).toBe('popular');
  expect(url.searchParams.get('offset')).toBe('20');
});
```




## 화면과 복귀
```ts
// file: src/app/incidents/article-list-period-integration.test.ts
// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vitest';

import IncidentsPage from '@/app/(browse)/@background/incidents/page';
import { ArticleRouteHost } from '@/features/article-detail/ui/article-route-host/article-route-host';
import { DetailInline } from '@/features/article-detail/ui/detail-sheet/detail-inline';

let pathname = '/incidents';
let articleSegments: string[] = [];
const push = vi.fn((href: string) => window.history.pushState({}, '', href));
const back = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push, back, refresh: vi.fn() }),
  useSelectedLayoutSegments: (slot?: string) =>
    slot === 'background' ? ['incidents'] : articleSegments,
}));
vi.mock('next/link', () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({
    href,
    children,
    scroll: _scroll,
    ...props
  }: {
    href: string;
    children: ReactNode;
    scroll?: boolean;
  }) => {
    void _scroll;
    return createElement('a', { href, ...props }, children);
  },
}));
vi.mock('next/compat/router', () => ({ useRouter: () => null }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
```
- [x] listPeriodSelectionPaginationUnavailableAndDetailReturn — 기간 선택, 이전 요청 격리, 추가 페이지, 상세 복귀, 미지원 서버 오류 및 빈 결과를 검증한다.
```ts
test('listPeriodSelectionPaginationUnavailableAndDetailReturn', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('scrollTo', vi.fn());
  pathname = '/incidents';
  articleSegments = [];
  window.history.replaceState({}, '', '/incidents');
  push.mockClear();
  back.mockClear();
  const observers: {
    callback: IntersectionObserverCallback;
    target: Element | null;
    disconnected: boolean;
  }[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      entry = {
        callback: (() => {}) as IntersectionObserverCallback,
        target: null as Element | null,
        disconnected: false,
      };
      constructor(callback: IntersectionObserverCallback) {
        this.entry.callback = callback;
        observers.push(this.entry);
      }
      observe(target: Element) {
        this.entry.target = target;
        this.entry.disconnected = false;
      }
      unobserve() {
        this.entry.target = null;
      }
      disconnect() {
        this.entry.disconnected = true;
      }
    },
  );
  const item = (index: number) => ({
    article_id: index.toString(16).padStart(64, '0'),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: `기간 기사 ${index}`,
      description: `요약 ${index}`,
      pubDate: '2026-11-15T00:00:00Z',
      originallink: `https://publisher.example.invalid/${index}`,
      link: '',
    },
  });
  let unsupported = false;
  let wrongHeader = false;
  let noPeriodResults = false;
  let finishOld: ((response: Response) => void) | undefined;
  const requests: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requests.push(url);
      const period = url.searchParams.get('period');
      const offset = Number(url.searchParams.get('offset'));
      if (!period && offset === 20) {
        return new Promise<Response>((resolve) => {
          finishOld = resolve;
        });
      }
      const items =
        period && noPeriodResults
          ? []
          : offset
            ? [item(20)]
            : Array.from({ length: 20 }, (_, i) => item(i));
      return Response.json(
        { total: period && noPeriodResults ? 0 : 21, items },
        {
          headers:
            period && !unsupported
              ? { 'X-News-Period': wrongHeader ? '30d' : period }
              : {},
        },
      );
    }),
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  async function renderPage() {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );
    const page = await Reflect.apply(IncidentsPage, undefined, [
      { searchParams: Promise.resolve(params) },
    ]);
    await act(async () =>
      root.render(
        createElement(
          ArticleRouteHost,
          { background: page },
          createElement(
            DetailInline,
            { titleId: 'detail-heading' },
            createElement('h2', { id: 'detail-heading' }, '상세 기사'),
          ),
        ),
      ),
    );
  }
  function button(label: string) {
    const found = Array.from(host.querySelectorAll('button')).find(
      (node) =>
        (node.getAttribute('aria-label') ?? node.textContent?.trim()) === label,
    );
    assert(found, `${label} 버튼이 있어야 합니다`);
    return found;
  }
  async function click(label: string) {
    await act(async () => button(label).click());
  }
  async function loadTail() {
    await act(async () => {
      for (const observer of [...observers]) {
        if (observer.disconnected || !observer.target) continue;
        observer.callback(
          [
            {
              target: observer.target,
              isIntersecting: true,
              intersectionRatio: 1,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      }
    });
  }
  try {
    await renderPage();
    await loadTail();
    assert(finishOld, '이전 기간의 추가 요청이 대기해야 합니다');
    await click('기간');
    await click('최근 7일');
    expect(new URL(window.location.href).searchParams.get('period')).toBe('7d');
    await renderPage();
    expect(requests.at(-1)?.searchParams.get('period')).toBe('7d');
    expect(requests.at(-1)?.searchParams.get('offset')).toBe('0');
    await act(async () => {
      finishOld?.(Response.json({ total: 21, items: [item(999)] }));
    });
    expect(host.textContent).not.toContain('기간 기사 999');
    await loadTail();
    expect(requests.at(-1)?.searchParams.get('period')).toBe('7d');
    expect(requests.at(-1)?.searchParams.get('offset')).toBe('20');
    expect(host.textContent).toContain('기간 기사 20');
    const articleLink = host.querySelector<HTMLAnchorElement>('article h2 a');
    assert(articleLink);
    articleLink.focus();
    articleLink.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    await act(async () =>
      articleLink.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      ),
    );
    pathname = articleLink.getAttribute('href')!;
    articleSegments = ['(.)incidents'];
    await renderPage();
    const detailBack = host.querySelector<HTMLAnchorElement>(
      'a[aria-label="목록으로"]',
    );
    assert(detailBack);
    expect(detailBack.getAttribute('href')).toBe('/incidents?period=7d');
    await act(async () => detailBack.click());
    expect(back).toHaveBeenCalledTimes(1);
    pathname = '/incidents';
    articleSegments = [];
    window.history.replaceState({}, '', '/incidents?period=7d');
    await renderPage();
    expect(document.activeElement).toBe(articleLink);
    unsupported = true;
    await renderPage();
    const error = host.querySelector('[role="alert"]');
    assert(
      error,
      '서버가 기간 적용을 확인하지 않으면 결과 대신 오류가 표시되어야 합니다',
    );
    expect(error.textContent).toContain('다시 시도');
    expect(error.querySelector('a')?.getAttribute('href')).toBe(
      '/incidents?period=7d',
    );
    expect(host.querySelector('article')).toBeNull();
    unsupported = false;
    wrongHeader = true;
    await renderPage();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.querySelector('article')).toBeNull();
    wrongHeader = false;
    noPeriodResults = true;
    await renderPage();
    expect(host.textContent).toMatch(/선택한 기간.*기사/);
    expect(host.textContent).not.toContain('아직 수집된 기사가 없어요');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
}, 120_000);
```
