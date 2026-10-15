# 기사 키워드 검색 테스트 초안

기존 테스트 수정 없음. 신규 5개 테스트를 아래 순서로 추가한다. 헤더와 테스트 본문 전체가 승인 대상이다.

## 서버 요청

```ts
// file: src/features/article-list/api/search-request.test.ts
import { afterEach, expect, test, vi } from 'vitest';
import { fetchArticleList } from './fetch-articles';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
```

- [x] searchKeywordRequestPreservesListContract — 서버 요청 계약 검증

```ts
test('searchKeywordRequestPreservesListContract', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const mock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json({ total: 0, items: [] }));
  vi.stubGlobal('fetch', mock);
  const request: (keyword?: string) => ReturnType<typeof fetchArticleList> =
    fetchArticleList;
  await request('  서울 & 화재?#  ');
  const url = new URL(String(mock.mock.calls[0][0]));
  expect(url.pathname).toBe('/news');
  expect(url.searchParams.get('keyword')).toBe('서울 & 화재?#');
  expect(url.searchParams.get('offset')).toBe('0');
  expect(url.searchParams.get('limit')).toBe('20');
  await request();
  await request('   ');
  for (const call of mock.mock.calls.slice(1))
    expect(new URL(String(call[0])).search).toBe('?offset=0&limit=20');
});
```

## 검색 페이지

```ts
// file: src/app/search/search-page.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SearchPage from './page';
const loadingModules = import.meta.glob('./loading.tsx');
const mock = vi.fn<typeof fetch>();
const item = {
  article_id: 'a'.repeat(64),
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '테스트 기사 <b>화재</b>',
    description: '안전 &amp; 점검',
    pubDate: '2026-10-07T00:00:00Z',
    originallink: 'https://example.invalid/news',
    link: '',
  },
};
beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('fetch', mock);
});
afterEach(() => {
  mock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
async function renderSearch(q?: string | string[]) {
  const page: (props: {
    searchParams: Promise<{ q?: string | string[] }>;
  }) => ReactNode | Promise<ReactNode> = SearchPage;
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(
    await page({ searchParams: Promise.resolve({ q }) }),
  );
  return root;
}
```

- [x] searchInitialStateUsesRealGetFormWithoutFetching — 검색 페이지 계약 검증

```ts
test('searchInitialStateUsesRealGetFormWithoutFetching', async () => {
  for (const q of [undefined, '   ']) {
    const root = await renderSearch(q);
    const form = root.querySelector('form');
    assert(form);
    expect(form.getAttribute('action')).toBe('/search');
    expect((form.getAttribute('method') ?? 'get').toLowerCase()).toBe('get');
    const input = form.querySelector('input[name="q"]');
    assert(input instanceof HTMLInputElement);
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-label')).toBe('기사 키워드 검색');
    expect(form.querySelector('button[type="submit"]')).not.toBeNull();
    expect(root.querySelector('a[href="/"]')).not.toBeNull();
    expect(
      Array.from(root.querySelectorAll('a')).some(
        (a) =>
          new URL(
            a.getAttribute('href') ?? '',
            'https://app.example.invalid',
          ).searchParams.get('q') === '대형화재',
      ),
    ).toBe(true);
    expect(root.textContent).not.toContain('검색 결과가 없어요');
    expect(root.textContent).not.toContain('서울 소방서');
  }
  expect(mock).not.toHaveBeenCalled();
});
```

- [x] searchUrlRendersApiResultsAndKeepsInputInSync — 검색 페이지 계약 검증

```ts
test('searchUrlRendersApiResultsAndKeepsInputInSync', async () => {
  mock.mockResolvedValueOnce(Response.json({ total: 80, items: [item, item] }));
  const root = await renderSearch(['  서울 & 화재  ', '무시할 값']);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(
    new URL(String(mock.mock.calls[0][0])).searchParams.get('keyword'),
  ).toBe('서울 & 화재');
  const input = root.querySelector('input[name="q"]');
  assert(input instanceof HTMLInputElement);
  expect(input.value).toBe('서울 & 화재');
  expect(root.querySelectorAll('article')).toHaveLength(1);
  expect(root.textContent).toContain('테스트 기사 화재');
  expect(root.textContent).toContain('안전 & 점검');
  expect(root.textContent).not.toContain('80건');
  const reset = Array.from(root.querySelectorAll('a')).find(
    (a) => a.getAttribute('aria-label') === '검색어 초기화',
  );
  expect(reset?.getAttribute('href')).toBe('/search');
  const clean = await renderSearch();
  expect(clean.querySelectorAll('article')).toHaveLength(0);
  expect(mock).toHaveBeenCalledTimes(1);
});
```

- [x] searchDistinguishesEmptyFailureAndLoading — 검색 페이지 계약 검증

```ts
test('searchDistinguishesEmptyFailureAndLoading', async () => {
  mock.mockResolvedValueOnce(Response.json({ total: 0, items: [] }));
  const empty = await renderSearch('화재');
  const status = empty.querySelector('[role="status"]');
  assert(status);
  expect(status.textContent).toContain('검색 결과가 없어요');
  expect(empty.querySelector('[role="alert"]')).toBeNull();
  mock.mockRejectedValueOnce(new Error('PRIVATE_SERVER_DETAIL'));
  const failed = await renderSearch('서울 & 화재');
  const alert = failed.querySelector('[role="alert"]');
  assert(alert);
  expect(alert.textContent).toContain('검색 결과를 불러오지 못했어요');
  expect(failed.textContent).not.toContain('PRIVATE_SERVER_DETAIL');
  const retry = Array.from(alert.querySelectorAll('a')).find((a) =>
    a.textContent?.includes('다시 시도'),
  );
  assert(retry);
  const url = new URL(
    retry.getAttribute('href') ?? '',
    'https://app.example.invalid',
  );
  expect(url.pathname).toBe('/search');
  expect(url.searchParams.get('q')).toBe('서울 & 화재');
  const load = loadingModules['./loading.tsx'];
  assert(load);
  const loadingModule = (await load()) as { default: ComponentType };
  const loading = document.createElement('div');
  loading.innerHTML = renderToStaticMarkup(
    createElement(loadingModule.default),
  );
  expect(
    loading.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
});
```

