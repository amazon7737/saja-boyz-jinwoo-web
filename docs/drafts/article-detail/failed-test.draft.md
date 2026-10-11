# 기사 상세·진입·공유 테스트 초안

검토 전 초안. 아래 헤더와 본문이 실행 입력이며 `review.ko.md`의 설명 주석은 포함하지 않는다.

## 상세 경로 통합 검증

```ts
// file: src/app/incidents/article-detail.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import DetailPage from './[id]/page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

const id = 'a'.repeat(64);
const apiOrigin = 'https://news.example.invalid';
const item = {
  collection_id: 'test-collection',
  article_id: id,
  article: {
    title: '교통 <b>안내</b> &amp; 점검',
    description: '도로 점검으로 우회가 필요합니다.',
    pubDate: '2026-10-10T09:00:00+09:00',
    originallink: 'https://publisher.example.invalid/article',
    link: 'https://portal.example.invalid/article',
  },
  image_status: 'ready',
  image_url: `/images/${id}.jpg`,
};
const fetchMock = vi.fn<typeof fetch>();
const detailRoute: (props: {
  params: Promise<{ id: string }>;
}) => ReactNode | void | Promise<ReactNode | void> = DetailPage;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  fetchMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

async function detailTree(articleId = id) {
  return (
    (await detailRoute({ params: Promise.resolve({ id: articleId }) })) ?? null
  );
}

async function detailMarkup() {
  const outcome = await detailTree().then(
    (tree) => ({ tree }),
    (error: unknown) => ({ error }),
  );
  expect(outcome).not.toHaveProperty('error');
  assert('tree' in outcome);
  const view = document.createElement('div');
  view.innerHTML = renderToStaticMarkup(outcome.tree);
  return view;
}
```

- [ ] articleDetailRequestAndContent — 상세 URL의 ID로 단건 조회하고 실제 필드만 표시한다.

```ts
test('articleDetailRequestAndContent', async () => {
  fetchMock.mockResolvedValueOnce(Response.json(item));
  const view = await detailMarkup();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(input instanceof Request ? input.url : String(input));
  expect(url.href).toBe(`${apiOrigin}/news/${id}`);
  expect(init?.method).toBe('GET');
  expect(init?.cache).toBe('no-store');
  expect(init?.body).toBeUndefined();
  expect(init?.signal).toBeTruthy();
  expect(view.querySelector('h1')?.textContent).toBe('교통 안내 & 점검');
  expect(view.textContent).toContain('기사 요약');
  expect(view.textContent).toContain(item.article.description);
  expect(view.textContent).toContain('기사 발행');
  expect(view.textContent).toContain('2026-10-10 09:00 KST');
  expect(view.querySelector('time')?.dateTime).toBe('2026-10-10T00:00:00.000Z');
  expect(
    view.querySelector('a[href="https://publisher.example.invalid/article"]')
      ?.textContent,
  ).toContain('원문');
  expect(
    view.querySelector(`img[src="${apiOrigin}/images/${id}.jpg"]`),
  ).not.toBeNull();
  expect(view.textContent).toContain('AI 생성 이미지');
  expect(view.textContent).not.toMatch(/사건 위치|발생 시각|타임라인/);
  expect(view.querySelector('a[href="/incidents"]')).not.toBeNull();
  expect(view.querySelector('a[href="/"]')).not.toBeNull();
});
```

- [ ] articleDetailFailureStates — 잘못된 ID·404와 설정·통신·응답 오류를 구분하고 안전한 재시도를 제공한다.

```ts
test('articleDetailFailureStates', async () => {
  for (const invalidId of [
    'short',
    'A'.repeat(64),
    '../news',
    'a'.repeat(65),
  ]) {
    await expect(detailTree(invalidId)).rejects.toThrow(
      'TEST_ARTICLE_NOT_FOUND',
    );
  }
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
  await expect(detailTree()).rejects.toThrow('TEST_ARTICLE_NOT_FOUND');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fetchMock.mockReset();
  const expectFailure = (view: HTMLDivElement) => {
    const alert = view.querySelector('[role="alert"]');
    assert(alert);
    expect(alert.textContent).toContain('기사를 불러오지 못했어요');
    expect(
      alert.querySelector(`a[href="/incidents/${id}"]`)?.textContent,
    ).toContain('다시 시도');
    expect(view.textContent).not.toMatch(
      /PRIVATE_DETAIL|기사를 찾을 수 없어요/,
    );
    expect(view.querySelector('h1')?.textContent).not.toBe('교통 안내 & 점검');
  };
  for (const base of [
    '',
    'file:///tmp/news',
    'https://user:secret@news.example.invalid',
  ]) {
    vi.stubEnv('NEWS_API_BASE_URL', base);
    expectFailure(await detailMarkup());
  }
  expect(fetchMock).not.toHaveBeenCalled();
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  fetchMock.mockRejectedValueOnce(new Error('PRIVATE_DETAIL'));
  expectFailure(await detailMarkup());
  fetchMock.mockResolvedValueOnce(
    new Response('PRIVATE_DETAIL', { status: 503 }),
  );
  expectFailure(await detailMarkup());
  fetchMock.mockResolvedValueOnce(new Response('invalid-json'));
  expectFailure(await detailMarkup());
  for (const payload of [
    null,
    { ...item, article_id: 'b'.repeat(64) },
    { ...item, article: null },
    { ...item, article: { ...item.article, description: 42 } },
    { ...item, image_url: 42 },
  ]) {
    fetchMock.mockResolvedValueOnce(Response.json(payload));
    expectFailure(await detailMarkup());
  }
});
```

