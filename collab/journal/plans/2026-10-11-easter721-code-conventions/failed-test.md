# 구조 리팩터링 검증 계획

이번 작업은 사용자 승인된 코드 컨벤션 정리이며 새 동작이나 신규 테스트가 없다. Sobaya의 별도 구조 리팩터링 계약에 따라 기존 전체 61개 테스트를 변경 전후 실행한다.

런타임의 plan 파서는 최소 한 개의 검사 항목을 요구하므로 이미 승인되고 dev에 존재하는 AppShell 통합 테스트를 원문 그대로 참조한다. [x]는 기존 완료된 검사 계약을 뜻하며 이번에 새 RED/GREEN 체크포인트가 만들어졌다는 뜻이 아니다. 아래 헤더와 본문은 기존 파일 그대로이고 테스트 파일을 추가·수정·삽입하지 않는다. 최종 gate가 기존 항목의 실제 실행 성공도 검증한다.

## 기존 레이아웃 계약

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

- [x] searchShellAvoidsDuplicateHeaderAndPreservesOtherRoutes — 기존 승인된 검색 헤더와 다른 라우트의 본문·탐색 계약 보존
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
