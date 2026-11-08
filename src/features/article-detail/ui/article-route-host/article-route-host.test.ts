// file: src/features/article-detail/ui/article-route-host/article-route-host.test.ts
// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { ArticleRouteHost, useArticleSheetRoute } from './article-route-host';

let pathname = '/search';
let backgroundSegments = ['search'];
let childSegments: string[] = [];
const push = vi.fn();
const back = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSelectedLayoutSegments: (slot?: string) =>
    slot === 'background' ? backgroundSegments : childSegments,
  useRouter: () => ({ push, back, replace, refresh: vi.fn() }),
}));

test('articleSheetRoutesPreserveSource', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const id = 'a'.repeat(64);
  function Background() {
    const [count, setCount] = useState(0);
    const sheet = useArticleSheetRoute();
    return createElement(
      'section',
      { 'aria-label': '검색 결과' },
      createElement('input', { defaultValue: '화재', 'aria-label': '검색어' }),
      createElement(
        'button',
        { onClick: () => setCount(count + 1) },
        '추가 결과 ' + count,
      ),
      createElement(
        'button',
        { onClick: () => sheet?.openArticle(id) },
        '상세 열기',
      ),
    );
  }
  function Detail() {
    const sheet = useArticleSheetRoute();
    return createElement(
      'div',
      { role: 'dialog' },
      createElement('button', { onClick: () => sheet?.close() }, '상세 닫기'),
    );
  }
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const draw = async (opened = false) => {
    await act(async () =>
      root.render(
        createElement(
          ArticleRouteHost,
          {
            background: createElement(Background),
          },
          opened ? createElement(Detail) : null,
        ),
      ),
    );
  };
  try {
    await draw();
    const input = container.querySelector('input')!;
    input.value = '화재 후속';
    await act(async () =>
      container.querySelector<HTMLButtonElement>('section button')!.click(),
    );
    await act(async () =>
      [...container.querySelectorAll('button')]
        .find((b) => b.textContent === '상세 열기')!
        .click(),
    );
    expect(push).toHaveBeenCalledWith('/incidents/' + id, { scroll: false });
    pathname = '/incidents/' + id;
    childSegments = ['(.)incidents', id];
    await draw(true);
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('화재 후속');
    expect(container.querySelector('main')?.textContent).toContain(
      '추가 결과 1',
    );
    const background = input.closest('[inert]');
    expect(
      background,
      '배경은 보존하면서 키보드/포인터 접근 차단',
    ).not.toBeNull();
    expect(
      background?.contains(container.querySelector('[role="dialog"]')),
    ).toBe(false);
    expect(container.querySelector('nav[aria-label="주 메뉴"]')).toBeNull();
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[role="dialog"] button')!
        .click(),
    );
    expect(back).toHaveBeenCalledTimes(1);
    pathname = '/search';
    childSegments = ['search']; // 일반 페이지로 복귀하면 상세 슬롯을 해제한다.
    await draw();
    expect(input.closest('[inert]')).toBeNull();
    expect(input.value).toBe('화재 후속');
    expect(container.querySelector('main')?.textContent).toContain(
      '추가 결과 1',
    );
    backgroundSegments = ['(__SLOT__)', 'incidents'];
    pathname = '/incidents';
    childSegments = ['incidents'];
    await draw();
    expect(container.querySelector('header')).not.toBeNull();
    expect(container.querySelector('[aria-label="기사 필터"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    pathname = '/search';
    backgroundSegments = ['search'];
    childSegments = [];
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  }
});

