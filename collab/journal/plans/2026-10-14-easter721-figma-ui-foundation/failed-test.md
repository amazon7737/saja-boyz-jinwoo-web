# Figma 공통 디자인 기반 — 정확한 테스트 초안

## AppShell 행동 검증

```ts
// file: src/components/layout/app-shell/app-shell-foundation.test.ts
// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vitest';

import { AppShell } from './app-shell';

let pathname = '/';
const childAction = vi.fn();

vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

afterEach(() => {
  pathname = '/';
  vi.unstubAllGlobals();
  childAction.mockClear();
});

async function withShell(
  route: string,
  inspect: (host: HTMLDivElement) => void | Promise<void>,
) {
  pathname = route;
  childAction.mockClear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);

  try {
    await act(async () => {
      root.render(
        createElement(
          AppShell,
          null,
          createElement(
            'section',
            { 'aria-label': '기능 내용' },
            createElement('h1', null, '기능 내용'),
            createElement(
              'button',
              { type: 'button', onClick: childAction },
              '기능 동작',
            ),
          ),
        ),
      );
    });
    await inspect(host);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
}
```

- [x] foundationDedicatedScreensPreserveTheirContent — 상세·제보의 공통 헤더/메뉴 중복을 없애도 실제 자식 콘텐츠와 버튼 동작은 유지한다.

```ts
test('foundationDedicatedScreensPreserveTheirContent', async () => {
  for (const route of ['/report', `/incidents/${'a'.repeat(64)}`]) {
    await withShell(route, async (host) => {
      expect(host.querySelector('header')).toBeNull();
      expect(host.querySelector('nav[aria-label="주 메뉴"]')).toBeNull();
      const main = host.querySelector('main#main-content');
      assert(main);
      expect(main.textContent).toContain('기능 내용');
      const button = main.querySelector<HTMLButtonElement>('button');
      assert(button);
      await act(async () => button.click());
      expect(childAction).toHaveBeenCalledTimes(1);
    });
  }
});
```

- [x] foundationNavigationAnnouncesItsCurrentDestination — 지도/목록 이동 목적지와 현재 화면 표시를 유지하고 검색 화면도 지도 영역임을 접근성 정보로 전달한다.

```ts
test('foundationNavigationAnnouncesItsCurrentDestination', async () => {
  for (const [route, currentHref, currentValue] of [
    ['/', '/', 'page'],
    ['/incidents', '/incidents', 'page'],
    ['/search', '/', 'location'],
  ]) {
    await withShell(route, (host) => {
      const nav = host.querySelector('nav[aria-label="주 메뉴"]');
      assert(nav);
      const links = Array.from(nav.querySelectorAll('a'));
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/',
        '/report',
        '/incidents',
      ]);
      const current = nav.querySelectorAll('a[aria-current]');
      expect(current).toHaveLength(1);
      expect(current[0].getAttribute('href')).toBe(currentHref);
      expect(current[0].getAttribute('aria-current')).toBe(currentValue);
      expect(
        nav.querySelector('a[href="/report"]')?.getAttribute('aria-label'),
      ).toBe('제보하기');
    });
  }
});
```

- [x] foundationBrandHasALocalAccessibleSvgAndSearchLink — 흉흉 홈 링크의 로고가 실제 로컬 SVG 파일이며 검색 링크도 유지된다.

```ts
test('foundationBrandHasALocalAccessibleSvgAndSearchLink', async () => {
  for (const route of ['/', '/incidents']) {
    await withShell(route, (host) => {
      const home = host.querySelector('header a[href="/"]');
      assert(home);
      const logo = home.querySelector('img[alt="흉흉"]');
      assert(logo);
      const source = logo.getAttribute('src');
      assert(source);
      expect(source).toMatch(/^\/(?!\/).*\.svg$/);
      const file = resolve(process.cwd(), `public${source}`);
      expect(existsSync(file)).toBe(true);
      const svg = new DOMParser().parseFromString(
        readFileSync(file, 'utf8'),
        'image/svg+xml',
      );
      expect(svg.querySelector('parsererror')).toBeNull();
      expect(svg.documentElement.localName).toBe('svg');
      expect(svg.documentElement.getAttribute('viewBox')).toBeTruthy();
      expect(svg.querySelector('path')).not.toBeNull();
      expect(svg.querySelector('text')).toBeNull();
      expect(host.querySelector('header a[href="/search"]')).not.toBeNull();
    });
  }
});
```

- [x] foundationUnconnectedArticleFiltersCannotPretendToFilter — 지도·목록에서 실제 기사 필터가 연결되기 전 비활성 칩과 준비 상태를 표시하고 검색 화면에 중복 필터를 넣지 않는다.

```ts
test('foundationUnconnectedArticleFiltersCannotPretendToFilter', async () => {
  for (const route of ['/', '/incidents']) {
    await withShell(route, (host) => {
      const filters = host.querySelector('[aria-label="기사 필터"]');
      assert(filters);
      for (const label of ['기간', '카테고리', '상태']) {
        const button = Array.from(
          filters.querySelectorAll<HTMLButtonElement>('button'),
        ).find((candidate) => candidate.textContent?.trim().startsWith(label));
        assert(button);
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('title')).toContain('준비 중');
      }
      expect(host.querySelector('main')?.textContent).toContain('기능 내용');
    });
  }
  await withShell('/search', (host) => {
    expect(host.querySelector('[aria-label="기사 필터"]')).toBeNull();
  });
});
```

## 검증 규칙

기존 22개 파일·97개 테스트, mock, fixture, AGENTS.md의 전체 Test/Format/Lint 명령을 유지한다. 이 네 테스트의 정확한 본문·헤더·대상 경로를 승인받은 후 baseline을 만든다. 색·CSS 클래스 문자열을 단위 테스트로 고정하는 대신 브라우저의 실측·스크린샷과 Figma를 비교한다. 폰트 로드·원본 아이콘 파일·짧은 화면 레이아웃은 spec의 실제 브라우저 검증을 필수로 수행한다.