- [ ] articleDetailSafePresentation — 기사 문자열·원문·날짜·이미지 상태를 안전하게 표시한다.

```ts
test('articleDetailSafePresentation', async () => {
  for (const imageStatus of [
    'disabled',
    'pending',
    'generating',
    'failed',
    'unknown',
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...item, image_status: imageStatus }),
    );
    const view = await detailMarkup();
    expect(view.querySelector('img')).toBeNull();
    expect(view.textContent).toContain('이미지 없음');
    expect(view.textContent).not.toContain('AI 생성 이미지');
  }
  for (const imageUrl of [
    null,
    'https://other.invalid/image.jpg',
    '//other.invalid/image.jpg',
    `/images/${'b'.repeat(64)}.jpg`,
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...item,
        image_url: imageUrl,
        article: {
          ...item.article,
          title: '<b>안내</b> &lt;script&gt;alert(1)&lt;/script&gt;',
          description: '&quot;확인&quot; <img src=x onerror=alert(1)>',
          originallink: 'javascript:alert(1)',
          pubDate: 'invalid-date',
        },
      }),
    );
    const view = await detailMarkup();
    expect(view.querySelector('h1')?.textContent).toBe(
      '안내 <script>alert(1)</script>',
    );
    expect(view.textContent).toContain('"확인"');
    expect(view.querySelector('script, img, b, time')).toBeNull();
    expect(
      view.querySelector('a[href="https://portal.example.invalid/article"]'),
    ).not.toBeNull();
    expect(view.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(view.textContent).toContain('발행 시각 미확인');
  }
  fetchMock.mockResolvedValueOnce(
    Response.json({
      ...item,
      article: {
        ...item.article,
        originallink: '//unsafe.invalid',
        link: 'data:text/html,unsafe',
      },
    }),
  );
  const view = await detailMarkup();
  expect(view.textContent).toContain('원문 링크 없음');
  expect(view.querySelector('a[href^="//"], a[href^="data:"]')).toBeNull();
});
```

- [ ] articleDetailTimeout — 응답이 멈춘 단건 조회를 중단하고 오류를 표시한다.

```ts
test('articleDetailTimeout', async () => {
  let signal: AbortSignal | null | undefined;
  fetchMock.mockImplementationOnce((_input, init) => {
    signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener(
        'abort',
        () => reject(new DOMException('PRIVATE_DETAIL', 'AbortError')),
        { once: true },
      );
    });
  });
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      detailMarkup(),
      new Promise<null>((resolve) => {
        deadline = setTimeout(() => resolve(null), 7000);
      }),
    ]);
    assert(result);
    expect(result.querySelector('[role="alert"]')?.textContent).toContain(
      '기사를 불러오지 못했어요',
    );
    expect(result.textContent).not.toContain('PRIVATE_DETAIL');
    expect(signal?.aborted).toBe(true);
  } finally {
    clearTimeout(deadline);
  }
}, 10000);
```

- [ ] articleDetailImageFailure — 상세 이미지 로딩 실패 후에도 제목·요약·원문·공유가 남는다.

```ts
test('articleDetailImageFailure', async () => {
  fetchMock.mockResolvedValueOnce(Response.json(item));
  const tree = await detailTree();
  await act(async () => root.render(tree));
  const image = container.querySelector('img');
  assert(image);
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('이미지 없음');
  expect(container.textContent).not.toContain('AI 생성 이미지');
  expect(container.querySelector('h1')?.textContent).toBe('교통 안내 & 점검');
  expect(container.textContent).toContain(item.article.description);
  expect(
    container.querySelector(
      'a[href="https://publisher.example.invalid/article"]',
    ),
  ).not.toBeNull();
  expect(
    Array.from(container.querySelectorAll('button')).some((button) =>
      button.textContent?.includes('공유'),
    ),
  ).toBe(true);
});
```

- [ ] articleDetailShareUrl — 직접 상세 URL을 공유·복사하고 취소·실패를 구분한다.

