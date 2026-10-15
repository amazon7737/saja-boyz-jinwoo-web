# 기존 테스트 대체 제안

실제 파일은 변경하지 않았다. 아래 네 본문만 대체하며 공유 헤더·그 밖의 기존 테스트는 유지한다. 상세 링크가 없어야 한다는 오래된 조건은 제거하고, 링크 존재는 신규 `articleDetailLinksFromListAndSearch`에서 확인한다. 안전하지 않은 원문을 가진 카드에는 정확한 내부 상세 링크만 허용한다. 네 대체안은 현재 구현에서도 통과하는 호환성 변경이며 신규 기능 테스트로 중복 등록하지 않는다.

## src/app/incidents/article-list-api.test.ts

### 기존 공유 헤더 — 변경 없음

```ts
// file: src/app/incidents/article-list-api.test.ts
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const loadingRoutes = import.meta.glob('./loading.tsx');
const apiOrigin = 'https://news.example.invalid';
const idA = 'e77553113fe8862b91aec1fd09a25af83e256ac12cb4a8ff7d8d78ea3050c909';
const idB = '6dd70b87676f579839c940ae6048bc6bf65d2005e1552c515b9a0151500b621a';
const item = {
  collection_id: '20261004T030000000000Z_00000000000000000000000000000000',
  article_id: idA,
  article: {
    title: '샘플: <b>교통</b> 안내 &amp; 점검',
    originallink: 'https://example.invalid/news/a',
    link: 'https://portal.example.invalid/news/a',
    description: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;',
    pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900',
  },
  image_status: 'disabled',
  image_url: null,
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function respond(items: unknown[], total = items.length) {
  fetchMock.mockResolvedValueOnce(Response.json({ total, items }));
}

async function renderPage() {
  vi.resetModules();
  const { default: IncidentsPage } = await import('./page');
  return renderToStaticMarkup(await IncidentsPage());
}

function cards(html: string): string[] {
  return html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
}

function singleCard(html: string) {
  const rows = cards(html);
  expect(rows).toHaveLength(1);
  return rows[0];
}

function readRole(html: string, role: 'status' | 'alert') {
  return html.match(
    new RegExp(
      `<([a-z][a-z0-9]*)\\b([^>]*\\brole="${role}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    ),
  );
}

function isLoadingModule(value: unknown): value is { default: ComponentType } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'default' in value &&
    typeof value.default === 'function'
  );
}

function expectError(html: string) {
  const alert = readRole(html, 'alert');
  expect(alert).not.toBeNull();
  expect(alert?.[3]).toContain('기사를 불러오지 못했어요');
  expect(alert?.[3]).toContain('다시 시도');
  expect(alert?.[3]).toContain('href="/incidents"');
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  expect(cards(html)).toHaveLength(0);
}

```

### articleCardsIdentityAndPublication — 대체 본문

```ts
test('articleCardsIdentityAndPublication', async () => {
  respond(
    [
      item,
      {
        ...item,
        article_id: idB,
        article: {
          ...item.article,
          originallink: 'https://example.invalid/news/b',
          pubDate: 'Fri, 18 Sep 2099 12:00:00 +0900',
        },
      },
      {
        ...item,
        collection_id: 'older-collection',
        article: { ...item.article, title: '오래된 중복 제목' },
      },
    ],
    987654,
  );
  const html = await renderPage();
  const rows = cards(html);
  expect(html).toContain('사건 목록');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toContain('샘플: 교통 안내 &amp; 점검');
  expect(rows[1]).toContain('샘플: 교통 안내 &amp; 점검');
  expect(rows[0]).toContain('가상 &quot;안내&quot; &#x27;검증&#x27; 가');
  expect(rows[0]).toContain('href="https://example.invalid/news/a"');
  expect(rows[1]).toContain('href="https://example.invalid/news/b"');
  expect(rows[0]).toContain('기사 발행');
  expect(rows[0]).toContain('dateTime="2026-09-17T00:00:00.000Z"');
  expect(rows[0]).toContain('2026-09-17 09:00 KST');
  expect(rows[1]).toContain('2099-09-18 12:00 KST');
  expect(html).not.toContain('987654');
  expect(html).not.toContain('987,654');
  expect(html).not.toContain('오래된 중복 제목');
  expect(html).not.toMatch(
    /data-category|data-status|📍|진행 중|발생 시각|전체 사건/,
  );
  expect(html).not.toMatch(/<header\b|<nav\b/);
});

