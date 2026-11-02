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
    expect(container.querySelector('nav[aria-label="주 메뉴"]')).not.toBeNull();
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

test('expandedMapSheetHidesOnlyTheBackgroundSearchHeader', async () => {
  const { DetailSheet } = await import('../detail-sheet/detail-sheet');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
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
    const map = shell.querySelector('main p');
    const handle = host.querySelector<HTMLButtonElement>(
      'button[aria-expanded]',
    )!;
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(
      shell.querySelector('header'),
      '기본 시트에서는 지도 검색 헤더 유지',
    ).not.toBeNull();
    await act(async () => handle.click());
    expect(handle.getAttribute('aria-expanded')).toBe('true');
    expect(
      shell.querySelector('header'),
      '확장 시트 위에 검색 헤더가 비치지 않음',
    ).toBeNull();
    expect(shell.querySelector('main p'), '지도 DOM과 위치는 보존').toBe(map);
    await act(async () => handle.click());
    expect(
      shell.querySelector('header'),
      '접으면 원래 검색 헤더 복원',
    ).not.toBeNull();
    pathname = '/';
    childSegments = [];
    await draw(false);
    expect(shell.querySelector('main p')).toBe(map);
    expect(shell.querySelector('header')).not.toBeNull();
    expect(shell.getAttribute('inert')).toBeNull();
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
    expect(host.querySelector('header')).not.toBeNull();
    expect(host.querySelector('nav[aria-label="주 메뉴"]')).not.toBeNull();
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