test('articleSheetLoadingPreservesOpenerFocus', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  pathname = '/incidents';
  backgroundSegments = ['(__SLOT__)', 'incidents'];
  childSegments = [];
  const id = 'a'.repeat(64);
  function Background() {
    return createElement(
      'a',
      {
        href: '/incidents/' + id,
        onClick: (event: { preventDefault(): void }) => event.preventDefault(),
      },
      '읽던 기사',
    );
  }
  function Modal({ stage }: { stage: string }) {
    const sheet = useArticleSheetRoute();
    return createElement(
      'div',
      { role: 'dialog', key: stage, tabIndex: -1 },
      createElement('button', { onClick: () => sheet?.close() }, stage),
    );
  }
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const draw = async (stage?: string) => {
    await act(async () =>
      root.render(
        createElement(
          ArticleRouteHost,
          {
            background: createElement(Background),
          },
          stage ? createElement(Modal, { key: stage, stage }) : null,
        ),
      ),
    );
  };
  try {
    await draw();
    const opener = host.querySelector<HTMLAnchorElement>(
      'main a[href^="/incidents/"]',
    )!;
    opener.focus();
    await act(async () => opener.click());
    pathname = '/incidents/' + id;
    childSegments = ['(.)incidents', id];
    await draw('로딩 중');
    host.querySelector<HTMLElement>('[role="dialog"]')!.focus();
    await draw('기사 본문');
    const close = host.querySelector<HTMLButtonElement>(
      '[role="dialog"] button',
    )!;
    close.focus();
    await act(async () => close.click());
    pathname = '/incidents';
    childSegments = ['incidents'];
    await draw();
    expect(opener.closest('[inert]')).toBeNull();
    expect(
      document.activeElement,
      '로딩 시트가 본문으로 교체되어도 원래 기사 링크로 복귀',
    ).toBe(opener);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    pathname = '/search';
    backgroundSegments = ['search'];
    childSegments = [];
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  }
});

