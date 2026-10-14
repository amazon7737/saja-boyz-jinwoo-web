# 상세 오류 복귀 회귀 테스트

## 상세 페이지와 실제 AppShell 통합

```ts
// file: src/app/incidents/article-detail-error-navigation.test.ts
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppShell } from '../../components/layout/app-shell/app-shell';
import DetailPage from './[id]/page';

vi.mock('next/navigation', () => ({
  usePathname: () => `/incidents/${'a'.repeat(64)}`,
  notFound: () => {
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

const id = 'a'.repeat(64);
const fetchMock = vi.fn<typeof fetch>();
const item = {
  collection_id: 'navigation-regression',
  article_id: id,
  article: {
    title: '상세 복귀 동선 검증 기사',
    description: '실제 API 정보가 아닌 회귀 테스트 기사입니다.',
    pubDate: '2026-10-14T00:00:00Z',
    originallink: 'https://publisher.example.invalid/article',
    link: 'https://portal.example.invalid/article',
  },
  image_status: 'disabled',
  image_url: null,
};

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function detailView() {
  const tree = await DetailPage({ params: Promise.resolve({ id }) });
  const view = document.createElement('div');
  view.innerHTML = renderToStaticMarkup(createElement(AppShell, null, tree));
  return view;
}
```

- [ ] articleDetailErrorsKeepExitNavigationAndRetry — 정상 상세와 6종 API 오류에서 전용 목록·지도 복귀 및 오류 재시도를 유지하고 공통 메뉴를 중복하지 않는다

```ts
test('articleDetailErrorsKeepExitNavigationAndRetry', async () => {
  fetchMock.mockResolvedValueOnce(Response.json(item));
  const success = await detailView();
  const successNav = success.querySelector('nav[aria-label="기사 상세 탐색"]');
  expect(successNav).not.toBeNull();
  expect(
    successNav?.querySelector('a[aria-label="목록으로"]')?.getAttribute('href'),
  ).toBe('/incidents');
  expect(
    successNav?.querySelector('a[aria-label="닫기"]')?.getAttribute('href'),
  ).toBe('/');

  for (const failure of [
    '500',
    'network',
    'timeout',
    'json',
    'contract',
    'configuration',
  ]) {
    fetchMock.mockReset();
    vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
    if (failure === '500')
      fetchMock.mockResolvedValueOnce(
        new Response('PRIVATE_DETAIL', { status: 500 }),
      );
    if (failure === 'network')
      fetchMock.mockRejectedValueOnce(new Error('PRIVATE_DETAIL'));
    if (failure === 'timeout')
      fetchMock.mockRejectedValueOnce(
        new DOMException('PRIVATE_DETAIL', 'TimeoutError'),
      );
    if (failure === 'json')
      fetchMock.mockResolvedValueOnce(new Response('PRIVATE_DETAIL'));
    if (failure === 'contract')
      fetchMock.mockResolvedValueOnce(
        Response.json({ ...item, article_id: 'b'.repeat(64) }),
      );
    if (failure === 'configuration') vi.stubEnv('NEWS_API_BASE_URL', '');

    const view = await detailView();
    const navigation = view.querySelector('nav[aria-label="기사 상세 탐색"]');
    expect(navigation, failure).not.toBeNull();
    expect(
      view.querySelectorAll('nav[aria-label="기사 상세 탐색"]'),
      failure,
    ).toHaveLength(1);
    expect(
      navigation
        ?.querySelector('a[aria-label="목록으로"]')
        ?.getAttribute('href'),
      failure,
    ).toBe('/incidents');
    expect(
      navigation?.querySelector('a[aria-label="닫기"]')?.getAttribute('href'),
      failure,
    ).toBe('/');
    const alert = view.querySelector('[role="alert"]');
    expect(alert?.textContent, failure).toContain('기사를 불러오지 못했어요');
    expect(
      alert?.querySelector(`a[href="/incidents/${id}"]`)?.textContent,
      failure,
    ).toContain('다시 시도');
    expect(view.querySelector('nav[aria-label="주 메뉴"]'), failure).toBeNull();
    expect(view.querySelector('header img[alt="흉흉"]'), failure).toBeNull();
    expect(view.textContent, failure).not.toContain('PRIVATE_DETAIL');
    expect(view.querySelector('h1'), failure).toBeNull();
    expect(fetchMock, failure).toHaveBeenCalledTimes(
      failure === 'configuration' ? 0 : 1,
    );
  }
});
```
