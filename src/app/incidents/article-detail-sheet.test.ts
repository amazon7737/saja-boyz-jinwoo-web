// file: src/app/incidents/article-detail-sheet.test.ts
// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DetailPage from './[id]/page';

vi.mock('next/navigation', () => ({
  usePathname: () => null,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

test('articleDetailServerPagePreservesDiscovery', async () => {
  const id = 'd'.repeat(64);
  const article = {
    title: '마포구 <b>화재</b> 후속 보도',
    description: '서교동 화재 관련 보도를 확인할 수 있습니다.',
    pubDate: '2026-10-22T21:20:00+09:00',
    originallink: 'https://publisher.example.invalid/report',
    link: 'https://portal.example.invalid/report',
  };
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        article_id: id,
        article,
        image_status: 'disabled',
        image_url: null,
      }),
    ),
  );
  try {
    const tree = await DetailPage({ params: Promise.resolve({ id }) });
    const view = document.createElement('div');
    view.innerHTML = renderToStaticMarkup(tree);
    const sheet = view.querySelector('[data-article-inline]');
    expect(sheet, '직접 접속은 전체 상세 페이지로 표시').not.toBeNull();
    expect(view.querySelector('[role="dialog"]')).toBeNull();
    const title = sheet?.querySelector('h1');
    expect(title?.textContent).toBe('마포구 화재 후속 보도');
    expect(title?.id).toBeTruthy();
    expect(sheet?.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(sheet?.textContent).toContain(article.description);
    expect(sheet?.querySelector('time')?.dateTime).toBe(
      '2026-10-22T12:20:00.000Z',
    );
    const source = sheet?.querySelector(
      'a[href="https://publisher.example.invalid/report"]',
    );
    expect(source?.getAttribute('target')).toBe('_blank');
    expect(source?.getAttribute('rel')).toContain('noopener');
    expect(sheet?.querySelector('button')).not.toBeNull();
    expect(sheet?.textContent).toContain('공유');
    expect(
      view.querySelector('script[type="application/ld+json"]')?.textContent,
    ).toContain(`/incidents/${id}`);
    expect(view.textContent).not.toMatch(/타임라인|조회수|진행 중|서교동 365/);
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

test('mapPreviewSheetInteractionPreservesBackground', async () => {
  const id = 'd'.repeat(64);
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        article_id: id,
        article: {
          title: '시트 조작 검증 기사',
          description: '검증용 요약',
          pubDate: '2026-10-22T12:20:00Z',
          originallink: 'https://publisher.example.invalid/report',
          link: '',
        },
        image_status: 'disabled',
        image_url: null,
      }),
    ),
  );
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { DetailSheet } =
    await import('@/features/article-detail/ui/detail-sheet/detail-sheet');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const caller = document.createElement('button');
  const container = document.createElement('div');
  document.body.append(caller, container);
  caller.focus();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'auto';
  const root = createRoot(container);
  const onClose = vi.fn();
  try {
    await act(async () => {
      root.render(
        createElement(
          DetailSheet,
          { titleId: 'preview-title', onClose },
          createElement('h1', { id: 'preview-title' }, '시트 조작 검증 기사'),
        ),
      );
    });
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(document.body.style.overflow, '시트가 열리면 배경 스크롤 차단').toBe(
      'hidden',
    );
    expect(
      dialog.contains(document.activeElement),
      '시트 안으로 포커스 이동',
    ).toBe(true);
    const handle = dialog.querySelector<HTMLButtonElement>(
      'button[aria-expanded]',
    );
    expect(handle, '키보드로 접고 펼칠 수 있는 핸들').not.toBeNull();
    expect(handle?.getAttribute('aria-expanded')).toBe('false');
    await act(async () => {
      handle?.click();
    });
    expect(handle?.getAttribute('aria-expanded')).toBe('true');
    await act(async () => {
      handle?.click();
    });
    expect(handle?.getAttribute('aria-expanded')).toBe('false');
    await act(async () => {
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(
      onClose,
      'Escape를 누르면 지도 미리보기를 닫음',
    ).toHaveBeenCalledOnce();
  } finally {
    await act(async () => {
      root.unmount();
    });
    expect(document.body.style.overflow).toBe('auto');
    expect(document.activeElement, '진입한 요소로 포커스 복구').toBe(caller);
    document.body.style.overflow = previousOverflow;
    caller.remove();
    container.remove();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

test('mapPreviewSheetDragKeepsReadingAndShareWithinReach', async () => {
  const id = 'd'.repeat(64);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        article_id: id,
        article: {
          title: '드래그 검증 기사',
          description: '긴 요약 '.repeat(80),
          pubDate: '2026-10-22T12:20:00Z',
          originallink: 'https://publisher.example.invalid/report',
          link: '',
        },
        image_status: 'disabled',
        image_url: null,
      }),
    ),
  );
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { DetailSheet } =
    await import('@/features/article-detail/ui/detail-sheet/detail-sheet');
  const { DetailShare } = await import('./[id]/detail-share');
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          DetailSheet,
          {
            titleId: 'preview-drag-title',
            onClose: vi.fn(),
            footer: createElement(DetailShare, {
              id,
              title: '드래그 검증 기사',
            }),
          },
          createElement('h1', { id: 'preview-drag-title' }, '드래그 검증 기사'),
          createElement('p', null, '긴 요약 '.repeat(80)),
        ),
      ),
    );
    const handle = host.querySelector<HTMLButtonElement>(
      'button[aria-expanded]',
    )!;
    const drag = async (start: number, end: number) => {
      await act(async () => {
        handle.dispatchEvent(
          new MouseEvent('pointerdown', { bubbles: true, clientY: start }),
        );
        handle.dispatchEvent(
          new MouseEvent('pointermove', { bubbles: true, clientY: end }),
        );
        handle.dispatchEvent(
          new MouseEvent('pointerup', { bubbles: true, clientY: end }),
        );
      });
    };
    await drag(100, 220);
    expect(
      handle.getAttribute('aria-expanded'),
      '핸들을 내리면 기본 시트',
    ).toBe('false');
    const dialog = host.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('h1')?.textContent).toBe('드래그 검증 기사');
    const share = [...dialog.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('공유'),
    )!;
    expect(share, '긴 기사에서도 공유 버튼이 사라지지 않음').toBeDefined();
    share.focus();
    await act(async () =>
      share.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }),
      ),
    );
    expect(document.activeElement).toBe(handle);
    await drag(220, 100);
    expect(
      handle.getAttribute('aria-expanded'),
      '핸들을 올리면 확장 시트',
    ).toBe('true');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