```ts
test('articleDetailShareUrl', async () => {
  window.history.replaceState(
    null,
    '',
    `/incidents/${id}?tracking=test#summary`,
  );
  const share = vi.fn().mockResolvedValue(undefined);
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { share, clipboard: { writeText } });
  fetchMock.mockResolvedValueOnce(Response.json(item));
  const tree = await detailTree();
  await act(async () => root.render(tree));
  const button = Array.from(container.querySelectorAll('button')).find(
    (entry) => entry.textContent?.includes('공유'),
  );
  assert(button);
  const url = `${window.location.origin}/incidents/${id}`;
  await act(async () => button.click());
  expect(share).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ title: '교통 안내 & 점검', url }),
  );
  expect(writeText).not.toHaveBeenCalled();
  share.mockRejectedValueOnce(new DOMException('user canceled', 'AbortError'));
  await act(async () => button.click());
  expect(writeText).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  share.mockRejectedValueOnce(new Error('PRIVATE_SHARE_FAILURE'));
  await act(async () => button.click());
  expect(writeText).toHaveBeenLastCalledWith(url);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '링크를 복사했어요',
  );
  writeText.mockClear();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  let completeCopy = () => {};
  writeText.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        completeCopy = resolve;
      }),
  );
  await act(async () => button.click());
  expect(writeText).toHaveBeenCalledExactlyOnceWith(url);
  expect(container.textContent).not.toContain('링크를 복사했어요');
  await act(async () => completeCopy());
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '링크를 복사했어요',
  );
  writeText.mockRejectedValueOnce(new Error('PRIVATE_CLIPBOARD_FAILURE'));
  await act(async () => button.click());
  const manual = container.querySelector('input[aria-label="공유 링크"]');
  assert(manual instanceof HTMLInputElement);
  expect(manual.value).toBe(url);
  expect(manual.readOnly).toBe(true);
  expect(container.textContent).not.toMatch(/PRIVATE_|링크를 복사했어요/);
  vi.stubGlobal('navigator', {});
  await act(async () => button.click());
  expect(
    container.querySelector('input[aria-label="공유 링크"]'),
  ).not.toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] articleDetailLinksFromListAndSearch — 목록·검색 카드 제목은 내부 상세로, 원문은 외부 기사로 연결한다.

```ts
test('articleDetailLinksFromListAndSearch', async () => {
  const { default: IncidentsPage } = await import('./page');
  const { default: SearchPage } = await import('../search/page');
  for (const page of [
    () => IncidentsPage(),
    () => SearchPage({ searchParams: Promise.resolve({ q: '  도로 점검  ' }) }),
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({ total: 2, items: [item, item] }),
    );
    const view = document.createElement('div');
    const html = renderToStaticMarkup(await page());
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
    view.innerHTML = html;
    expect(view.querySelectorAll('article')).toHaveLength(1);
    const title = view.querySelector('article h2');
    assert(title);
    const detailLink = title.querySelector('a') ?? title.closest('a');
    expect(detailLink?.getAttribute('href')).toBe(`/incidents/${id}`);
    expect(detailLink?.textContent).toContain('교통 안내 & 점검');
    expect(
      view.querySelector(
        'article a[href="https://publisher.example.invalid/article"]',
      )?.textContent,
    ).toBe('기사 원문');
  }
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const [input] = fetchMock.mock.calls[1];
  const url = new URL(input instanceof Request ? input.url : String(input));
  expect(url.searchParams.get('keyword')).toBe('도로 점검');
  fetchMock.mockResolvedValueOnce(
    Response.json({
      total: 1,
      items: [
        {
          ...item,
          article: {
            ...item.article,
            originallink: 'javascript:alert(1)',
            link: '/unsafe-relative',
          },
        },
      ],
    }),
  );
  const view = document.createElement('div');
  view.innerHTML = renderToStaticMarkup(await IncidentsPage());
  const title = view.querySelector('article h2');
  assert(title);
  const detailLink = title.querySelector('a') ?? title.closest('a');
  expect(detailLink?.getAttribute('href')).toBe(`/incidents/${id}`);
  expect(view.textContent).toContain('원문 링크 없음');
  expect(
    view.querySelector('a[href^="javascript:"], a[href="/unsafe-relative"]'),
  ).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
```

- [ ] articleDetailRouteBoundaries — 상세 로딩과 기사 없음 화면은 서로 다른 안내와 복귀 경로를 제공한다.

```ts
test('articleDetailRouteBoundaries', async () => {
  const { createElement } = await import('react');
  const routes = import.meta.glob('./[[]id]/{loading,not-found}.tsx');
  function isRoute(value: unknown): value is { default: () => ReactNode } {
    return (
      value !== null &&
      typeof value === 'object' &&
      'default' in value &&
      typeof value.default === 'function'
    );
  }
  const loading = routes['./[id]/loading.tsx'];
  const notFound = routes['./[id]/not-found.tsx'];
  expect(loading).toBeTypeOf('function');
  expect(notFound).toBeTypeOf('function');
  const view = document.createElement('div');
  const loadingModule = await loading();
  assert(isRoute(loadingModule));
  view.innerHTML = renderToStaticMarkup(createElement(loadingModule.default));
  expect(
    view.querySelector('[role="status"][aria-busy="true"]')?.textContent,
  ).toContain('기사를 불러오는 중');
  expect(view.textContent).not.toContain('기사를 찾을 수 없어요');
  const notFoundModule = await notFound();
  assert(isRoute(notFoundModule));
  view.innerHTML = renderToStaticMarkup(createElement(notFoundModule.default));
  expect(view.textContent).toContain('기사를 찾을 수 없어요');
  expect(view.querySelector('a[href="/incidents"]')).not.toBeNull();
  expect(view.querySelector('[aria-busy="true"]')).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
```