## 경로별 헤더

```ts
// file: src/components/layout/app-shell/search-layout.test.ts
// @vitest-environment jsdom
import { afterEach, assert, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app-shell';
let pathname = '/search';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
afterEach(() => {
  pathname = '/search';
  vi.unstubAllGlobals();
});
```

- [x] searchShellAvoidsDuplicateHeaderAndPreservesOtherRoutes — 경로별 헤더 계약 검증

```ts
test('searchShellAvoidsDuplicateHeaderAndPreservesOtherRoutes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(AppShell, null, createElement('p', null, '검색 내용')),
      ),
    );
    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('main')?.textContent).toContain('검색 내용');
    const nav = container.querySelector('nav[aria-label="주 메뉴"]');
    assert(nav);
    expect(nav.querySelector('a[href="/"]')).not.toBeNull();
    expect(nav.querySelector('a[href="/incidents"]')).not.toBeNull();
    pathname = '/incidents';
    await act(async () =>
      root.render(
        createElement(AppShell, null, createElement('p', null, '목록 내용')),
      ),
    );
    expect(container.querySelector('header a[href="/search"]')).not.toBeNull();
    expect(container.querySelector('main')?.textContent).toContain('목록 내용');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
```

## 실제 Next 전환

```ts
// file: src/app/search/recommendation-loading.test.ts
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium, type Browser } from 'playwright-core';
import { expect, test } from 'vitest';

const execute = promisify(execFile);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}

async function stop(child?: ChildProcess) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, wait(2000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

async function ready(origin: string, app: ChildProcess, output: () => string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(output());
    try {
      const response = await fetch(origin + '/search', {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Wait only for the owned local Next server to start.
    }
    await wait(100);
  }
  throw new Error('Next server did not start: ' + output());
}
```

- [x] recommendedKeywordShowsPendingUntilResultsArrive — 추천 클릭 후 응답 대기·새 결과 전환을 실제 브라우저로 검증

```ts
test('recommendedKeywordShowsPendingUntilResultsArrive', async () => {
  let releaseResponse!: () => void;
  const heldResponse = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let markRequested!: () => void;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  const requests: string[] = [];
  const api = createServer(async (request, response) => {
    const keyword =
      new URL(request.url ?? '/', 'http://fixture.invalid').searchParams.get(
        'keyword',
      ) ?? '';
    requests.push(keyword);
    if (keyword === '교통통제') {
      markRequested();
      await heldResponse;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        total: 1,
        items: [
          {
            article_id: 'a'.repeat(64),
            image_status: 'disabled',
            image_url: null,
            article: {
              title: keyword + ' 검증 기사',
              description: '로컬 회귀 검증 응답',
              pubDate: '2026-10-07T00:00:00Z',
              originallink: 'https://example.invalid/news',
              link: '',
            },
          },
        ],
      }),
    );
  });
  const directory = await mkdtemp(join(tmpdir(), 'search-pending-test-'));
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  try {
    const apiPort = await listen(api);
    const reservation = createServer();
    const appPort = await listen(reservation);
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    for (const path of [
      'src',
      'package.json',
      'next.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
    ]) {
      await cp(join(process.cwd(), path), join(directory, path), {
        recursive: true,
      });
    }
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(directory, 'node_modules'),
      'junction',
    );
    const env = {
      ...process.env,
      NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
      NEXT_TELEMETRY_DISABLED: '1',
    };
    await execute(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'build',
        '--webpack',
      ],
      { cwd: directory, env, timeout: 60000, maxBuffer: 8 * 1024 * 1024 },
    );
    app = spawn(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(appPort),
      ],
      { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    app.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    app.stderr?.on('data', (chunk) => {
      output += String(chunk);
    });
    const origin = 'http://127.0.0.1:' + appPort;
    await ready(origin, app, () => output);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
    });
    await page.goto(origin + '/search?q=' + encodeURIComponent('화재'));
    await page.locator('article').waitFor();
    expect(await page.locator('article').innerText()).toContain(
      '화재 검증 기사',
    );
    await page.getByRole('link', { name: /교통통제/ }).click();
    await Promise.race([
      requested,
      wait(10000).then(() => {
        throw new Error('추천 키워드 API 요청 없음');
      }),
    ]);
    const loading = page.getByRole('status').filter({ hasText: /검색.*불러/ });
    await loading.waitFor({ state: 'visible', timeout: 2500 });
    expect(await loading.getAttribute('aria-busy')).toBe('true');
    expect(await page.locator('article').innerText()).not.toContain(
      '교통통제 검증 기사',
    );
    releaseResponse();
    await page.waitForURL((url) => url.searchParams.get('q') === '교통통제');
    await page
      .locator('article')
      .filter({ hasText: '교통통제 검증 기사' })
      .waitFor();
    expect(
      await page
        .getByRole('searchbox', { name: '기사 키워드 검색' })
        .inputValue(),
    ).toBe('교통통제');
    expect(await loading.count()).toBe(0);
    expect(requests).toContain('교통통제');
  } finally {
    releaseResponse();
    await browser?.close();
    await stop(app);
    api.closeAllConnections();
    await new Promise<void>((resolve) => api.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}, 90000);
```