test('articleShareAndFallbackStayInTheReadingScrollFlow', async () => {
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { DetailSheet } =
    await import('@/features/article-detail/ui/detail-sheet/detail-sheet');
  const { DetailShare } = await import('./[id]/detail-share');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable')),
    },
  });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          DetailSheet,
          {
            titleId: 'reading-title',
            footer: createElement(DetailShare, {
              id: 'd'.repeat(64),
              title: '읽기 흐름 기사',
            }),
          },
          createElement('h1', { id: 'reading-title' }, '읽기 흐름 기사'),
          createElement(
            'section',
            { 'aria-label': '기사 요약' },
            '긴 본문 '.repeat(100),
          ),
        ),
      ),
    );
    const summary = host.querySelector('section[aria-label="기사 요약"]')!;
    const reading = summary.closest('[data-article-inline]')!;
    const share = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('공유'),
    )!;
    expect(
      reading.contains(share),
      '공유도 본문과 같은 스크롤 영역에 있어야 함',
    ).toBe(true);
    expect(
      share.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_PRECEDING,
      '공유는 본문 뒤에 위치',
    ).toBeTruthy();
    await act(async () => share.click());
    const manual = host.querySelector<HTMLInputElement>(
      'input[aria-label="공유 링크"]',
    )!;
    expect(manual.value).toBe(
      window.location.origin + '/incidents/' + 'd'.repeat(64),
    );
    expect(
      reading.contains(manual),
      '복사 실패 복구도 같은 읽기 영역에서 접근',
    ).toBe(true);
    manual.focus();
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    await act(async () => manual.dispatchEvent(tab));
    expect(tab.defaultPrevented, '상세 페이지는 포커스를 가두지 않음').toBe(
      false,
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});

test('directArticlePageMovesFocusWithoutLockingScroll', async () => {
  const id = 'd'.repeat(64);
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        article_id: id,
        article: {
          title: '직접 접속 기사',
          description: '검증용 요약',
          pubDate: '2026-10-22T12:20:00Z',
          originallink: 'https://publisher.example.invalid/report',
          link: '',
        },
        image_status: 'disabled',
        image_url: null,
      }),
    ),
  );
  const { act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'auto';
  try {
    const tree = await DetailPage({ params: Promise.resolve({ id }) });
    await act(async () => root.render(tree));
    const detail = host.querySelector<HTMLElement>('[data-article-inline]');
    expect(detail).not.toBeNull();
    expect(document.activeElement).toBe(detail);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
    expect(
      detail?.querySelector('a[aria-label="목록으로"]')?.getAttribute('href'),
    ).toBe('/incidents');
    expect(
      detail?.querySelector('a[aria-label="닫기"]')?.getAttribute('href'),
    ).toBe('/');
  } finally {
    await act(async () => root.unmount());
    document.body.style.overflow = previousOverflow;
    host.remove();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

// Add to article-detail-sheet.test.ts. Tests the real server-rendered control
// and the committed asset; it does not depend on a CSS class or /tmp file.
test('detailCloseUsesAccessibleFigmaIcon', async () => {
  const { readFile } = await import('node:fs/promises');
  const { createElement } = await import('react');
  const { DetailInline } =
    await import('@/features/article-detail/ui/detail-sheet/detail-inline');
  const view = document.createElement('div');
  view.innerHTML = renderToStaticMarkup(
    createElement(
      DetailInline,
      { titleId: 'heading' },
      createElement('h1', { id: 'heading' }, '기사 상세'),
    ),
  );
  const link = view.querySelector<HTMLAnchorElement>(
    'nav[aria-label="기사 상세 탐색"] a[aria-label="닫기"]',
  );
  expect(link?.getAttribute('href')).toBe('/');
  const image = link?.querySelector<HTMLImageElement>('img');
  expect(image?.getAttribute('src')).toBe('/article-detail/header-close.svg');
  expect(image?.getAttribute('alt')).toBe('');
  expect(image?.getAttribute('width')).toBe('24');
  expect(image?.getAttribute('height')).toBe('24');

  const svgText = await readFile(
    'public/article-detail/header-close.svg',
    'utf8',
  );
  const svg = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  expect(svg.querySelector('parsererror')).toBeNull();
  expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(svg.documentElement.getAttribute('width')).toBe('24');
  expect(svg.documentElement.getAttribute('height')).toBe('24');
  expect(
    [...svg.querySelectorAll('path')].map((path) => path.getAttribute('d')),
  ).toEqual(['M6 6L18 18', 'M18 6L6 18']);
});