test('mapDetailHidesBackgroundUntilReturningToMap', async () => {
  const { DetailSheet } = await import('../detail-sheet/detail-sheet');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('scrollTo', vi.fn());
  pathname = '/incidents/' + 'b'.repeat(64);
  backgroundSegments = [];
  childSegments = ['(.)incidents', 'b'.repeat(64)];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const background = createElement('p', null, '보존할 지도');
  async function draw(open = true) {
    await act(async () =>
      root.render(
        createElement(
          ArticleRouteHost,
          { background },
          open
            ? createElement(
                DetailSheet,
                { titleId: 'map-detail' },
                createElement('h1', { id: 'map-detail' }, '지도 상세'),
              )
            : null,
        ),
      ),
    );
  }
  try {
    await draw();
    const shell = host.querySelector('[data-article-background]')!;
    const map = Array.from(shell.querySelectorAll('p')).find(
      (element) => element.textContent === '보존할 지도',
    )!;
    expect(map.closest('[hidden]')).not.toBeNull();
    expect(shell.querySelector('header')).toBeNull();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(shell.querySelector('[data-article-inline] h1')?.textContent).toBe(
      '지도 상세',
    );
    pathname = '/';
    childSegments = [];
    await draw(false);
    expect(map.closest('[hidden]')).toBeNull();
    expect(shell.querySelector('main p')).toBe(map);
    expect(shell.querySelector('header')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    pathname = '/search';
    backgroundSegments = ['search'];
    childSegments = [];
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  }
});

test('listArticleDetailReplacesOnlyMainContentWithoutAModalAndRestoresListState', async () => {
  const { DetailSheet } = await import('../detail-sheet/detail-sheet');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('scrollTo', vi.fn());
  pathname = '/incidents';
  backgroundSegments = ['incidents'];
  childSegments = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  function List() {
    const [count, setCount] = useState(1);
    return createElement(
      'section',
      { 'aria-label': '보존할 목록' },
      createElement(
        'button',
        { onClick: () => setCount(count + 1) },
        '더 보기 ' + count,
      ),
      createElement(
        'a',
        {
          href: '/incidents/' + 'a'.repeat(64),
          onClick: (event: { preventDefault(): void }) =>
            event.preventDefault(),
        },
        '선택 기사',
      ),
    );
  }
  async function draw(open = false) {
    await act(async () =>
      root.render(
        createElement(
          ArticleRouteHost,
          { background: createElement(List) },
          open
            ? createElement(
                DetailSheet,
                { titleId: 'inline-heading' },
                createElement('h1', { id: 'inline-heading' }, '선택 기사 상세'),
              )
            : null,
        ),
      ),
    );
  }
  try {
    await draw();
    await act(async () =>
      host.querySelector<HTMLButtonElement>('main button')!.click(),
    );
    const list = host.querySelector('section[aria-label="보존할 목록"]');
    const opener = host.querySelector<HTMLAnchorElement>('main a')!;
    opener.focus();
    await act(async () => opener.click());
    pathname = '/incidents/' + 'a'.repeat(64);
    childSegments = ['(.)incidents', 'a'.repeat(64)];
    await draw(true);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    const detail = host.querySelector('[data-article-inline]');
    expect(detail).not.toBeNull();
    expect(host.querySelector('main')?.contains(detail)).toBe(true);
    expect(
      host.querySelector('[data-article-background]')?.getAttribute('inert'),
    ).toBeNull();
    expect(host.querySelector('header')).toBeNull();
    expect(host.querySelector('nav[aria-label="주 메뉴"]')).toBeNull();
    expect(list?.closest('[hidden]')).not.toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
    const backControl = detail?.querySelector<HTMLAnchorElement>(
      'a[aria-label="목록으로"]',
    );
    expect(backControl).not.toBeNull();
    await act(async () => backControl?.click());
    expect(back).toHaveBeenCalledTimes(1);
    pathname = '/incidents';
    childSegments = ['incidents'];
    await draw();
    expect(host.querySelector('section[aria-label="보존할 목록"]')).toBe(list);
    expect(list?.closest('[hidden]')).toBeNull();
    expect(list?.textContent).toContain('더 보기 2');
    expect(document.activeElement).toBe(opener);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    pathname = '/search';
    backgroundSegments = ['search'];
    childSegments = [];
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  }
});
test('articleDetailReplacesEachSourceAndRestoresItOnBack', async () => {
  const { DetailSheet } = await import('../detail-sheet/detail-sheet');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('scrollTo', vi.fn());
  const id = 'a'.repeat(64);

  try {
    for (const source of ['/', '/search', '/incidents']) {
      pathname = source;
      backgroundSegments = source === '/' ? [] : [source.slice(1)];
      childSegments = [];
      back.mockClear();
      const host = document.createElement('div');
      document.body.append(host);
      const root = createRoot(host);

      function Source() {
        const [value, setValue] = useState(0);
        return createElement(
          'section',
          { 'aria-label': '이전 화면' },
          createElement(
            'button',
            { onClick: () => setValue((current) => current + 1) },
            '유지할 상태 ' + value,
          ),
          createElement(
            'a',
            {
              href: '/incidents/' + id,
              onClick: (event: { preventDefault(): void }) =>
                event.preventDefault(),
            },
            '기사 자세히 보기',
          ),
        );
      }

      async function draw(open: boolean) {
        await act(async () =>
          root.render(
            createElement(
              ArticleRouteHost,
              { background: createElement(Source) },
              open
                ? createElement(
                    DetailSheet,
                    { titleId: 'detail-heading' },
                    createElement('h1', { id: 'detail-heading' }, '기사 상세'),
                  )
                : null,
            ),
          ),
        );
      }

      try {
        await draw(false);
        await act(async () =>
          host.querySelector<HTMLButtonElement>('main button')!.click(),
        );
        const previous = host.querySelector('section[aria-label="이전 화면"]')!;
        const opener = previous.querySelector<HTMLAnchorElement>('a')!;
        opener.focus();
        await act(async () => opener.click());
        pathname = '/incidents/' + id;
        childSegments = ['(.)incidents', id];
        await draw(true);

        const detail = host.querySelector('[data-article-inline]');
        expect(detail, source).not.toBeNull();
        expect(host.querySelector('main')?.contains(detail), source).toBe(true);
        expect(host.querySelector('[role="dialog"]'), source).toBeNull();
        expect(previous.closest('[hidden]'), source).not.toBeNull();
        expect(document.body.style.overflow, source).not.toBe('hidden');

        const returnLink = detail?.querySelector<HTMLAnchorElement>(
          'nav[aria-label="기사 상세 탐색"] a',
        );
        expect(returnLink?.getAttribute('href'), source).toBe(source);
        await act(async () => returnLink?.click());
        expect(back, source).toHaveBeenCalledTimes(1);

        pathname = source;
        childSegments = source === '/' ? [] : [source.slice(1)];
        await draw(false);
        expect(host.querySelector('section[aria-label="이전 화면"]')).toBe(
          previous,
        );
        expect(previous.closest('[hidden]')).toBeNull();
        expect(previous.textContent).toContain('유지할 상태 1');
        expect(document.activeElement).toBe(opener);
      } finally {
        await act(async () => root.unmount());
        host.remove();
      }
    }
  } finally {
    pathname = '/search';
    backgroundSegments = ['search'];
    childSegments = [];
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  }
});
