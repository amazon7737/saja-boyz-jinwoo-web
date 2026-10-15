# Figma 공용 UI — 승인 전 테스트 초안

## 공용 레이아웃

```ts
// file: src/components/layout/app-shell.sobaya.test.ts
import { beforeEach, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppShell } from './app-shell';
const navigation = vi.hoisted(() => ({ pathname: '/', search: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
  useRouter: () => ({ replace: vi.fn() }),
}));
beforeEach(() => {
  navigation.pathname = '/';
  navigation.search = '';
});
function renderShell() {
  return renderToStaticMarkup(
    createElement(AppShell, null, createElement('p', null, '화면 본문')),
  );
}
```

- [ ] browseChrome — 홈과 목록이 접근 가능한 검색·필터·메뉴와 본문을 제공한다.

```ts
test('browseChrome', () => {
  for (const pathname of ['/', '/incidents']) {
    navigation.pathname = pathname;
    const html = renderShell();
    expect(html).toContain('aria-label="사건 필터"');
    expect(html).toContain('aria-label="조건 필터 초기화"');
    expect(html).toContain('aria-label="주소, 사고 유형 검색"');
    expect(html).toContain('aria-label="주 메뉴"');
    expect(html).toContain('화면 본문');
  }
});
```

- [ ] navigationKeepsFilters — 홈↔목록 이동은 URL 필터를 유지하고 page는 넘기지 않는다.

```ts
test('navigationKeepsFilters', () => {
  navigation.search = 'q=서울&category=society&status=ongoing&period=1w&page=3';
  const html = renderShell();
  const suffix =
    'q=%EC%84%9C%EC%9A%B8&amp;category=society&amp;status=ongoing&amp;period=1w';
  expect(html).toContain(`href="/incidents?${suffix}"`);
  expect(html).toContain(`href="/?${suffix}"`);
  expect(html).not.toContain('page=3');
});
```

- [ ] selectedFilters — URL의 분류·상태·기간이 필터 이름에 표시된다.

```ts
test('selectedFilters', () => {
  navigation.search = 'category=society&status=ongoing&period=1w';
  const html = renderShell();
  expect(html).toContain('aria-label="카테고리: 사회"');
  expect(html).toContain('aria-label="상태: 진행 중"');
  expect(html).toContain('aria-label="기간: 최근 1주"');
});
```

- [ ] immersiveRoutes — 제보와 상세는 본문을 유지하고 공용 헤더·필터·메뉴를 숨긴다.

```ts
test('immersiveRoutes', () => {
  for (const pathname of ['/report', '/incidents/example']) {
    navigation.pathname = pathname;
    const html = renderShell();
    expect(html).toContain('화면 본문');
    expect(html).not.toContain('<header');
    expect(html).not.toContain('aria-label="사건 필터"');
    expect(html).not.toContain('aria-label="주 메뉴"');
  }
});
```

## 검토

- 아직 승인되지 않은 4개 항목이다. 첫 sobaya 루프는 공용 레이아웃 범위이며 함수 경계·필터 상호작용은 다음 승인안으로 추가한다.
- 시각 치수는 Figma 및 브라우저에서 별도 확인한다. 이 테스트가 픽셀 일치를 증명하지 않는다.
- 명세·검사 계약·전체 스위트 지원 코드: docs/sobaya-restart-approval.md.