```

### articleTextAndSourceSafety — 대체 본문

```ts
test('articleTextAndSourceSafety', async () => {
  for (const unsafe of [
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative',
    '//other.invalid/a',
    'https://user:password@example.invalid/a',
  ]) {
    respond([
      {
        ...item,
        article: {
          ...item.article,
          title: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;',
          description: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;',
          originallink: unsafe,
          link: 'https://portal.example.invalid/fallback',
          pubDate: 'invalid-date',
        },
      },
    ]);
    const row = singleCard(await renderPage());
    expect(row).toContain('태그 강조 &lt;img src=x onerror=alert(1)&gt;');
    expect(row).toContain('&#x27;인용&#x27;');
    expect(row).toContain('📰');
    expect(row).toContain('&amp;#x110000;');
    expect(row).toContain('&amp;#xD800;');
    expect(row).toContain('href="https://portal.example.invalid/fallback"');
    expect(row).toContain('기사 원문');
    expect(row).toContain('발행 시각 미확인');
    expect(row).not.toMatch(/<img\b|<b\b|<script\b|<time\b/);
    respond([
      {
        ...item,
        article: { ...item.article, originallink: unsafe, link: unsafe },
      },
    ]);
    const unlinked = singleCard(await renderPage());
    expect(unlinked).toContain('샘플: 교통 안내');
    expect(unlinked).toContain('원문 링크 없음');
    for (const anchor of unlinked.match(/<a\b[^>]*>/g) ?? []) {
      expect(anchor).toMatch(
        new RegExp(`\\shref="/incidents/${idA}"(?:\\s|>)`),
      );
    }
  }
});

```

## src/features/article-list/ui/article-list/article-list.test.ts

### 기존 공유 헤더 — 변경 없음

```ts
// file: src/features/article-list/ui/article-list/article-list.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ArticleList } from './article-list';
import type { ArticleCollectionItem } from '../../model/article.types';

const apiOrigin = 'https://news.example.invalid';
const idA = 'a'.repeat(64);
const idB = 'b'.repeat(64);
const idC = 'c'.repeat(64);

function item(id: string, label: string): ArticleCollectionItem {
  return {
    article_id: id,
    image_status: 'ready',
    image_url: `/images/${id}.jpg`,
    article: {
      title: `샘플 기사 ${label}`,
      description: `검증용 기사 ${label} 요약`,
      pubDate: '2026-10-04T09:00:00+09:00',
      originallink: `https://publisher.example.invalid/${label}`,
      link: '',
    },
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render(items: ArticleCollectionItem[], origin = apiOrigin) {
  await act(async () => {
    root.render(createElement(ArticleList, { items, apiOrigin: origin }));
  });
}

async function failImage(image: HTMLImageElement) {
  await act(async () => {
    image.dispatchEvent(new Event('error'));
  });
}

```

### articleImageErrorPreservesCards — 대체 본문

```ts
test('articleImageErrorPreservesCards', async () => {
  const disabled = {
    ...item(idC, 'C'),
    image_status: 'disabled',
    image_url: null,
  };
  await render([item(idA, 'A'), item(idB, 'B'), disabled]);
  const initialCards = container.querySelectorAll('article');
  expect(initialCards).toHaveLength(3);
  const image = initialCards[0].querySelector('img');
  assert(image);
  expect(image.getAttribute('alt')).toBe('');
  expect(image.getAttribute('width')).toBe('80');
  expect(image.getAttribute('height')).toBe('80');
  expect(initialCards[0].querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );

  await failImage(image);

  const cards = container.querySelectorAll('article');
  expect(
    Array.from(cards, (card) => card.querySelector('h2')?.textContent),
  ).toEqual(['샘플 기사 A', '샘플 기사 B', '샘플 기사 C']);

  expect(cards[0].querySelector('img')).toBeNull();
  expect(cards[0].querySelector('figcaption')).toBeNull();
  expect(cards[0].textContent).toContain('이미지 없음');
  expect(cards[0].querySelector('h2')?.textContent).toBe('샘플 기사 A');
  expect(cards[0].textContent).toContain('검증용 기사 A 요약');
  expect(cards[0].textContent).toContain('기사 발행 2026-10-04 09:00 KST');
  expect(cards[0].querySelector('time')?.dateTime).toBe(
    '2026-10-04T00:00:00.000Z',
  );
  expect(
    cards[0]
      .querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.getAttribute('href'),
  ).toBe('https://publisher.example.invalid/A');
  expect(
    cards[0].querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.textContent,
  ).toBe('기사 원문');
  expect(cards[1].querySelector('img')?.src).toBe(
    `${apiOrigin}/images/${idB}.jpg`,
  );
  expect(cards[1].querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );
  expect(cards[1].textContent).not.toContain('이미지 없음');
  expect(cards[2].querySelector('img')).toBeNull();
  expect(cards[2].textContent).toContain('이미지 없음');
  expect(container.querySelectorAll('article')).toHaveLength(3);
});

```

### articleImageRecoversForNewSource — 대체 본문

```ts
test('articleImageRecoversForNewSource', async () => {
  const articles = [item(idA, 'A')];
  await render(articles);
  const initialImage = container.querySelector('img');
  assert(initialImage);
  await failImage(initialImage);
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('이미지 없음');

  const nextOrigin = 'https://updated-news.example.invalid';
  await render(articles, nextOrigin);

  const nextImage = container.querySelector('img');
  assert(nextImage);
  expect(nextImage.src).toBe(`${nextOrigin}/images/${idA}.jpg`);
  expect(nextImage.getAttribute('alt')).toBe('');
  expect(container.textContent).not.toContain('이미지 없음');
  expect(container.querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );
  expect(
    container
      .querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.getAttribute('href'),
  ).toBe('https://publisher.example.invalid/A');

  await failImage(nextImage);

  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('figcaption')).toBeNull();
  expect(container.textContent).toContain('이미지 없음');
  expect(container.querySelectorAll('article')).toHaveLength(1);
});
```

