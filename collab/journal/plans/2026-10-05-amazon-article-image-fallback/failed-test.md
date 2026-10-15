# 기사 이미지 로딩 실패 — 실패 테스트 초안

상태: 정확한 입력 승인 전. 기존 21개 테스트·지원 파일·승인 기준선은 변경하지 않는다.

## 실제 카드 이미지 DOM

```ts
// file: src/features/article-list/article-image-error.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ArticleList, type ArticleCollectionItem } from './article-list';

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

- [x] articleImageErrorPreservesCards — 한 이미지의 오류만 기존 대체 표시로 바꾸고 기사 정보·원문·다른 카드를 유지한다.

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
  expect(cards[0].querySelector('a')?.getAttribute('href')).toBe(
    'https://publisher.example.invalid/A',
  );
  expect(cards[0].querySelector('a')?.textContent).toBe('기사 원문');
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

- [x] articleImageRecoversForNewSource — 동일 카드에 새 이미지 URL이 들어오면 다시 표시하고 새 오류에도 대체 표시한다.

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
  expect(container.querySelector('a')?.getAttribute('href')).toBe(
    'https://publisher.example.invalid/A',
  );

  await failImage(nextImage);

  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('figcaption')).toBeNull();
  expect(container.textContent).toContain('이미지 없음');
  expect(container.querySelectorAll('article')).toHaveLength(1);
});
```
