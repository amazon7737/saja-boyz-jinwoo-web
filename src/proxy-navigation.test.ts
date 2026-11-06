// file: src/proxy-navigation.test.ts
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';

const execute = promisify(execFile);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}

async function stop(child?: ChildProcess) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, wait(2000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

async function ready(origin: string, app: ChildProcess, output: () => string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(output());
    try {
      const response = await fetch(origin + '/incidents', {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Only wait for the test-owned production server.
    }
    await wait(100);
  }
  throw new Error('Next server did not start: ' + output());
}

const id = 'a'.repeat(64);
const missingId = 'f'.repeat(64);
const article = {
  article_id: id,
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '검증용 RSC 이동 기사',
    description: '실제 사건이 아닌 내부 이동 검증용 기사입니다.',
    pubDate: '2026-10-24T00:00:00Z',
    originallink: 'https://publisher.example.invalid/rsc-test',
    link: '',
  },
};
let holdMap = false;
let mapArticlesFixture: unknown = { total: 0, items: [] };
let holdDetails = false;
let failDetail = false;
let failAfterDetailRequest = Number.POSITIVE_INFINITY;
let largePrivateDetail = false;
let detailDelay = 0;
let imageEnabled = false;
function presentArticle(item: typeof article) {
  return imageEnabled
    ? {
        ...item,
        image_status: 'ready',
        image_url: '/images/' + item.article_id + '.jpg',
      }
    : item;
}
const waitingMap: ServerResponse[] = [];
const waitingDetails: ServerResponse[] = [];
let unavailable = false;
let listArticles = [article];
const newsOffsets: number[] = [];
const detailRequests: number[] = [];
const api = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://fixture.invalid');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (/^\/images\/[a-f0-9]{64}\.jpg$/.test(url.pathname)) {
    response.setHeader('Content-Type', 'image/svg+xml');
    response.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#dae6ee"/></svg>',
    );
    return;
  }
  if (url.pathname === '/map/articles') {
    if (holdMap) waitingMap.push(response);
    else response.end(JSON.stringify(mapArticlesFixture));
    return;
  }
  if (url.pathname === '/news') {
    const offset = Number(url.searchParams.get('offset') ?? 0);
    if (url.searchParams.get('keyword') === '재검색') newsOffsets.push(offset);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    response.end(
      JSON.stringify({
        total: listArticles.length,
        items: listArticles.slice(offset, offset + limit).map(presentArticle),
      }),
    );
    return;
  }
  if (url.pathname === '/news/' + id) {
    detailRequests.push(Date.now());
    // Leave this response pending until the app's actual fetch timeout aborts.
    if (unavailable) return;
    if (holdDetails) {
      waitingDetails.push(response);
      return;
    }
    if (failDetail || detailRequests.length > failAfterDetailRequest) {
      response.writeHead(503).end('{"error":"QA_PRIVATE_DETAIL"}');
      return;
    }
    if (largePrivateDetail) {
      response.end(
        JSON.stringify({
          ...article,
          secret: 'PRIVATE_UNEXPECTED_FIELD',
          article: {
            ...article.article,
            description: '가'.repeat(180_000) + '끝표식',
            private: 'PRIVATE_NESTED_FIELD',
          },
        }),
      );
      return;
    }
    if (detailDelay)
      setTimeout(
        () => response.end(JSON.stringify(presentArticle(article))),
        detailDelay,
      );
    else response.end(JSON.stringify(presentArticle(article)));
    return;
  }
  const item = listArticles.find(
    (item) => url.pathname === '/news/' + item.article_id,
  );
  if (item) {
    response.end(JSON.stringify(item));
    return;
  }
  response.writeHead(404).end('{}');
});

let directory: string | undefined;
let app: ChildProcess | undefined;
let browser: Browser | undefined;
let origin = '';
const contexts: BrowserContext[] = [];

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'proxy-navigation-test-'));
  const apiPort = await listen(api);
  const reservation = createServer();
  const appPort = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  for (const name of [
    'src',
    'public',
    'package.json',
    'next.config.ts',
    'postcss.config.mjs',
    'tsconfig.json',
  ]) {
    await cp(join(process.cwd(), name), join(directory, name), {
      recursive: true,
    });
  }
  await symlink(
    join(process.cwd(), 'node_modules'),
    join(directory, 'node_modules'),
    'junction',
  );
  // The temporary app exposes the actual shared sheet as a preview fixture.
  const sheetFixture = join(directory, 'src/app/sheet-test-fixture');
  await mkdir(sheetFixture, { recursive: true });
  await writeFile(
    join(sheetFixture, 'page.tsx'),
    `import { SheetFixture, type FixtureArticle } from './sheet-fixture';
export const dynamic = 'force-dynamic';
export default async function FixturePage() {
  const id = 'a'.repeat(64);
  const base = process.env.NEWS_API_BASE_URL!;
  const response = await fetch(new URL('/news/' + id, base), { cache: 'no-store' });
  const item = response.ok ? ((await response.json()) as FixtureArticle) : null;
  return <SheetFixture item={item} id={id} apiOrigin={base} />;
}
`,
  );
  await writeFile(
    join(sheetFixture, 'sheet-fixture.tsx'),
    `"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DetailSheet } from '@/features/article-detail/ui/detail-sheet/detail-sheet';
import { DetailImage } from '@/app/incidents/[id]/detail-image';
import { DetailShare } from '@/app/incidents/[id]/detail-share';
import { DetailRetry } from '@/features/article-detail/ui/detail-retry/detail-retry';
import { Notice } from '@/components/feedback/notice';
export type FixtureArticle = {
  image_status: string;
  image_url: string | null;
  article: { title: string; description: string };
};
export function SheetFixture({ item, id, apiOrigin }: { item: FixtureArticle | null; id: string; apiOrigin: string }) {
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const imageUrl = item?.image_status === 'ready' && item.image_url === '/images/' + id + '.jpg'
    ? new URL(item.image_url, apiOrigin).href : null;
  return <>
    <div data-article-background="">지도 배경 fixture</div>
    {mounted && open && createPortal(<DetailSheet titleId={item ? 'fixture-title' : 'article-detail-error'} onClose={() => setOpen(false)} footer={item ? <DetailShare id={id} title={item.article.title} /> : undefined}>
      {item ? <>
        <h1 id="fixture-title" className="m-0 text-sm">{item.article.title}</h1>
        {imageUrl && <DetailImage src={imageUrl} />}
        <p className="m-0">{item.article.description}</p>
      </> : <>
        <span id="article-detail-error" className="sr-only">기사 상세 오류</span>
        <Notice role="alert" title="이 소식을 다시 열어볼까요?" action={<DetailRetry id={id} />}>
          <p className="mt-0 font-bold">기사를 불러오지 못했어요</p>
          <p>연결을 확인한 뒤 다시 눌러주세요.</p>
        </Notice>
      </>}
    </DetailSheet>, document.body)}
  </>;
}
`,
  );
  const env = {
    ...process.env,
    NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: 'local-loading-test',
    NEXT_PUBLIC_REPORT_API_BASE_URL: 'https://reports.example.test',
  };
  const next = join(process.cwd(), 'node_modules/next/dist/bin/next');
  await execute(process.execPath, [next, 'build', '--webpack'], {
    cwd: directory,
    env,
    timeout: 90000,
    maxBuffer: 8 * 1024 * 1024,
  }).catch((error: Error & { stdout?: string; stderr?: string }) => {
    console.error(error.stdout, error.stderr);
    throw error;
  });
  app = spawn(process.execPath, [next, 'start', '--port', String(appPort)], {
    cwd: directory,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  app.stdout?.on('data', (chunk) => {
    output += String(chunk);
  });
  app.stderr?.on('data', (chunk) => {
    output += String(chunk);
  });
  origin = 'http://localhost:' + appPort;
  await ready(origin, app, () => output);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
}, 120000);

afterEach(async () => {
  for (const context of contexts.splice(0)) await context.close();
});

afterAll(async () => {
  for (const context of contexts) await context.close();
  await browser?.close();
  await stop(app);
  api.closeAllConnections();
  await new Promise<void>((resolve) => api.close(() => resolve()));
  if (directory) await rm(directory, { recursive: true, force: true });
}, 120000);

async function openList(width = 393, title = article.article.title) {
  const context = await browser!.newContext({
    viewport: { width, height: 852 },
  });
  contexts.push(context);
  await context.route('**/*', async (route) => {
    const headers = route.request().headers();
    if (headers['next-router-prefetch'] || headers.purpose === 'prefetch') {
      await route.abort();
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  await page.goto(origin + '/incidents');
  await page.getByRole('link', { name: title, exact: true }).waitFor();
  return page;
}

test('realNextLinkNavigationSkipsDocumentProbeAndTimesOutOnlyOnce', async () => {
  try {
    const beforeDocument = detailRequests.length;
    const document = await fetch(origin + '/incidents/' + id);
    await document.text();
    expect(document.status).toBe(200);
    expect
      .soft(
        detailRequests.length - beforeDocument,
        'direct document loads the article once',
      )
      .toBe(1);
    const missing = await fetch(origin + '/incidents/' + missingId);
    const missingHtml = await missing.text();
    expect(missing.status).toBe(404);
    expect(missingHtml).toContain('noindex');

    const normalPage = await openList();
    const normalRequests: { query: string; rsc?: string }[] = [];
    normalPage.on('request', (request) => {
      const url = new URL(request.url());
      if (
        url.pathname === '/incidents/' + id &&
        !request.headers()['next-router-prefetch']
      ) {
        normalRequests.push({ query: url.search, rsc: request.headers().rsc });
      }
    });
    const beforeNormal = detailRequests.length;
    await normalPage
      .getByRole('link', { name: article.article.title, exact: true })
      .click();
    await normalPage
      .locator('[data-article-inline]')
      .getByRole('heading', { level: 1, name: article.article.title })
      .waitFor();
    expect
      .soft(
        normalRequests.some(
          (request) => request.rsc === '1' && /_rsc=/.test(request.query),
        ),
        'the actual NextLink emits an RSC navigation',
      )
      .toBe(true);
    expect
      .soft(
        detailRequests.length - beforeNormal,
        'soft navigation skips the document-only probe',
      )
      .toBe(1);

    const slowPage = await openList();
    unavailable = true;
    const beforeSlow = detailRequests.length;
    const started = Date.now();
    await slowPage
      .getByRole('link', { name: article.article.title, exact: true })
      .click();
    await slowPage
      .locator('[data-article-inline]')
      .getByRole('alert')
      .waitFor({ timeout: 18000 });
    const elapsed = Date.now() - started;
    expect
      .soft(
        detailRequests.length - beforeSlow,
        'unresponsive API is attempted once during soft navigation',
      )
      .toBe(1);
    expect
      .soft(elapsed, 'one actual five-second timeout reaches retry feedback')
      .toBeGreaterThanOrEqual(4500);
    expect
      .soft(elapsed, 'document probe must not add another five-second timeout')
      .toBeLessThan(8500);
    expect(slowPage.url()).toContain('/incidents/' + id);
    expect(
      await slowPage
        .getByRole('link', { name: '다시 시도', exact: true })
        .count(),
    ).toBe(1);
  } finally {
    unavailable = false;
  }
}, 120000);

test('listFocusRemainsVisibleWhileTabbingAndReturningFromDetail', async () => {
  listArticles = [
    article,
    ...Array.from({ length: 13 }, (_, index) => ({
      ...article,
      article_id: (index + 1).toString(16).padStart(64, '0'),
      article: {
        ...article.article,
        title: `포커스 검증 기사 ${index + 1}`,
        originallink: `https://publisher.example.invalid/focus-${index + 1}`,
      },
    })),
  ];
  try {
    for (const width of [320, 393, 1440]) {
      const page = await openList(width);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const links = page.locator('article a:visible');
      expect(await links.count()).toBe(28);
      async function visible(index: number, direction: string) {
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        const value = await links.nth(index).evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const shell = element.closest('[data-article-background]')!;
          let header = shell.querySelector<HTMLElement>('header');
          while (header && getComputedStyle(header).position !== 'sticky')
            header = header.parentElement;
          const nav = shell.querySelector('nav[aria-label="주 메뉴"]')!;
          const hit = document.elementFromPoint(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
          );
          return {
            focused: document.activeElement === element,
            top: rect.top,
            bottom: rect.bottom,
            headerBottom: header?.getBoundingClientRect().bottom ?? 0,
            navTop: nav.getBoundingClientRect().top,
            hit: hit === element || element.contains(hit),
          };
        });
        const label = `${width}px ${direction} 기사 링크 ${index}`;
        expect.soft(value.focused, label + ' 실제 키보드 포커스').toBe(true);
        expect
          .soft(value.top, label + ' 헤더 아래 포커스 윤곽')
          .toBeGreaterThanOrEqual(value.headerBottom + 7);
        expect
          .soft(value.bottom, label + ' 하단 메뉴 위 포커스 윤곽')
          .toBeLessThanOrEqual(value.navTop - 7);
        expect
          .soft(value.hit, label + ' 링크가 다른 요소에 가리지 않음')
          .toBe(true);
      }
      await links.last().focus();
      await visible(27, '시작');
      for (let index = 26; index >= 0; index--) {
        await page.keyboard.press('Shift+Tab');
        await visible(index, 'Shift+Tab');
      }
      for (let index = 1; index < 28; index++) {
        await page.keyboard.press('Tab');
        await visible(index, 'Tab');
      }
      for (let index = 0; index < 3; index++)
        await page.keyboard.press('Shift+Tab');
      const opener = links.nth(24);
      expect(
        await opener.evaluate((element) => element === document.activeElement),
      ).toBe(true);
      const before = await page.evaluate(() => scrollY);
      await page.keyboard.press('Enter');
      await page
        .locator('[data-article-inline]')
        .getByRole('heading', {
          level: 1,
          name: listArticles[12].article.title,
        })
        .waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () => !document.querySelector('[data-article-inline]'),
      );
      expect(new URL(page.url()).pathname).toBe('/incidents');
      await visible(24, '상세 닫기');
      expect(
        Math.abs((await page.evaluate(() => scrollY)) - before),
      ).toBeLessThanOrEqual(2);
      await page.close();
    }
  } finally {
    listArticles = [article];
  }
}, 120000);

test('listFrameKeepsLoadingInlineAndRestoresLoadedPagesAcrossHistory', async () => {
  const saved = listArticles;
  listArticles = [
    ...Array.from({ length: 24 }, (_, index) => ({
      ...article,
      article_id: (index + 1).toString(16).padStart(64, '0'),
      article: { ...article.article, title: '보존할 기사 ' + index },
    })),
    article,
  ];
  const release = () => {
    holdDetails = false;
    for (const response of waitingDetails.splice(0))
      response.end(JSON.stringify(article));
  };
  try {
    const page = await openList(393, listArticles[0].article.title);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.locator('main article').count()).toBe(25);
    const opener = page.getByRole('link', {
      name: article.article.title,
      exact: true,
    });
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    await opener.evaluate((node) => {
      node.setAttribute('data-preserved-opener', 'yes');
    });
    const before = await page.evaluate(() => scrollY);
    holdDetails = true;
    try {
      await opener.click();
      await expect.poll(() => waitingDetails.length).toBeGreaterThan(0);
      const inline = page.locator('main [data-article-inline]');
      await inline.locator('[role="status"][aria-busy="true"]').waitFor();
      expect(await page.getByRole('dialog').count()).toBe(0);
      expect(await page.locator('header').isVisible()).toBe(false);
      expect(
        await page.getByRole('navigation', { name: '주 메뉴' }).isVisible(),
      ).toBe(false);
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
        'hidden',
      );
    } finally {
      release();
    }
    const inline = page.locator('main [data-article-inline]');
    await inline
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await inline.getByRole('link', { name: '목록으로', exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/incidents');
    expect(await page.locator('main article').count()).toBe(25);
    expect(await opener.getAttribute('data-preserved-opener')).toBe('yes');
    expect(
      await opener.evaluate((node) => node === document.activeElement),
    ).toBe(true);
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before),
    ).toBeLessThanOrEqual(2);
    await page.goForward();
    await inline
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    expect(await page.getByRole('dialog').count()).toBe(0);
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/incidents');
    expect(await page.locator('main article').count()).toBe(25);
  } finally {
    release();
    listArticles = saved;
  }
}, 60000);

test('searchAlignmentPreservesFullTargetsAndWorkingControls', async () => {
  const page = await openList();
  await page.evaluate(() =>
    localStorage.setItem(
      'hh:recent-searches:v1',
      JSON.stringify([
        '서울 소방서',
        '서교동 화재',
        '실시간 강남역',
        '싱크홀 경보',
      ]),
    ),
  );
  await page.goto(origin + '/search');
  await page.getByRole('link', { name: '서울 소방서', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const sizes = await page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect().toJSON();
    const form = document.querySelector('form[action="/search"]')!;
    const row = document.querySelector('section[aria-label="최근 검색"] li')!;
    const remove = row.querySelector('button')!;
    return {
      form: box(form),
      submit: box(form.querySelector('button[type="submit"]')!),
      searchIcon: box(form.querySelector('button[type="submit"] svg')!),
      input: box(form.querySelector('input[name="q"]')!),
      row: box(row),
      clock: box(
        document.querySelector('section[aria-label="최근 검색"] h2 svg')!,
      ),
      remove: box(remove),
      removeGlyph: box(remove.querySelector('span')!),
    };
  });
  expect.soft(sizes.form.height, '시각 검색바44px 유지').toBeCloseTo(44, 0);
  expect.soft(sizes.submit.width, '검색 실제 클릭 영역46px 유지').toBe(46);
  expect.soft(sizes.submit.height).toBe(44);
  expect.soft(sizes.searchIcon.width, '검색 아이콘 24px').toBe(24);
  expect.soft(sizes.searchIcon.height, '검색 아이콘 24px').toBe(24);
  expect
    .soft(
      Math.abs(sizes.input.x - sizes.form.x - 47.5),
      'Figma 입력 시작점 · 테두리 반올림 1px 허용',
    )
    .toBeLessThanOrEqual(1);
  expect
    .soft(sizes.submit.right, '검색 버튼과 입력이 겹치지 않음')
    .toBeLessThanOrEqual(sizes.input.left + 0.5);
  expect.soft(sizes.clock.width, '최근 검색 제목의 시계 크기').toBe(16);
  expect.soft(sizes.remove.width, '최근검색 삭제 타깃32px 유지').toBe(32);
  expect.soft(sizes.remove.height).toBe(32);
  expect
    .soft(
      Math.abs(
        (sizes.removeGlyph.left + sizes.removeGlyph.right) / 2 -
          (sizes.remove.left + sizes.remove.right) / 2,
      ),
      '삭제 아이콘이 조작 영역 가운데 정렬',
    )
    .toBeLessThanOrEqual(1);
  expect.soft(sizes.row.height, '최근 검색 칩 높이32px 유지').toBe(32);
  await page
    .getByRole('button', { name: '서울 소방서 삭제', exact: true })
    .click();
  expect(
    await page.getByRole('link', { name: '서울 소방서', exact: true }).count(),
  ).toBe(0);
  await page.getByRole('searchbox', { name: '기사 키워드 검색' }).fill('검증');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await page.waitForURL(
    (url) => url.pathname === '/search' && url.searchParams.get('q') === '검증',
  );
  await page.getByRole('link', { name: '검색어 초기화', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/search' && !url.search);
  expect(
    await page
      .getByRole('searchbox', { name: '기사 키워드 검색' })
      .inputValue(),
  ).toBe('');
  await page.close();
}, 120000);

test('searchDetailBackLinkKeepsTheOriginalSearchQuery', async () => {
  const page = await openList();
  const keyword = '검증 & 안전';

  try {
    await page.goto(origin + '/search?q=' + encodeURIComponent(keyword));
    const opener = page.getByRole('link', {
      name: article.article.title,
      exact: true,
    });
    await opener.waitFor();
    await opener.focus();
    await page.keyboard.press('Enter');

    const detail = page.locator('[data-article-inline]');
    await detail
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    const backLink = detail
      .getByRole('navigation', { name: '기사 상세 탐색' })
      .locator('a')
      .first();
    const href = await backLink.getAttribute('href');
    expect(href).not.toBeNull();
    const destination = new URL(href!, origin);
    expect(destination.pathname).toBe('/search');
    expect(destination.searchParams.get('q')).toBe(keyword);

    await backLink.click();
    await page.waitForURL(
      (url) =>
        url.pathname === '/search' && url.searchParams.get('q') === keyword,
    );
    await expect
      .poll(() =>
        opener.evaluate((element) => element === document.activeElement),
      )
      .toBe(true);
  } finally {
    await page.close();
  }
}, 120000);

test('detailResponseKeepsKeyboardFocusOnItsBackControl', async () => {
  const releaseDetails = (status: 200 | 503) => {
    holdDetails = false;
    failDetail = status === 503;
    for (const response of waitingDetails.splice(0)) {
      if (!response.destroyed) {
        response
          .writeHead(status)
          .end(
            status === 200
              ? JSON.stringify(article)
              : '{"error":"QA_PRIVATE_DETAIL"}',
          );
      }
    }
  };

  try {
    for (const status of [200, 503] as const) {
      failDetail = false;
      const page = await openList();
      const opener = page.getByRole('link', {
        name: article.article.title,
        exact: true,
      });
      holdDetails = true;
      try {
        await opener.click();
        await expect
          .poll(() => waitingDetails.length, { timeout: 5000 })
          .toBeGreaterThan(0);
        const detail = page.locator('[data-article-inline]');
        await detail
          .locator('[role="status"][aria-busy="true"]')
          .waitFor({ state: 'visible' });
        // 초기 포커스 위치를 명시하고 Tab으로 헤더 제어에 진입한다.
        await detail.focus();
        await page.keyboard.press('Tab');
        const backLink = detail
          .getByRole('navigation', { name: '기사 상세 탐색' })
          .locator('a')
          .first();
        expect(
          await backLink.evaluate((node) => node === document.activeElement),
        ).toBe(true);

        releaseDetails(status);
        if (status === 200) {
          await detail
            .getByRole('heading', { name: article.article.title, exact: true })
            .waitFor();
        } else {
          await detail
            .getByText('기사를 불러오지 못했어요', { exact: true })
            .waitFor();
        }
        // 로딩과 본문의 DOM이 교체되더라도 같은 사용자 제어를 유지해야 한다.
        await expect
          .poll(() =>
            backLink.evaluate((node) => node === document.activeElement),
          )
          .toBe(true);
        await page.keyboard.press('Enter');
        await page.waitForURL((url) => url.pathname === '/incidents');
        await expect
          .poll(() =>
            opener.evaluate((node) => node === document.activeElement),
          )
          .toBe(true);
      } finally {
        releaseDetails(200);
        await page.close();
      }
    }
  } finally {
    releaseDetails(200);
    failDetail = false;
  }
}, 120000);

test('searchResultFocusStaysAboveNavigationAndReturnsToItsOpener', async () => {
  listArticles = [
    article,
    ...Array.from({ length: 13 }, (_, index) => ({
      ...article,
      article_id: (index + 1).toString(16).padStart(64, '0'),
      article: {
        ...article.article,
        title: `검색 포커스 검증 기사 ${index + 1}`,
        originallink: `https://publisher.example.invalid/search-focus-${index + 1}`,
      },
    })),
  ];
  try {
    for (const width of [320, 393, 1440]) {
      const page = await openList(width);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(origin + '/search?q=' + encodeURIComponent('검증'));
      const results = page.getByRole('region', {
        name: '기사 검색 결과',
        exact: true,
      });
      const links = results.locator('article a');
      await links.last().waitFor();
      await page.evaluate(() => document.fonts.ready);
      expect(await links.count()).toBe(28);
      async function visible(index: number, direction: string) {
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        const value = await links.nth(index).evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
          );
          return {
            focused: document.activeElement === element,
            top: rect.top,
            bottom: rect.bottom,
            viewportBottom: window.innerHeight,
            hit: hit === element || element.contains(hit),
          };
        });
        const label = `${width}px 검색 ${direction} 링크 ${index}`;
        expect.soft(value.focused, label + ' 실제 키보드 포커스').toBe(true);
        expect
          .soft(value.top, label + ' 상단 포커스 윤곽')
          .toBeGreaterThanOrEqual(7);
        expect
          .soft(value.bottom, label + ' 화면 하단 위 포커스 윤곽')
          .toBeLessThanOrEqual(value.viewportBottom - 7);
        expect
          .soft(value.hit, label + ' 링크 중앙이 다른 요소에 가리지 않음')
          .toBe(true);
      }
      await links.first().focus();
      await visible(0, '시작');
      for (let index = 1; index < 28; index++) {
        await page.keyboard.press('Tab');
        await visible(index, 'Tab');
      }
      for (let index = 26; index >= 24; index--) {
        await page.keyboard.press('Shift+Tab');
        await visible(index, 'Shift+Tab');
      }
      const before = await page.evaluate(() => scrollY);
      await page.keyboard.press('Enter');
      await page
        .locator('[data-article-inline]')
        .getByRole('heading', {
          level: 1,
          name: listArticles[12].article.title,
        })
        .waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () => !document.querySelector('[data-article-inline]'),
      );
      const returned = new URL(page.url());
      expect(returned.pathname).toBe('/search');
      expect(returned.searchParams.get('q')).toBe('검증');
      await visible(24, '상세 닫기');
      expect(
        Math.abs((await page.evaluate(() => scrollY)) - before),
      ).toBeLessThanOrEqual(2);
      for (let index = 23; index >= 0; index--) {
        await page.keyboard.press('Shift+Tab');
        await visible(index, 'Shift+Tab');
      }
      await page.close();
    }
  } finally {
    listArticles = [article];
  }
}, 120000);

test('inlineIconsPreserveSpacingAndAccessibleControls', async () => {
  const page = await openList();
  await page.goto(origin + '/archive');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .getByRole('link', { name: article.article.title, exact: true })
    .click();
  const dialog = page.locator('[data-article-inline]');
  await dialog
    .getByRole('heading', { level: 1, name: article.article.title })
    .waitFor();
  expect(await page.getByRole('dialog').count()).toBe(0);
  async function checkRow(
    element: import('playwright-core').Locator,
    label: string,
    size: number,
    gap: number,
    trailing = false,
  ) {
    const actual = await element.evaluate(
      (element, { label, trailing }) => {
        const icon = element.querySelector('[aria-hidden="true"]')!;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        let text: Node | undefined;
        while ((node = walker.nextNode())) {
          if (node.textContent?.trim() === label) {
            text = node;
            break;
          }
        }
        if (!text) throw new Error('Missing visible label: ' + label);
        const range = document.createRange();
        range.selectNodeContents(text);
        const a = icon.getBoundingClientRect(),
          b = range.getBoundingClientRect();
        return {
          svg:
            icon.tagName.toLowerCase() === 'svg' ||
            (icon.tagName.toLowerCase() === 'img' &&
              icon.getAttribute('src') === '/figma/preview-date.svg'),
          width: a.width,
          height: a.height,
          gap: trailing ? a.left - b.right : b.left - a.right,
          centerDelta: Math.abs((a.top + a.bottom - b.top - b.bottom) / 2),
          shrink: getComputedStyle(icon).flexShrink,
          hidden: icon.getAttribute('aria-hidden'),
          focusable:
            icon instanceof HTMLImageElement && icon.tabIndex < 0
              ? 'false'
              : icon.getAttribute('focusable'),
        };
      },
      { label, trailing },
    );
    expect.soft(actual.svg, label + ' OS 글꼴에 의존하지 않는 SVG').toBe(true);
    expect.soft(actual.width, label + ' 고정 너비').toBe(size);
    expect.soft(actual.height, label + ' 고정 높이').toBe(size);
    expect
      .soft(actual.gap, label + ' 아이콘과 실제 글자 간격')
      .toBeCloseTo(gap, 0);
    expect
      .soft(actual.centerDelta, label + ' 시각 중앙 정렬')
      .toBeLessThanOrEqual(1.5);
    expect.soft(actual.shrink).toBe('0');
    expect.soft(actual.hidden).toBe('true');
    expect.soft(actual.focusable).toBe('false');
  }
  const date = dialog.locator('p:has(time)').first();
  const dateText = (await date.locator('time').textContent())!;
  await checkRow(date, dateText, 16, 4);
  const share = dialog.getByRole('button', {
    name: '기사 공유하기',
    exact: true,
  });
  await checkRow(share, '기사 공유하기', 16, 8);
  expect((await share.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  const source = dialog.getByRole('link', {
    name: '기사 원문 · publisher.example.invalid',
    exact: true,
  });
  await checkRow(source, 'publisher.example.invalid', 12, 6, true);
  expect(await source.getAttribute('href')).toBe(article.article.originallink);
  await page.keyboard.press('Escape');
  await page.evaluate(() =>
    localStorage.setItem(
      'hh:recent-searches:v1',
      JSON.stringify(['간격 검증']),
    ),
  );
  await page.goto(origin + '/search');
  const recentHeading = page
    .getByRole('region', { name: '최근 검색', exact: true })
    .getByRole('heading', { name: '최근 검색', exact: true });
  await checkRow(recentHeading, '최근 검색', 16, 4);
  expect(
    await page.getByRole('link', { name: '간격 검증', exact: true }).count(),
  ).toBe(1);
  expect(
    (await page
      .getByRole('button', { name: '간격 검증 삭제', exact: true })
      .boundingBox())!.width,
  ).toBe(32);
  await page.goto(origin + '/report');
  const input = page.getByRole('textbox', { name: '발생 위치', exact: true });
  const field = await input.evaluate((input) => {
    const icon = input.parentElement!.querySelector('[aria-hidden="true"]')!;
    const a = icon.getBoundingClientRect(),
      b = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    return {
      svg: icon.tagName.toLowerCase() === 'svg',
      width: a.width,
      height: a.height,
      gap:
        b.left +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.paddingLeft) -
        a.right,
      centerDelta: Math.abs((a.top + a.bottom - b.top - b.bottom) / 2),
    };
  });
  expect.soft(field.svg, '제보 위치도 동일 SVG').toBe(true);
  expect.soft(field.width).toBe(14);
  expect.soft(field.height).toBe(14);
  expect.soft(field.gap).toBeGreaterThanOrEqual(6);
  expect.soft(field.gap).toBeLessThanOrEqual(8);
  expect.soft(field.centerDelta).toBeLessThanOrEqual(0.5);
  await page.close();
}, 120000);

test('rasterFaviconsAreAdvertisedAndDecodeInChrome', async () => {
  const context = await browser!.newContext({
    viewport: { width: 393, height: 852 },
  });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(origin + '/incidents');
  const pngTag = await page.locator('link[rel="icon"]').evaluateAll((links) =>
    links
      .map((link) => ({
        href: link.getAttribute('href'),
        type: link.getAttribute('type'),
        sizes: link.getAttribute('sizes'),
      }))
      .find((link) => link.href?.startsWith('/icon.png')),
  );
  expect.soft(pngTag, '검색용 PNG 파비콘도 head에 제공').toBeDefined();
  if (pngTag) {
    expect(pngTag.type).toBe('image/png');
    expect(pngTag.sizes).toBe('96x96');
  }
  const images = await page.evaluate(async () =>
    Promise.all(
      ['/favicon.ico', '/icon.png', '/icon.svg', '/apple-icon.png'].map(
        async (url) => {
          const image = new Image();
          image.src = url;
          try {
            await image.decode();
            return {
              url,
              decoded: true,
              width: image.naturalWidth,
              height: image.naturalHeight,
            };
          } catch {
            return {
              url,
              decoded: false,
              width: image.naturalWidth,
              height: image.naturalHeight,
            };
          }
        },
      ),
    ),
  );
  for (const image of images) {
    expect.soft(image.decoded, image.url + ' Chrome 실제 디코딩').toBe(true);
    expect
      .soft(image.width, image.url + ' 보이는 이미지 너비')
      .toBeGreaterThan(0);
    expect.soft(image.height).toBe(image.width);
  }
  expect
    .soft(images.find((image) => image.url === '/icon.png')?.width)
    .toBe(96);
  await page.close();
}, 120000);

test('serverLoadingBoundariesKeepMapFrameAndStandaloneArticleSeoAccessible', async () => {
  const page = await openList();
  const releaseMap = () => {
    holdMap = false;
    for (const response of waitingMap.splice(0))
      response.end(JSON.stringify({ total: 0, items: [] }));
  };
  const releaseDetails = () => {
    holdDetails = false;
    for (const response of waitingDetails.splice(0))
      response.end(JSON.stringify(article));
  };
  try {
    holdMap = true;
    const navigation = page.goto(origin + '/', {
      waitUntil: 'domcontentloaded',
    });
    try {
      await expect
        .poll(() => waitingMap.length, { timeout: 5000 })
        .toBeGreaterThan(0);
      const loading = page.locator('[data-map-loading]');
      await loading.waitFor({ timeout: 1500 }).catch(() => {});
      expect
        .soft(await loading.isVisible(), '기사 서버 대기 중 첫 지도 스켈레톤')
        .toBe(true);
      if (await loading.isVisible()) {
        expect
          .soft(
            await loading.evaluate(
              (node) => node.getBoundingClientRect().height,
            ),
          )
          .toBe(852);
        expect
          .soft(
            await loading.locator('[role="status"][aria-busy="true"]').count(),
          )
          .toBe(1);
      }
    } finally {
      releaseMap();
      await navigation;
    }
    await page.locator('[aria-label="주변 지도"] > .h-dvh').waitFor();
    expect
      .soft(await page.locator('[data-map-loading]').isVisible())
      .toBe(false);

    await page.goto(origin + '/archive');
    const opener = page.getByRole('link', {
      name: article.article.title,
      exact: true,
    });
    await opener.waitFor();
    holdDetails = true;
    try {
      await opener.click();
      await expect
        .poll(() => waitingDetails.length, { timeout: 5000 })
        .toBeGreaterThan(0);
      const loading = page
        .locator('[data-article-inline]')
        .locator('[role="status"][aria-busy="true"]');
      await loading.waitFor({ timeout: 1500 }).catch(() => {});
      expect
        .soft(
          await loading.isVisible(),
          '기사 주소로 내부 이동할 때 상세 스켈레톤',
        )
        .toBe(true);
    } finally {
      releaseDetails();
    }
    await page
      .getByRole('heading', { level: 1, name: article.article.title })
      .waitFor();

    const noJsContext = await browser!.newContext({
      javaScriptEnabled: false,
      viewport: { width: 393, height: 852 },
    });
    contexts.push(noJsContext);
    const noJs = await noJsContext.newPage();
    detailDelay = 250;
    const response = await noJs.goto(origin + '/incidents/' + id);
    expect.soft(response?.status()).toBe(200);
    expect
      .soft(
        await noJs
          .getByRole('heading', { level: 1, name: article.article.title })
          .isVisible(),
        'NoJS 제목 가시성',
      )
      .toBe(true);
    expect
      .soft(
        await noJs
          .getByText(article.article.description, { exact: true })
          .isVisible(),
        'NoJS 요약 가시성',
      )
      .toBe(true);
    expect
      .soft(
        await noJs
          .locator('a[href="' + article.article.originallink + '"]')
          .isVisible(),
        'NoJS 원문 가시성',
      )
      .toBe(true);
    expect
      .soft(await noJs.locator('link[rel="canonical"]').getAttribute('href'))
      .toBe('https://hyunghyung.vercel.app/incidents/' + id);
    expect
      .soft(
        await noJs.locator('meta[property="og:title"]').getAttribute('content'),
      )
      .toContain(article.article.title);
    expect
      .soft(
        (await noJs.locator('meta[name="robots"]').getAttribute('content')) ??
          '',
      )
      .not.toContain('noindex');
    const jsonLd = await noJs
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect
      .soft(jsonLd.some((text) => text.includes(article.article.title)))
      .toBe(true);

    const missing = await noJs.goto(origin + '/incidents/' + missingId);
    expect.soft(missing?.status(), '없는 기사 실제404').toBe(404);
    expect
      .soft(
        await noJs
          .getByRole('heading', { name: '페이지를 찾을 수 없어요' })
          .isVisible(),
      )
      .toBe(true);
    expect
      .soft(await noJs.locator('meta[name="robots"]').getAttribute('content'))
      .toContain('noindex');
    expect
      .soft(
        await noJs
          .getByRole('link', { name: '지도 홈', exact: true })
          .isVisible(),
      )
      .toBe(true);
    const head = await fetch(origin + '/incidents/' + missingId, {
      method: 'HEAD',
    });
    expect.soft(head.status).toBe(404);
  } finally {
    releaseMap();
    releaseDetails();
    detailDelay = 0;
  }
}, 90000);

test('searchSubmissionsAndDetailRetriesExposePendingWithoutLosingGetOrRecovery', async () => {
  const page = await openList();
  for (const [index, mode] of ['button', 'enter'].entries()) {
    await page.goto(origin + '/search');
    const keyword = index ? '침수 + 통제' : '서울 & 화재';
    const input = page.getByRole('searchbox', { name: '기사 키워드 검색' });
    await input.fill(keyword);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: { rsc?: string; method: string }[] = [];
    await page.route('**/search?**', async (route) => {
      if (route.request().headers()['next-router-prefetch'])
        return route.abort();
      if (new URL(route.request().url()).searchParams.get('q') !== keyword)
        return route.continue();
      requests.push({
        rsc: route.request().headers().rsc,
        method: route.request().method(),
      });
      if (route.request().resourceType() === 'document') return route.abort();
      await gate;
      await route.continue();
    });
    const submitting =
      mode === 'enter'
        ? input.press('Enter')
        : page.getByRole('button', { name: '검색', exact: true }).click();
    try {
      await expect
        .poll(() => requests.length, { timeout: 5000 })
        .toBeGreaterThan(0);
      expect
        .soft(requests[0].rsc, '문서 전체 재요청 대신 검색 transition')
        .toBe('1');
      expect.soft(requests[0].method).toBe('GET');
      if (requests[0].rsc === '1') {
        const feedback = page
          .locator(
            'main [role="status"][aria-busy="true"], button[aria-label="검색"][aria-busy="true"]',
          )
          .first();
        await feedback.waitFor({ timeout: 1500 }).catch(() => {});
        expect
          .soft(await feedback.isVisible(), mode + ' 제출 직후 시각 로딩')
          .toBe(true);
        const recent = page.locator('section[aria-label="최근 검색"]');
        if (await recent.count())
          expect
            .soft(await recent.isVisible(), '대기 중 이전 검색 영역 가림')
            .toBe(false);
        const button = page.getByRole('button', { name: '검색', exact: true });
        if (await button.count())
          await button.evaluate((node) => (node as HTMLButtonElement).click());
        await wait(100);
        expect.soft(requests.length, '대기 중 중복 제출 방지').toBe(1);
      }
    } finally {
      release();
      await submitting.catch(() => {});
      await page.unroute('**/search?**');
    }
    if (requests[0]?.rsc !== '1') continue;
    await page
      .getByRole('heading', { name: '기사 검색 결과', exact: true })
      .waitFor();
    expect.soft(new URL(page.url()).searchParams.get('q')).toBe(keyword);
    expect
      .soft(
        await page
          .getByRole('searchbox', { name: '기사 키워드 검색' })
          .inputValue(),
      )
      .toBe(keyword);
    expect
      .soft(
        await page
          .getByRole('button', { name: '검색', exact: true })
          .getAttribute('aria-busy'),
      )
      .not.toBe('true');
  }

  const noJsContext = await browser!.newContext({ javaScriptEnabled: false });
  contexts.push(noJsContext);
  const noJs = await noJsContext.newPage();
  await noJs.goto(origin + '/search');
  await noJs.getByRole('searchbox').fill('서울 & 안전');
  await Promise.all([
    noJs.waitForURL(
      (url) =>
        url.pathname === '/search' &&
        url.searchParams.get('q') === '서울 & 안전',
    ),
    noJs.getByRole('button', { name: '검색', exact: true }).click(),
  ]);
  expect
    .soft(
      await noJs
        .getByRole('heading', { name: '기사 검색 결과', exact: true })
        .isVisible(),
      'NoJS 실제GET검색',
    )
    .toBe(true);

  try {
    for (const mode of ['internal', 'direct']) {
      const retryPage = await openList();
      failDetail = true;
      if (mode === 'internal')
        await retryPage
          .getByRole('link', { name: article.article.title, exact: true })
          .click();
      else await retryPage.goto(origin + '/incidents/' + id);
      const directStates: Array<{
        busy: string | null;
        spinnerVisible: boolean;
        duplicateBlocked: boolean;
      }> = [];
      if (mode === 'direct') {
        await retryPage.exposeFunction(
          'observeDocumentRetry',
          (state: (typeof directStates)[number]) => {
            directStates.push(state);
          },
        );
      }
      for (const status of [503, 200]) {
        const retry = retryPage.getByRole('link', {
          name: '다시 시도',
          exact: true,
        });
        await retry.waitFor();
        directStates.length = 0;
        if (mode === 'direct') {
          await retry.evaluate((element) => {
            element.addEventListener(
              'click',
              () => {
                const spinner =
                  element.querySelector<HTMLElement>('[role="status"]');
                const duplicate = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  button: 0,
                });
                const state = {
                  busy: element.getAttribute('aria-busy'),
                  spinnerVisible: Boolean(
                    spinner && !spinner.hidden && spinner.querySelector('svg'),
                  ),
                  duplicateBlocked: !element.dispatchEvent(duplicate),
                };
                void (
                  window as unknown as {
                    observeDocumentRetry: (
                      value: typeof state,
                    ) => Promise<void>;
                  }
                ).observeDocumentRetry(state);
              },
              { once: true },
            );
          });
        }
        holdDetails = true;
        const before = detailRequests.length;
        const retrying = retry.click();
        try {
          await expect
            .poll(() => waitingDetails.length, { timeout: 5000 })
            .toBeGreaterThan(0);
          if (mode === 'direct') {
            await expect
              .poll(() => directStates[0], { timeout: 5000 })
              .toBeDefined();
            expect
              .soft(directStates[0]?.busy, '직접 진입 재시도 대기')
              .toBe('true');
            expect
              .soft(directStates[0]?.spinnerVisible, '직접 진입 재시도 스피너')
              .toBe(true);
            expect
              .soft(
                directStates[0]?.duplicateBlocked,
                '직접 진입 중복 클릭 방지',
              )
              .toBe(true);
          } else {
            expect
              .soft(
                await retry.getAttribute('aria-busy'),
                mode + ' 재시도 대기',
              )
              .toBe('true');
            expect
              .soft(await retry.locator('svg').count(), '재시도 스피너')
              .toBe(1);
            if ((await retry.getAttribute('aria-busy')) === 'true') {
              await retry.evaluate((node) =>
                (node as HTMLAnchorElement).click(),
              );
              await retryPage.keyboard.press('Enter');
            }
          }
          await wait(100);
          expect
            .soft(detailRequests.length - before, '동일 재시도 중복 차단')
            .toBe(1);
        } finally {
          holdDetails = false;
          failDetail = status === 503;
          for (const response of waitingDetails.splice(0)) {
            if (!response.destroyed)
              response
                .writeHead(status)
                .end(
                  status === 200
                    ? JSON.stringify(article)
                    : '{"error":"QA_PRIVATE_DETAIL"}',
                );
          }
          await retrying;
        }
        if (status === 503) {
          await expect
            .poll(() => retry.getAttribute('aria-busy'), { timeout: 5000 })
            .not.toBe('true');
          expect
            .soft(await retry.isVisible(), '재실패 후 다시 시도 유지')
            .toBe(true);
        } else {
          await retryPage
            .getByRole('heading', { name: article.article.title, exact: true })
            .waitFor();
          expect
            .soft(new URL(retryPage.url()).pathname)
            .toBe('/incidents/' + id);
        }
      }
    }
  } finally {
    failDetail = false;
    holdDetails = false;
    for (const response of waitingDetails.splice(0))
      if (!response.destroyed) response.end(JSON.stringify(article));
  }
}, 90000);

test('repeatingTheSameSearchReplacesCardsAndResetsPagination', async () => {
  let phase = '목록 진입';
  const inFlight = new Map<object, string>();
  const saved = listArticles;
  const batch = (prefix: string, size: number, base: number) =>
    Array.from({ length: size }, (_, index) => ({
      ...article,
      article_id: (base + index).toString(16).padStart(64, '0'),
      article: { ...article.article, title: prefix + (index + 1) },
    }));
  try {
    const page = await openList();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(8000);
    page.on('request', (request) =>
      inFlight.set(request, request.method() + ' ' + request.url()),
    );
    page.on('requestfinished', (request) => inFlight.delete(request));
    page.on('requestfailed', (request) => inFlight.delete(request));
    phase = '최초 검색';
    listArticles = batch('이전 검색 기사 ', 41, 50000);
    await page.goto(origin + '/search?q=' + encodeURIComponent('재검색'));
    await expect
      .poll(() => page.locator('main article').count(), { timeout: 5000 })
      .toBe(20);
    phase = '기존 추가 페이지';
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.locator('main article').count(), { timeout: 5000 })
      .toBe(40);

    for (const [index, replacement] of [
      batch('새 검색 기사 ', 23, 60000),
      batch('마지막 검색 기사 ', 3, 70000),
      [],
    ].entries()) {
      phase = '재검색 ' + index + ' 입력 접근';
      listArticles = replacement;
      await page
        .getByRole('searchbox', { name: '기사 키워드 검색' })
        .scrollIntoViewIfNeeded();
      const response = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/search' &&
          response.request().headers().rsc === '1' &&
          !response.request().headers()['next-router-prefetch'],
        { timeout: 8000 },
      );
      phase = '재검색 ' + index + ' 제출';
      if (index)
        await page
          .getByRole('searchbox', { name: '기사 키워드 검색' })
          .press('Enter');
      else
        await page.getByRole('button', { name: '검색', exact: true }).click();
      phase = '재검색 ' + index + ' 응답 헤더';
      expect((await response).status()).toBe(200);
      phase = '재검색 ' + index + ' 결과 교체';
      await expect
        .poll(() =>
          page
            .getByRole('button', { name: '검색', exact: true })
            .getAttribute('aria-busy'),
        )
        .not.toBe('true');
      await expect
        .poll(() => page.locator('main article h2').allTextContents(), {
          message: '같은 검색어도 새 첫 페이지로 교체',
          timeout: 5000,
        })
        .toEqual(replacement.slice(0, 20).map((item) => item.article.title));
      expect
        .soft(await page.getByRole('searchbox').inputValue())
        .toBe('재검색');
      const replaced =
        JSON.stringify(
          await page.locator('main article h2').allTextContents(),
        ) ===
        JSON.stringify(
          replacement.slice(0, 20).map((item) => item.article.title),
        );
      phase = '재검색 ' + index + ' 추가 페이지/종료';
      const requests = newsOffsets.length;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      if (replaced && replacement.length > 20) {
        await expect
          .poll(() => page.locator('main article').count(), { timeout: 5000 })
          .toBe(23);
        expect
          .soft(
            newsOffsets.slice(requests),
            '새 결과의 추가 페이지는 offset20에서 시작',
          )
          .toEqual([20]);
        expect
          .soft(await page.locator('main article h2').allTextContents())
          .toEqual(replacement.map((item) => item.article.title));
      } else {
        await wait(150);
        expect
          .soft(
            newsOffsets.length,
            '새 결과의 total에 맞춰 이전 pagination 종료',
          )
          .toBe(requests);
      }
      if (!replaced) break;
      if (!replacement.length)
        expect
          .soft(
            await page
              .getByText('검색 결과가 없어요', { exact: true })
              .isVisible(),
          )
          .toBe(true);
    }
  } catch (error) {
    throw new Error(
      '재검색 검증 단계: ' +
        phase +
        '\n진행 중 요청: ' +
        JSON.stringify([...inFlight.values()]),
      { cause: error },
    );
  } finally {
    listArticles = saved;
  }
}, 60000);

test('errorSheetTracksSmallDragWithoutCountingScreenReaderOnlyContent', async () => {
  const page = await openList();

  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    failDetail = true;
    await page.goto(origin + '/sheet-test-fixture');
    const dialog = page.getByRole('dialog');
    const handle = dialog.locator('button[aria-expanded]');
    const hiddenHeading = dialog.locator('#article-detail-error');
    await page.getByRole('link', { name: '다시 시도', exact: true }).waitFor();
    expect(
      await hiddenHeading.evaluate(
        (element) => getComputedStyle(element).position,
      ),
      '오류 시트에는 일반 흐름 밖의 접근성 제목이 있음',
    ).toBe('absolute');
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    const start = await dialog.boundingBox();
    const grip = await handle.boundingBox();
    if (!start || !grip)
      throw new Error('오류 시트 또는 핸들의 위치를 읽지 못함');
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    const waitForFrames = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      await waitForFrames();
      const pressed = await dialog.boundingBox();
      if (!pressed) throw new Error('누른 직후 오류 시트의 위치를 읽지 못함');
      expect
        .soft(
          Math.abs(pressed.height - start.height),
          `누르기만 해서는 오류 시트 높이가 바뀌지 않아야 함: 시작 ${start.height}, 누른 후 ${pressed.height}`,
        )
        .toBeLessThan(2);
      await page.mouse.move(x, y - 10, { steps: 2 });
      await waitForFrames();
      const moved = await dialog.boundingBox();
      if (!moved) throw new Error('이동 중 오류 시트의 위치를 읽지 못함');
      expect
        .soft(
          Math.abs(moved.height - (start.height + 10)),
          `오류 시트는 10px 이동만큼 커져야 함: 시작 ${start.height}, 이동 후 ${moved.height}`,
        )
        .toBeLessThan(4);
    } finally {
      await page.mouse.up();
    }
  } finally {
    failDetail = false;
  }
}, 60000);

test('articleSheetStaysInViewportWhenResizedDuringDrag', async () => {
  const savedDescription = article.article.description;

  try {
    article.article.description =
      '회전 중 크기를 확인하는 긴 기사입니다. '.repeat(300);
    const page = await openList();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(origin + '/sheet-test-fixture');

    const dialog = page.getByRole('dialog');
    const handle = dialog.locator('button[aria-expanded]');
    await dialog
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    const grip = await handle.boundingBox();
    if (!grip) throw new Error('핸들의 위치를 읽지 못함');
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    const waitForFrames = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      await page.mouse.move(x, y - 120, { steps: 4 });
      await waitForFrames();
      const before = await dialog.boundingBox();
      if (!before) throw new Error('회전 전 시트의 위치를 읽지 못함');
      expect(
        before.height,
        '가로 화면보다 높은 시트를 드래그 중',
      ).toBeGreaterThan(320);

      await page.setViewportSize({ width: 852, height: 320 });
      await waitForFrames();
      const rotated = await dialog.boundingBox();
      if (!rotated) throw new Error('회전 후 시트의 위치를 읽지 못함');
      expect
        .soft(
          rotated.y,
          `회전 직후 시트 상단이 화면 밖으로 나가면 안 됨: ${rotated.y}`,
        )
        .toBeGreaterThanOrEqual(0);

      await page.mouse.move(x, y - 160, { steps: 4 });
      await waitForFrames();
      const continued = await dialog.boundingBox();
      if (!continued)
        throw new Error('회전 후 이동 중 시트의 위치를 읽지 못함');
      expect
        .soft(
          continued.y,
          `회전 후 계속 드래그해도 상단이 화면 안에 있어야 함: ${continued.y}`,
        )
        .toBeGreaterThanOrEqual(0);
    } finally {
      await page.mouse.up();
    }
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test('articleSheetTracksSmallPointerMovement', async () => {
  const savedDescription = article.article.description;

  try {
    article.article.description = '작은 이동을 확인하는 긴 기사입니다. '.repeat(
      300,
    );
    const page = await openList();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(origin + '/sheet-test-fixture');

    const dialog = page.getByRole('dialog');
    const handle = dialog.locator('button[aria-expanded]');
    await dialog
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });

    const start = await dialog.boundingBox();
    const grip = await handle.boundingBox();
    if (!start || !grip) throw new Error('시트 또는 핸들의 위치를 읽지 못함');
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      const waitForFrames = () =>
        page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
      await waitForFrames();
      const pressed = await dialog.boundingBox();
      if (!pressed) throw new Error('누른 직후 시트의 위치를 읽지 못함');
      const motion = await dialog.evaluate((element) => ({
        transition: getComputedStyle(element).transitionProperty,
        running: element
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
      }));
      expect
        .soft(
          Math.abs(pressed.y - start.y),
          `핸들을 누르기만 해서는 위치가 바뀌지 않아야 함: 시작 ${start.y}, 누른 후 ${pressed.y}, 전환 ${motion.transition}, 동작 중 ${motion.running}`,
        )
        .toBeLessThan(2);

      await page.mouse.move(x, y - 10, { steps: 2 });
      await waitForFrames();
      const moved = await dialog.boundingBox();
      if (!moved) throw new Error('이동 중 시트의 위치를 읽지 못함');
      expect
        .soft(
          Math.abs(moved.y - (start.y - 10)),
          `핸들을 놓기 전 10px 이동에도 시트가 따라와야 함: 시작 ${start.y}, 이동 후 ${moved.y}`,
        )
        .toBeLessThan(4);
    } finally {
      await page.mouse.up();
    }
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test('articleSheetFollowsPointerBeforeRelease', async () => {
  const savedDescription = article.article.description;

  try {
    article.article.description =
      '드래그 검증을 위한 긴 기사 요약입니다. '.repeat(300);
    const page = await openList();
    await page.goto(origin + '/sheet-test-fixture');

    const dialog = page.getByRole('dialog');
    const handle = dialog.locator('button[aria-expanded]');
    await dialog
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });

    const start = await dialog.boundingBox();
    const grip = await handle.boundingBox();
    if (!start || !grip) throw new Error('시트 또는 핸들의 위치를 읽지 못함');
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    const nextFrames = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      await page.mouse.move(x, y - 40, { steps: 4 });
      await nextFrames();
      const first = await dialog.boundingBox();
      if (!first) throw new Error('첫 이동 중 시트의 위치를 읽지 못함');
      expect
        .soft(
          Math.abs(first.y - (start.y - 40)),
          '핸들을 놓기 전 40px 이동에 시트가 따라와야 함',
        )
        .toBeLessThan(8);

      await page.mouse.move(x, y - 80, { steps: 4 });
      await nextFrames();
      const second = await dialog.boundingBox();
      if (!second) throw new Error('두 번째 이동 중 시트의 위치를 읽지 못함');
      expect
        .soft(
          Math.abs(second.y - (start.y - 80)),
          '핸들을 놓기 전 80px 이동에 시트가 따라와야 함',
        )
        .toBeLessThan(8);
    } finally {
      await page.mouse.up();
    }
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test('normalArticleSheetsStartHalfAndDragNearTopWithSheetOnlyAiDisclosure', async () => {
  const savedDescription = article.article.description;
  const openSheetSource = async () => {
    const page = await openList();
    await page.goto(origin + '/archive');
    return page;
  };
  const size = async (page: Awaited<ReturnType<typeof openList>>) => {
    const read = () =>
      page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('[role="dialog"]');
        const reading = panel?.querySelector<HTMLElement>(
          ':scope > [tabindex="0"]',
        );
        if (!panel || !reading || panel.hidden) return null;
        const content = [...reading.children].filter(
          (child) => getComputedStyle(child).display !== 'none',
        );
        const height = panel.getBoundingClientRect().height;
        const readingHeight = reading.getBoundingClientRect().height;
        const natural =
          height -
          readingHeight +
          content.reduce(
            (total, child) => total + child.getBoundingClientRect().height,
            0,
          ) +
          parseFloat(getComputedStyle(reading).rowGap) *
            Math.max(0, content.length - 1);
        if (height <= 0 || !Number.isFinite(natural)) return null;
        return {
          height,
          natural,
          readingHeight,
          scrollHeight: reading.scrollHeight,
          bottom: panel.getBoundingClientRect().bottom,
          viewport: innerHeight,
        };
      });
    let geometry = await read();
    await expect
      .poll(
        async () => {
          geometry = await read();
          return geometry;
        },
        { timeout: 5000 },
      )
      .not.toBeNull();
    if (!geometry) throw new Error('연결된 시트 치수가 없음');
    return geometry;
  };
  try {
    for (const entry of ['archive', 'search', 'direct', 'nojs']) {
      const heights: number[] = [];
      for (const description of [
        '짧은 기사 요약입니다.',
        '동네 소식과 안전 안내를 확인해 주세요. '.repeat(120),
      ]) {
        article.article.description = description;
        const page =
          entry === 'nojs'
            ? await (async () => {
                const context = await browser!.newContext({
                  javaScriptEnabled: false,
                  viewport: { width: 393, height: 852 },
                });
                contexts.push(context);
                return context.newPage();
              })()
            : await openSheetSource();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        if (entry === 'search')
          await page.goto(origin + '/search?q=' + encodeURIComponent('검증'));
        if (entry === 'archive' || entry === 'search')
          await page
            .getByRole('link', { name: article.article.title, exact: true })
            .click();
        else await page.goto(origin + '/incidents/' + id);
        await page
          .getByRole('heading', { name: article.article.title, exact: true })
          .waitFor();
        const detail = page.locator('[data-article-inline]');
        await detail.waitFor({ state: 'visible', timeout: 5000 });
        await detail
          .getByRole('heading', { name: article.article.title, exact: true })
          .waitFor();
        expect
          .soft(
            await page.getByRole('dialog').count(),
            entry + ' 전체 상세 페이지',
          )
          .toBe(0);
        expect
          .soft(await detail.textContent(), entry + ' 기사 본문 유지')
          .toContain(description);
        heights.push(
          await page.evaluate(() => document.documentElement.scrollHeight),
        );
        const context = page.context();
        contexts.splice(contexts.indexOf(context), 1);
        await context.close();
      }
      expect
        .soft(heights[1], entry + ' 본문 길이에 따라 페이지가 늘어남')
        .toBeGreaterThan(heights[0] + 20);
    }

    const sheetHeights: number[] = [];
    for (const description of [
      '짧은 기사 요약입니다.',
      '동네 소식과 안전 안내를 확인해 주세요. '.repeat(10),
    ]) {
      article.article.description = description;
      const page = await openList();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(origin + '/sheet-test-fixture');
      const sheet = page.getByRole('dialog');
      await sheet
        .getByRole('heading', { name: article.article.title, exact: true })
        .waitFor();
      const geometry = await size(page);
      sheetHeights.push(geometry.height);
      expect
        .soft(await sheet.getAttribute('data-expanded'), '미리보기 기본은 접힘')
        .toBe('false');
      expect
        .soft(
          Math.abs(
            geometry.height -
              Math.min(geometry.natural, geometry.viewport * 0.5352),
          ),
          '미리보기는 내용 높이와 절반 상한',
        )
        .toBeLessThan(2);
      expect
        .soft(geometry.bottom, '미리보기는 화면 아래 정렬')
        .toBeCloseTo(geometry.viewport, 0);
      const context = page.context();
      contexts.splice(contexts.indexOf(context), 1);
      await context.close();
    }
    expect
      .soft(sheetHeights[1], '내용이 짧으면 높이가 내용에 맞게 늘어남')
      .toBeGreaterThan(sheetHeights[0] + 20);

    imageEnabled = true;
    article.article.description = '이미지 안내 위치를 확인하는 기사입니다.';
    const images = await openSheetSource();
    const listCard = images.locator('main article').first();
    expect
      .soft(await listCard.locator('img').count(), '목록의 실제 이미지 유지')
      .toBe(1);
    expect
      .soft(
        await listCard.locator('figcaption').count(),
        '목록에는 AI 배지를 표시하지 않음',
      )
      .toBe(0);
    await images
      .getByRole('link', { name: article.article.title, exact: true })
      .click();
    const detail = images.locator('[data-article-inline]');
    await detail
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    const photo = detail.locator('figure img').first();
    await photo.evaluate((element) => (element as HTMLImageElement).decode());
    const caption = detail.locator('figcaption');
    expect
      .soft((await caption.textContent())?.trim(), '상세의 정확한 AI 안내')
      .toBe('AI로 생성된 이미지입니다.');
    const photoBox = await photo.boundingBox(),
      captionBox = await caption.boundingBox();
    expect
      .soft(captionBox?.y ?? -1, 'AI 문구는 이미지 아래')
      .toBeGreaterThanOrEqual((photoBox?.y ?? 0) + (photoBox?.height ?? 0));
    const imageContext = images.context();
    contexts.splice(contexts.indexOf(imageContext), 1);
    await imageContext.close();
    imageEnabled = false;

    article.article.description =
      '긴 본문을 읽고 안전 안내를 확인해 주세요. '.repeat(300);
    const page = await openList();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(origin + '/sheet-test-fixture');
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    const initial = await size(page);
    expect
      .soft(initial.height, '긴 기사도 기본은 절반 상한')
      .toBeCloseTo(initial.viewport * 0.5352, 0);
    expect
      .soft(initial.scrollHeight, '기본 상태에서 긴 본문 내부 스크롤')
      .toBeGreaterThan(initial.readingHeight + 100);
    const drag = async (delta: number) => {
      const box = await dialog.locator('button[aria-expanded]').boundingBox();
      if (!box) throw new Error('실제 드래그할 핸들이 없음');
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + delta, { steps: 6 });
      await page.mouse.up();
    };
    await drag(-120);
    expect
      .soft(await dialog.getAttribute('data-expanded'), '실제 위 드래그로 확장')
      .toBe('true');
    const expanded = await size(page);
    expect
      .soft(expanded.height, '수동 확장은 상단49px를 남김')
      .toBeCloseTo(expanded.viewport - 49, 0);
    const share = dialog.getByRole('button', {
      name: '기사 공유하기',
      exact: true,
    });
    await share.scrollIntoViewIfNeeded();
    expect.soft(await share.isVisible(), '확장 본문 끝 공유 접근').toBe(true);
    await drag(120);
    expect
      .soft(
        await dialog.getAttribute('data-expanded'),
        '실제 아래 드래그로 기본 복귀',
      )
      .toBe('false');
    const folded = await size(page);
    expect.soft(folded.height).toBeCloseTo(folded.viewport * 0.5352, 0);
    await drag(-120);
    await page.setViewportSize({ width: 320, height: 320 });
    const compact = await size(page);
    expect
      .soft(compact.height, '낮은 화면도 상단 여백 유지')
      .toBeCloseTo(compact.viewport - 49, 0);
    expect.soft(compact.readingHeight).toBeGreaterThan(24);
    await share.scrollIntoViewIfNeeded();
    expect.soft(await share.isVisible(), '작은 화면 공유 접근').toBe(true);
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    await expect.poll(() => page.getByRole('dialog').count()).toBe(0);
    expect
      .soft(
        await page
          .locator('[data-article-background]')
          .first()
          .getAttribute('inert'),
      )
      .toBeNull();
  } finally {
    imageEnabled = false;
    article.article.description = savedDescription;
  }
}, 60000);

test('articleSheetClickAndKeyboardAnimateBetweenMeasuredHeights', async () => {
  const savedDescription = article.article.description;
  const page = await openList();
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const [index, description] of [
      '짧은 기사입니다.',
      '긴 기사를 읽어요. '.repeat(300),
    ].entries()) {
      article.article.description = description;
      await page.goto(origin + '/sheet-test-fixture');
      const sheet = page.getByRole('dialog');
      const handle = sheet.locator('button[aria-expanded]');
      await sheet
        .getByRole('heading', { name: article.article.title, exact: true })
        .waitFor();
      await sheet.evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations()
            .map((animation) => animation.finished.catch(() => undefined)),
        );
      });
      const initial = (await sheet.boundingBox())!.height;
      const observe = async (activate: () => Promise<unknown>) => {
        await page.evaluate(() => {
          const element =
            document.querySelector<HTMLElement>('[role="dialog"]')!;
          const button = element.querySelector<HTMLButtonElement>(
            'button[aria-expanded]',
          )!;
          const state = { heights: [] as number[], runs: 0, done: false };
          (window as unknown as { motionState: typeof state }).motionState =
            state;
          element.addEventListener('transitionrun', (event) => {
            if (
              event.target === element &&
              (event as TransitionEvent).propertyName === 'height'
            )
              state.runs++;
          });
          button.addEventListener(
            'click',
            () => {
              const started = performance.now();
              const sample = (time: number) => {
                state.heights.push(element.getBoundingClientRect().height);
                if (time - started < 400) requestAnimationFrame(sample);
                else state.done = true;
              };
              requestAnimationFrame(sample);
            },
            { once: true },
          );
        });
        await activate();
        await page.waitForFunction(
          () =>
            (window as unknown as { motionState: { done: boolean } })
              .motionState?.done,
        );
        return page.evaluate(
          () =>
            (
              window as unknown as {
                motionState: { heights: number[]; runs: number };
              }
            ).motionState,
        );
      };
      const assertMotion = (
        samples: number[],
        from: number,
        to: number,
        label: string,
      ) => {
        const low = Math.min(from, to),
          high = Math.max(from, to);
        expect(high - low, label + '은 실제로 다른 높이').toBeGreaterThan(50);
        expect(
          samples.some((height) => height > low + 2 && height < high - 2),
          label + ' 중간 프레임',
        ).toBe(true);
      };
      await handle.focus();
      const expanding = await observe(() =>
        index === 0 ? handle.click() : page.keyboard.press('Enter'),
      );
      const expanded = (await sheet.boundingBox())!.height;
      expect(expanding.runs, '마우스 확장 높이 전환').toBeGreaterThan(0);
      expect(await sheet.getAttribute('data-expanded')).toBe('true');
      assertMotion(expanding.heights, initial, expanded, '확장');
      expect(expanded).toBeCloseTo(852 - 49, 0);
      await handle.focus();
      const collapsing = await observe(() =>
        index === 0 ? page.keyboard.press('Enter') : handle.click(),
      );
      const collapsed = (await sheet.boundingBox())!.height;
      expect(collapsing.runs, '키보드 접기 높이 전환').toBeGreaterThan(0);
      expect(await sheet.getAttribute('data-expanded')).toBe('false');
      assertMotion(collapsing.heights, expanded, collapsed, '접기');
      expect(
        Math.abs(collapsed - initial),
        '짧은 본문은 원래 내용 높이로',
      ).toBeLessThan(2);
      expect(
        await sheet
          .locator('button[aria-expanded]')
          .evaluate((node) => node === document.activeElement),
      ).toBe(true);
    }
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test('articleSheetToggleKeepsBoundsOnResizeAndRespectsReducedMotion', async () => {
  const page = await openList();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(origin + '/sheet-test-fixture');
  const sheet = page.getByRole('dialog');
  const handle = sheet.locator('button[aria-expanded]');
  await sheet
    .getByRole('heading', { name: article.article.title, exact: true })
    .waitFor();
  await sheet.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await handle.click();
  await page.setViewportSize({ width: 320, height: 320 });
  const waitForFrames = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  await waitForFrames();
  const resized = await sheet.boundingBox();
  expect(resized).not.toBeNull();
  expect(
    resized!.y,
    '확장 중 회전해도 화면 위로 벗어나지 않음',
  ).toBeGreaterThanOrEqual(0);
  expect(
    resized!.height,
    '확장 중 회전해도 화면 높이를 넘지 않음',
  ).toBeLessThanOrEqual(320);
  expect(await sheet.getAttribute('data-expanded')).toBe('true');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await handle.focus();
  await page.keyboard.press('Space');
  await waitForFrames();
  const collapsed = await sheet.boundingBox();
  expect(collapsed).not.toBeNull();
  expect(collapsed!.height, '모션 축소 시 즉시 접힘').toBeLessThanOrEqual(
    320 * 0.5352 + 1,
  );
  expect(await sheet.getAttribute('data-expanded')).toBe('false');
  expect(
    await sheet.evaluate(
      (element) =>
        element
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === 'height',
          ).length,
    ),
    '모션 축소에서는 높이 전환 없음',
  ).toBe(0);
  expect(
    await handle.evaluate((element) => element === document.activeElement),
  ).toBe(true);
  await page.keyboard.press('Enter');
  await waitForFrames();
  const expanded = await sheet.boundingBox();
  expect(expanded!.height, '모션 축소 시 즉시 확장').toBeCloseTo(320 - 49, 0);
  expect(await sheet.getAttribute('data-expanded')).toBe('true');
  expect(
    await sheet.evaluate(
      (element) =>
        element
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === 'height',
          ).length,
    ),
  ).toBe(0);
}, 60000);

test('reportLayoutKeepsControlsReadableAndReachableOnSmallScreens', async () => {
  const context = await browser!.newContext({
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
  });
  contexts.push(context);
  await context.route('https://reports.example.test/reports', (route) => {
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Idempotency-Key, Content-Type',
    };
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers });
    return route.fulfill({
      status: 201,
      headers,
      contentType: 'application/json',
      body: JSON.stringify({
        report_id: 'a'.repeat(32),
        status: 'pending',
        received_at: '2026-10-13T05:00:00Z',
      }),
    });
  });
  const page = await context.newPage();
  await page.goto(origin + '/report');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  const fields = [
    page.getByLabel('카테고리 선택', { exact: true }),
    page.getByLabel('발생 날짜 및 시간 (한국시간)', { exact: true }),
    page.getByLabel('제보 제목', { exact: true }),
    page.getByLabel('발생 위치', { exact: true }),
  ];
  const description = page.getByLabel('상세내용', { exact: true });
  const attachment = page.getByLabel('사진/동영상 첨부', { exact: true });
  const upload = attachment.locator('..');
  const size = async (element: (typeof fields)[number]) =>
    element.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        height: bounds.height,
        radius: Number.parseFloat(style.borderTopLeftRadius),
        border: Number.parseFloat(style.borderTopWidth),
      };
    });

  for (const field of fields) {
    const geometry = await size(field);
    expect(geometry.height).toBeCloseTo(44, 0);
    expect(geometry.radius).toBeCloseTo(12, 0);
    // Chromium can round a half-pixel border according to device scale.
    expect(geometry.border).toBeGreaterThanOrEqual(1);
    expect(geometry.border).toBeLessThanOrEqual(1.5);
  }
  expect((await size(description)).height).toBeCloseTo(100, 0);
  expect((await size(upload)).height).toBeCloseTo(110, 0);
  const plus = upload.locator('[aria-hidden="true"]');
  expect((await plus.textContent())?.trim()).toBe('+');
  expect(
    await plus.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).fontSize),
    ),
  ).toBe(26);

  // A focused control must be inside the visible area and above the sticky
  // submit bar. Inspect the center hit target as well as its bounding box.
  await page.getByRole('link', { name: '제보 닫기' }).focus();
  for (const field of [...fields, description, attachment]) {
    // Native datetime controls may expose several keyboard segments.
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.keyboard.press('Tab');
      if (await field.evaluate((node) => document.activeElement === node))
        break;
    }
    await expect
      .poll(async () =>
        field.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const header = document
            .querySelector('header')
            ?.getBoundingClientRect();
          const submit = document
            .querySelector<HTMLButtonElement>('button[type="submit"]')
            ?.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          return {
            name: node.getAttribute('name'),
            focused: document.activeElement === node,
            headerClear: rect.top >= (header?.bottom ?? 0),
            footerClear: rect.bottom <= (submit?.top ?? window.innerHeight),
            hit: hit === node || node.contains(hit),
          };
        }),
      )
      .toEqual({
        name: await field.getAttribute('name'),
        focused: true,
        headerClear: true,
        footerClear: true,
        hit: true,
      });
  }

  await fields[0].selectOption('society');
  await fields[1].fill('2026-10-13T14:00');
  await fields[2].fill('확인용 제목');
  await fields[3].fill('서울');
  await description.fill('확인용 본문');
  await page.getByRole('button', { name: '제보 접수' }).click();
  const heading = page.getByRole('heading', { name: '제보가 완료되었습니다' });
  await heading.waitFor();
  await expect
    .poll(async () =>
      heading.evaluate((node) => document.activeElement === node),
    )
    .toBe(true);
  const check = page.locator('[role="status"] [aria-hidden="true"]');
  const checkSize = await check.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      font: Number.parseFloat(getComputedStyle(node).fontSize),
    };
  });
  expect(checkSize).toEqual({ width: 78, height: 78, font: 38 });
  expect(
    await page.getByText('접수번호:', { exact: false }).textContent(),
  ).toContain('a'.repeat(32));
}, 120000);
// Append to proxy-navigation.test.ts, which provides a test-only Next server
// and an isolated headless browser context.
test('recentSearchChipsScrollAndRemainKeyboardAccessible', async () => {
  const context = await browser!.newContext({
    viewport: { width: 320, height: 568 },
  });
  contexts.push(context);
  const terms = [
    '서울 소방서',
    '서교동 화재',
    '강남역',
    '싱크홀',
    '북한 무인기',
    '아주 길게 입력한 최근 검색어 확인 예시',
  ];
  await context.addInitScript((keywords) => {
    localStorage.setItem('hh:recent-searches:v1', JSON.stringify(keywords));
  }, terms);
  const page = await context.newPage();
  await page.goto(origin + '/search');

  const section = page.getByRole('region', { name: '최근 검색' });
  const chips = section.locator('li');
  await expect.poll(() => chips.count()).toBe(terms.length);
  const horizontal = await section.locator('ul').evaluate((list) => {
    const items = Array.from(list.querySelectorAll('li'));
    const first = items[0].getBoundingClientRect();
    const second = items[1].getBoundingClientRect();
    return {
      overflow: list.scrollWidth > list.clientWidth,
      sameRow: Math.abs(first.top - second.top) < 1,
      ordered: first.right < second.left,
    };
  });
  expect(horizontal).toEqual({ overflow: true, sameRow: true, ordered: true });

  const firstLink = section.getByRole('link', { name: terms[0], exact: true });
  expect(await firstLink.getAttribute('href')).toBe(
    '/search?q=' + encodeURIComponent(terms[0]),
  );
  await firstLink.focus();
  await page.keyboard.press('Tab');
  const firstDelete = section.getByRole('button', {
    name: terms[0] + ' 삭제',
    exact: true,
  });
  expect(
    await firstDelete.evaluate((node) => document.activeElement === node),
  ).toBe(true);
  const visibleHitTarget = async (button: typeof firstDelete) =>
    button.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const clip = node.closest('ul')!.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return (
        rect.width >= 32 &&
        rect.height >= 32 &&
        rect.left >= clip.left &&
        rect.right <= clip.right &&
        rect.top >= clip.top &&
        rect.bottom <= clip.bottom &&
        (hit === node || node.contains(hit))
      );
    });
  expect(await visibleHitTarget(firstDelete)).toBe(true);

  const lastLink = section.getByRole('link', {
    name: terms.at(-1),
    exact: true,
  });
  await lastLink.focus();
  await expect
    .poll(() => section.locator('ul').evaluate((list) => list.scrollLeft))
    .toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  const lastDelete = section.getByRole('button', {
    name: terms.at(-1) + ' 삭제',
    exact: true,
  });
  expect(
    await lastDelete.evaluate((node) => document.activeElement === node),
  ).toBe(true);
  expect(await visibleHitTarget(lastDelete)).toBe(true);
  await page.keyboard.press('Enter');
  await expect.poll(() => chips.count()).toBe(terms.length - 1);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('hh:recent-searches:v1') ?? '[]'),
    ),
  ).toEqual(terms.slice(0, -1));
}, 120000);

test('reportAttachmentTilesAreHorizontalAndKeepAccessibleFileControls', async () => {
  const png = await readFile(join(process.cwd(), 'src/app/icon.png'));
  const file = (name: string) => ({ name, mimeType: 'image/png', buffer: png });
  for (const width of [320, 393]) {
    const page = await openList(width);
    try {
      await page.goto(origin + '/report');
      const input = page.locator('input[type="file"]');
      await input.setInputFiles([file('one.png'), file('two.png')]);
      const first = page.getByRole('button', {
        name: 'one.png 삭제',
        exact: true,
      });
      const second = page.getByRole('button', {
        name: 'two.png 삭제',
        exact: true,
      });
      await first.waitFor();
      await second.waitFor();
      const previews = page.locator('form ul li img[src^="blob:"]');
      await expect.poll(() => previews.count()).toBe(2);
      await previews.first().waitFor({ state: 'visible' });
      await previews.last().waitFor({ state: 'visible' });
      const boxes = await previews.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
      expect(boxes[0].width).toBeCloseTo(76, 0);
      expect(boxes[0].height).toBeCloseTo(76, 0);
      expect(boxes[1].width).toBeCloseTo(76, 0);
      expect(boxes[1].height).toBeCloseTo(76, 0);
      expect(boxes[1].y).toBeCloseTo(boxes[0].y, 0);
      expect(boxes[1].x).toBeGreaterThanOrEqual(boxes[0].x + boxes[0].width);
      await page.getByText('2 / 3', { exact: true }).waitFor();
      expect(
        await page.getByLabel('첨부파일 추가', { exact: true }).count(),
      ).toBe(1);
      await first.click();
      expect(await second.isVisible()).toBe(true);
      await page.getByText('1 / 3', { exact: true }).waitFor();
      await input.setInputFiles([file('three.png'), file('four.png')]);
      await page.getByText('3 / 3', { exact: true }).waitFor();
      expect(await second.isVisible()).toBe(true);
      expect(
        await page
          .getByRole('button', { name: 'three.png 삭제', exact: true })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole('button', { name: 'four.png 삭제', exact: true })
          .isVisible(),
      ).toBe(true);
      expect(await input.isDisabled()).toBe(true);
    } finally {
      await page.close();
    }
  }
}, 120000);

test('reportFieldFocusAndErrorsRemainAccessible', async () => {
  const context = await browser!.newContext({
    viewport: { width: 320, height: 568 },
  });
  contexts.push(context);
  const page = await context.newPage();
  let posts = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/reports'
    )
      posts++;
  });
  await page.goto(origin + '/report');
  const fields = [
    page.getByLabel('카테고리 선택', { exact: true }),
    page.getByLabel('발생 날짜 및 시간 (한국시간)', { exact: true }),
    page.getByLabel('제보 제목', { exact: true }),
    page.getByLabel('발생 위치', { exact: true }),
    page.getByLabel('상세내용', { exact: true }),
  ];
  const attachment = page.getByLabel('사진/동영상 첨부', { exact: true });
  const upload = attachment.locator('..');
  await page.getByRole('link', { name: '제보 닫기' }).focus();
  await page.keyboard.press('Tab');
  expect(
    await fields[0].evaluate((node) => document.activeElement === node),
  ).toBe(true);
  expect(
    await fields[0].evaluate((node) => {
      const style = getComputedStyle(node);
      return (
        style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
      );
    }),
  ).toBe(true);

  for (const field of fields) {
    await field.focus();
    expect(await field.getAttribute('aria-invalid')).toBeNull();
    const focus = await field.evaluate((node) => {
      const style = getComputedStyle(node);
      return { border: style.borderTopColor, shadow: style.boxShadow };
    });
    expect(focus.border).toBe('rgb(234, 26, 45)');
    expect(focus.shadow).not.toBe('none');
  }
  await attachment.focus();
  expect(
    await upload.evaluate((node) => getComputedStyle(node).borderTopColor),
  ).toBe('rgb(234, 26, 45)');

  await page.getByRole('button', { name: '제보 접수', exact: true }).click();
  for (const field of fields) {
    expect(await field.getAttribute('aria-invalid')).toBe('true');
    const error = await field.evaluate((node) => {
      const id = node.getAttribute('aria-describedby');
      const style = getComputedStyle(node);
      return {
        message: id ? document.getElementById(id)?.textContent : null,
        border: style.borderTopColor,
        background: style.backgroundColor,
      };
    });
    expect(error.message).toContain('필수 항목이에요');
    expect(error.border).toBe('rgb(234, 26, 45)');
    expect(error.background).toBe('rgb(255, 245, 245)');
  }
  expect(posts).toBe(0);

  await attachment.setInputFiles({
    name: '허용되지않음.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  expect(await attachment.getAttribute('aria-invalid')).toBe('true');
  const attachmentError = await attachment.evaluate((node) => {
    const id = node.getAttribute('aria-describedby');
    const parent = node.parentElement!;
    const style = getComputedStyle(parent);
    return {
      message: id ? document.getElementById(id)?.textContent : null,
      border: style.borderTopColor,
      background: style.backgroundColor,
    };
  });
  expect(attachmentError.message).toContain('JPEG');
  expect(attachmentError.border).toBe('rgb(234, 26, 45)');
  expect(attachmentError.background).toBe('rgb(255, 245, 245)');
  expect(posts).toBe(0);
}, 120000);
// Append to proxy-navigation.test.ts: uses its isolated Next server and browser.
test('searchInputCanClearDraftAndSubmitAfterComposition', async () => {
  const context = await browser!.newContext({
    viewport: { width: 320, height: 568 },
  });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(origin + '/search');

  const form = page.locator('form[action="/search"]');
  const input = page.getByRole('searchbox', { name: '기사 키워드 검색' });
  const formHeight = await form.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  expect(formHeight).toBeCloseTo(44, 0);
  expect((await form.getAttribute('method'))?.toLowerCase()).toBe('get');

  await input.fill('서울 & 화재');
  const clearDraft = page.getByRole('button', {
    name: '검색어 초기화',
    exact: true,
  });
  await clearDraft.click();
  expect(await input.inputValue()).toBe('');
  expect(
    await input.evaluate((element) => document.activeElement === element),
  ).toBe(true);
  expect(
    await page.getByRole('button', { name: '검색어 초기화' }).count(),
  ).toBe(0);

  await input.fill('한글 화재');
  await input.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    );
    element.form!.requestSubmit();
  });
  expect(new URL(page.url()).searchParams.has('q')).toBe(false);
  await input.evaluate((element) =>
    element.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true }),
    ),
  );
  await input.press('Enter');
  await page.waitForURL(
    (url) =>
      url.pathname === '/search' && url.searchParams.get('q') === '한글 화재',
  );
  expect(
    await page
      .getByRole('searchbox', { name: '기사 키워드 검색' })
      .inputValue(),
  ).toBe('한글 화재');
  const reset = page.getByRole('link', { name: '검색어 초기화', exact: true });
  expect(await reset.getAttribute('href')).toBe('/search');

  // Clearing an edited field on a results page must retain the original
  // navigation back to the initial search screen.
  await input.fill('');
  expect(await reset.count()).toBe(1);
  await input.fill('두 번째 검색');
  await input.press('Enter');
  await page.waitForURL(
    (url) =>
      url.pathname === '/search' &&
      url.searchParams.get('q') === '두 번째 검색',
  );
  expect(await input.inputValue()).toBe('두 번째 검색');
  await page.goBack();
  await page.waitForURL(
    (url) =>
      url.pathname === '/search' && url.searchParams.get('q') === '한글 화재',
  );
  await expect.poll(() => input.inputValue()).toBe('한글 화재');

  await reset.click();
  await page.waitForURL((url) => url.pathname === '/search' && !url.search);
  expect(await input.inputValue()).toBe('');

  const noJsContext = await browser!.newContext({ javaScriptEnabled: false });
  contexts.push(noJsContext);
  const noJs = await noJsContext.newPage();
  await noJs.goto(origin + '/search');
  await noJs
    .getByRole('searchbox', { name: '기사 키워드 검색' })
    .fill('서울 & 화재');
  await noJs.getByRole('button', { name: '검색', exact: true }).click();
  await noJs.waitForURL(
    (url) =>
      url.pathname === '/search' && url.searchParams.get('q') === '서울 & 화재',
  );
}, 120000);

test('detailCloseIconKeepsAccessibleHitTargetAndReturnsToMap', async () => {
  for (const entry of ['list', 'direct']) {
    const page = await openList();

    if (entry === 'list') {
      await page
        .getByRole('link', { name: article.article.title, exact: true })
        .click();
    } else {
      await page.goto(origin + '/incidents/' + id);
    }

    const detail = page.locator('[data-article-inline]');
    await detail
      .getByRole('heading', { level: 1, name: article.article.title })
      .waitFor();
    const close = detail.getByRole('link', { name: '닫기', exact: true });
    const icon = close.locator('img');
    expect(await close.getAttribute('href')).toBe('/');
    expect(await icon.getAttribute('alt')).toBe('');
    expect(await icon.getAttribute('src')).toBe(
      '/article-detail/header-close.svg',
    );
    const geometry = await close.evaluate((node) => {
      const link = node.getBoundingClientRect();
      const img = node.querySelector('img')!.getBoundingClientRect();
      const hit = document.elementFromPoint(
        link.left + link.width / 2,
        link.top + link.height / 2,
      );
      return {
        width: link.width,
        height: link.height,
        iconWidth: img.width,
        iconHeight: img.height,
        hit: hit === node || node.contains(hit),
      };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(44);
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.iconWidth).toBeCloseTo(24, 0);
    expect(geometry.iconHeight).toBeCloseTo(24, 0);
    expect(geometry.hit).toBe(true);
    await close.focus();
    expect(
      await close.evaluate((node) => node === document.activeElement),
    ).toBe(true);
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      close.click(),
    ]);
    await page.close();
  }
}, 120000);

test('articleDocumentReadsOnceAndOmitsUnexpectedUpstreamFields', async () => {
  const before = detailRequests.length;
  failAfterDetailRequest = before + 1;
  largePrivateDetail = true;
  try {
    const response = await fetch(origin + '/incidents/' + id);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(detailRequests.length - before).toBe(1);
    expect(html).toContain('끝표식');
    expect(html).not.toContain('PRIVATE_UNEXPECTED_FIELD');
    expect(html).not.toContain('PRIVATE_NESTED_FIELD');
    expect(html).toContain('https://hyunghyung.vercel.app/incidents/' + id);
  } finally {
    failAfterDetailRequest = Number.POSITIVE_INFINITY;
    largePrivateDetail = false;
  }
}, 30000);

test('articleDocumentUpstreamFailureReturns503WithNoJsRecovery', async () => {
  failDetail = true;
  try {
    const response = await fetch(origin + '/incidents/' + id);
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('retry-after')).toBe('60');
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).not.toContain('QA_PRIVATE_DETAIL');
    expect(html).not.toContain('127.0.0.1');
    expect(html).not.toContain('noindex');

    const head = await fetch(origin + '/incidents/' + id, { method: 'HEAD' });
    expect(head.status).toBe(503);
    expect(head.headers.get('retry-after')).toBe('60');
    expect(await head.text()).toBe('');
    const invalid = await fetch(origin + '/article-unavailable/invalid');
    expect(invalid.status).toBe(404);

    const context = await browser!.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 568 },
    });
    contexts.push(context);
    const page = await context.newPage();
    const documentResponse = await page.goto(origin + '/incidents/' + id);
    expect(documentResponse?.status()).toBe(503);
    expect(
      await page
        .getByRole('heading', { name: '이 소식을 다시 열어볼까요?' })
        .count(),
    ).toBe(1);
    expect(
      await page.getByRole('link', { name: '다시 시도' }).getAttribute('href'),
    ).toBe('/incidents/' + id);
    expect(
      await page.getByRole('link', { name: '목록으로' }).getAttribute('href'),
    ).toBe('/incidents');
    expect(
      await page.getByRole('link', { name: '지도로' }).getAttribute('href'),
    ).toBe('/');

    const retry = page.getByRole('link', { name: '다시 시도' });
    const bounds = await retry.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await retry.focus();
    expect(
      await retry.evaluate((element) => document.activeElement === element),
    ).toBe(true);

    failDetail = false;
    await retry.click();
    await page.getByRole('heading', { name: article.article.title }).waitFor();
  } finally {
    failDetail = false;
  }
}, 30000);

test('articleDocument503RetryModifiedClickOpensANewTab', async () => {
  failDetail = true;
  try {
    const context = await browser!.newContext();
    contexts.push(context);
    const page = await context.newPage();
    await page.goto(origin + '/incidents/' + id);
    const retry = page.getByRole('link', { name: '다시 시도' });
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      retry.click({
        modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'],
      }),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).pathname).toBe('/incidents/' + id);
    expect(await retry.getAttribute('aria-busy')).toBe('false');
    expect(await retry.getAttribute('aria-disabled')).toBeNull();
    expect(
      await page
        .getByRole('heading', { name: '이 소식을 다시 열어볼까요?' })
        .count(),
    ).toBe(1);
    await popup.close();
  } finally {
    failDetail = false;
  }
}, 30000);

test('articleDocument503RetryRecoversAfterNavigationIsStopped', async () => {
  failDetail = true;
  const context = await browser!.newContext();
  contexts.push(context);
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  try {
    await page.goto(origin + '/incidents/' + id);
    const retry = page.getByRole('link', { name: '다시 시도' });
    await retry.waitFor();
    const box = await retry.boundingBox();
    if (!box) throw new Error('재시도 링크의 위치를 읽지 못함');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    holdDetails = true;
    const before = detailRequests.length;
    const pendingStates: Array<{
      busy: string | null;
      spinnerVisible: boolean;
    }> = [];
    await page.exposeFunction(
      'observeRetryBeforeNavigation',
      (state: (typeof pendingStates)[number]) => pendingStates.push(state),
    );
    await retry.evaluate((element) => {
      element.addEventListener(
        'click',
        () => {
          const spinner = element.querySelector<HTMLElement>('[role="status"]');
          const state = {
            busy: element.getAttribute('aria-busy'),
            spinnerVisible: Boolean(spinner && !spinner.hidden),
          };
          void (
            window as unknown as {
              observeRetryBeforeNavigation: (
                value: typeof state,
              ) => Promise<void>;
            }
          ).observeRetryBeforeNavigation(state);
        },
        { once: true },
      );
    });
    const firstClick = retry.click({ noWaitAfter: true }).catch(() => {});
    await expect
      .poll(() => waitingDetails.length, { timeout: 3000 })
      .toBeGreaterThan(0);
    await expect.poll(() => pendingStates[0], { timeout: 2000 }).toBeDefined();
    expect(pendingStates[0]).toEqual({ busy: 'true', spinnerVisible: true });
    await page.mouse.click(x, y);
    await page.keyboard.press('Enter');
    await wait(100);
    expect(detailRequests.length - before).toBe(1);
    await client.send('Page.stopLoading');
    const evaluate = async (expression: string) =>
      (
        await client.send('Runtime.evaluate', {
          expression,
          returnByValue: true,
        })
      ).result.value;
    await expect
      .poll(
        () =>
          evaluate(
            "document.querySelector('[data-detail-retry]').getAttribute('aria-busy')",
          ),
        { timeout: 3000 },
      )
      .toBe('false');
    expect(
      await evaluate(
        "document.querySelector('[data-detail-retry]').hasAttribute('aria-disabled')",
      ),
    ).toBe(false);
    expect(await evaluate("document.querySelector('.spinner').hidden")).toBe(
      true,
    );
    await firstClick;
    holdDetails = false;
    failDetail = false;
    for (const response of waitingDetails.splice(0))
      if (!response.destroyed) response.end(JSON.stringify(article));
    await retry.click();
    await page.getByRole('heading', { name: article.article.title }).waitFor();
  } finally {
    failDetail = false;
    holdDetails = false;
    for (const response of waitingDetails.splice(0))
      if (!response.destroyed) response.end(JSON.stringify(article));
    await client.detach();
  }
}, 30000);

test('articleDocument503RetryWithoutNavigationApiRecoversAfterThirtySeconds', async () => {
  const script = await readFile(
    join(process.cwd(), 'public/article-detail/error-retry.js'),
    'utf8',
  );
  let attempts = 0;
  let recover = false;
  const pending = new Set<ServerResponse>();
  const fixture = createServer((request, response) => {
    if (request.url === '/retry.js') {
      response
        .writeHead(200, { 'Content-Type': 'text/javascript' })
        .end(script);
    } else if (request.url === '/pending') {
      attempts++;
      if (recover)
        response
          .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          .end('<h1>복구된 기사</h1>');
      else {
        pending.add(response);
        response.on('close', () => pending.delete(response));
      }
    } else {
      response
        .writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(
          '<!doctype html><html lang="ko"><body><a data-detail-retry aria-label="다시 시도" aria-busy="false" href="/pending"><span class="spinner" hidden></span>다시 시도</a><script src="/retry.js" defer></script></body></html>',
        );
    }
  });
  const port = await listen(fixture);
  const context = await browser!.newContext();
  contexts.push(context);
  await context.addInitScript(() => {
    Object.defineProperty(window, 'navigation', {
      value: undefined,
      configurable: true,
    });
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  try {
    await page.clock.install();
    await page.goto('http://127.0.0.1:' + port + '/error');
    const retry = page.getByRole('link', { name: '다시 시도' });
    const box = await retry.boundingBox();
    if (!box) throw new Error('재시도 링크의 위치를 읽지 못함');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await retry.click({ noWaitAfter: true });
    await expect.poll(() => attempts, { timeout: 3000 }).toBe(1);
    await page.mouse.click(x, y);
    await page.keyboard.press('Enter');
    await wait(100);
    expect(attempts).toBe(1);
    await client.send('Page.stopLoading');
    await page.clock.fastForward(29000);
    await page.mouse.click(x, y);
    await page.keyboard.press('Enter');
    await wait(100);
    expect(attempts).toBe(1);
    expect(await retry.getAttribute('aria-busy')).toBe('true');
    expect(
      await retry
        .locator('.spinner')
        .evaluate((node) => (node as HTMLElement).hidden),
    ).toBe(false);
    await page.clock.fastForward(1000);
    expect(await retry.getAttribute('aria-busy')).toBe('false');
    expect(await retry.getAttribute('aria-disabled')).toBeNull();
    expect(
      await retry
        .locator('.spinner')
        .evaluate((node) => (node as HTMLElement).hidden),
    ).toBe(true);
    recover = true;
    await Promise.all([page.waitForURL('**/pending'), retry.click()]);
    await page.getByRole('heading', { name: '복구된 기사' }).waitFor();
    expect(attempts).toBe(2);

    recover = false;
    await page.goto('http://127.0.0.1:' + port + '/error');
    const slowRetry = page.getByRole('link', { name: '다시 시도' });
    const slowBox = await slowRetry.boundingBox();
    if (!slowBox) throw new Error('느린 재시도 링크의 위치를 읽지 못함');
    await slowRetry.click({ noWaitAfter: true });
    await expect.poll(() => attempts, { timeout: 3000 }).toBe(3);
    await page.mouse.click(
      slowBox.x + slowBox.width / 2,
      slowBox.y + slowBox.height / 2,
    );
    await page.keyboard.press('Enter');
    await wait(1500);
    expect(attempts).toBe(3);
    recover = true;
    for (const response of pending)
      if (!response.destroyed)
        response
          .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          .end('<h1>복구된 기사</h1>');
    pending.clear();
    await page.getByRole('heading', { name: '복구된 기사' }).waitFor();
    expect(attempts).toBe(3);
  } finally {
    for (const response of pending) response.destroy();
    fixture.closeAllConnections();
    await new Promise<void>((resolve) => fixture.close(() => resolve()));
    await client.detach();
  }
}, 30000);

test('detailLocationApiReturnsOnlyVerifiedTargetAndRelatedArticles', async () => {
  const otherId = 'b'.repeat(64);
  const unrelatedId = 'c'.repeat(64);
  const evidence = { field: 'description', text: '내부 이동 검증용 기사' };
  const location = {
    latitude: 37.5,
    longitude: 127.1,
    label: '서울 검증 지역',
    precision: 'region',
    evidence,
  };
  const item = (articleId: string, label: string, latitude: number) => ({
    ...article,
    collection_id: 'detail-location-fixture',
    article_id: articleId,
    location_status: 'resolved',
    location_reason: null,
    location: { ...location, label, latitude },
  });
  mapArticlesFixture = {
    total: 3,
    items: [
      item(id, location.label, location.latitude),
      item(otherId, location.label, location.latitude),
      item(unrelatedId, '다른 지역', 35),
    ],
  };
  try {
    const response = await fetch(origin + '/api/incidents/' + id + '/location');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const text = await response.text();
    const body = JSON.parse(text) as {
      location: {
        latitude: number;
        longitude: number;
        label: string;
        precision: string;
      } | null;
      related: Array<{ articleId: string }>;
    };
    expect(body.location).toEqual({
      latitude: 37.5,
      longitude: 127.1,
      label: '서울 검증 지역',
      precision: 'region',
    });
    expect(body.related.map((item) => item.articleId)).toEqual([otherId]);
    expect(text).not.toContain(unrelatedId);
    expect(text).not.toContain('fixture.invalid');
    expect(text).not.toContain('127.0.0.1');
    expect(text).not.toContain('evidence');
  } finally {
    mapArticlesFixture = { total: 0, items: [] };
  }
}, 120000);

test('detailLocationClientAbortReachesTheUpstreamRequest', async () => {
  holdMap = true;
  const controller = new AbortController();
  const start = waitingMap.length;
  const pending = fetch(origin + '/api/incidents/' + id + '/location', {
    signal: controller.signal,
  }).catch((error: unknown) => error);

  try {
    await expect
      .poll(() => waitingMap.length - start, { timeout: 5000 })
      .toBe(1);
    const upstream = waitingMap[start];
    controller.abort();
    await pending;
    await expect.poll(() => upstream.destroyed, { timeout: 2000 }).toBe(true);
  } finally {
    holdMap = false;
    controller.abort();
    for (const response of waitingMap.splice(start)) {
      if (!response.destroyed)
        response.end(JSON.stringify({ total: 0, items: [] }));
    }
  }
}, 120000);

test('articleSheetTouchInterruptsSnapWithoutJumpAndCanRetoggle', async () => {
  const savedDescription = article.article.description;
  article.article.description = '실제 드래그 실험을 위한 긴 기사. '.repeat(300);
  try {
    const page = await openList(393);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(origin + '/sheet-test-fixture');
    const sheet = page.getByRole('dialog');
    const handle = sheet.locator('button[aria-expanded]');
    await sheet
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await sheet.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    const client = await page.context().newCDPSession(page);
    await client.send('Animation.enable');
    await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await handle.evaluate((el) => {
      const events: unknown[] = [];
      (window as unknown as { touchEvents: unknown[] }).touchEvents = events;
      for (const type of [
        'pointerdown',
        'pointermove',
        'pointerup',
        'pointercancel',
        'click',
      ])
        el.addEventListener(
          type,
          (event) => {
            const e = event as PointerEvent;
            const rect = el.getBoundingClientRect();
            events.push({
              type,
              pointerType: e.pointerType,
              trusted: e.isTrusted,
              detail: e.detail,
              y: e.clientY,
              gripY: rect.y,
              gripBottom: rect.bottom,
            });
          },
          true,
        );
    });
    await handle.click();
    await client.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.evaluate(() => {
      (window as unknown as { touchEvents: unknown[] }).touchEvents.length = 0;
    });
    const sample = await page.evaluate(() => {
      const element = document.querySelector<HTMLElement>('[role="dialog"]')!;
      const grip = element.querySelector<HTMLElement>('button[aria-expanded]')!;
      const animation = element
        .getAnimations()
        .find((a) => a.playState === 'running');
      const rect = grip.getBoundingClientRect();
      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        ySheet: element.getBoundingClientRect().y,
        animationRunning: Boolean(animation),
        animationTime: animation?.currentTime,
      };
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: sample.x, y: sample.y }],
    });
    await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
    const down = (await sheet.boundingBox())!;
    await page.waitForTimeout(60);
    const held = (await sheet.boundingBox())!;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: sample.x, y: sample.y - 20 }],
    });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    const moved = (await sheet.boundingBox())!;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const events = await page.evaluate(
      () =>
        (
          window as unknown as {
            touchEvents: Array<{
              type: string;
              pointerType: string;
              trusted: boolean;
              y: number;
              gripY: number;
              gripBottom: number;
            }>;
          }
        ).touchEvents,
    );
    const downEvent = events.find((event) => event.type === 'pointerdown');
    expect(sample.animationRunning, 'the sheet is still transitioning').toBe(
      true,
    );
    expect(downEvent?.pointerType).toBe('touch');
    expect(downEvent?.trusted).toBe(true);
    expect(downEvent!.y).toBeGreaterThanOrEqual(downEvent!.gripY - 12);
    expect(downEvent!.y).toBeLessThanOrEqual(downEvent!.gripBottom + 12);
    expect(
      Math.abs(held.y - down.y),
      'holding the moving handle freezes the sheet',
    ).toBeLessThan(4);
    expect(
      Math.abs(moved.y - (down.y - 20)),
      'the sheet follows the touch while held',
    ).toBeLessThan(5);
    await sheet.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    await handle.click();
    expect(await sheet.getAttribute('data-expanded')).toBe('false');
    await client.send('Animation.setPlaybackRate', { playbackRate: 0 });
    const tap = await handle.boundingBox();
    if (!tap) throw new Error('transitioning handle is not visible');
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: tap.x + tap.width / 2, y: tap.y + tap.height / 2 }],
    });
    await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect.poll(() => sheet.getAttribute('data-expanded')).toBe('true');
    const finalEvents = await page.evaluate(
      () =>
        (
          window as unknown as {
            touchEvents: Array<{
              type: string;
              pointerType: string;
              trusted: boolean;
            }>;
          }
        ).touchEvents,
    );
    expect(
      finalEvents.filter(
        (event) =>
          event.type === 'pointerdown' &&
          event.pointerType === 'touch' &&
          event.trusted,
      ),
    ).toHaveLength(2);
    expect(
      finalEvents.some(
        (event) =>
          event.type === 'click' &&
          event.pointerType === 'touch' &&
          event.trusted,
      ),
    ).toBe(true);
    await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test.each(['pointercancel', 'lostpointercapture'])(
  'articleSheetCancelDuringCollapseResumesSmoothly: %s',
  async (kind) => {
    const savedDescription = article.article.description;
    article.article.description = '취소 동작 검증을 위한 긴 기사. '.repeat(300);
    try {
      const page = await openList(393);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(origin + '/sheet-test-fixture');
      const sheet = page.getByRole('dialog');
      const handle = sheet.locator('button[aria-expanded]');
      await sheet
        .getByRole('heading', { name: article.article.title, exact: true })
        .waitFor();
      await sheet.evaluate(async (e) => {
        await Promise.all(
          e.getAnimations().map((a) => a.finished.catch(() => undefined)),
        );
      });
      await handle.click();
      await sheet.evaluate(async (e) => {
        await Promise.all(
          e.getAnimations().map((a) => a.finished.catch(() => undefined)),
        );
      });
      const client = await page.context().newCDPSession(page);
      await client.send('Animation.enable');
      await handle.evaluate((el) => {
        const state = { pointerId: 0, events: [] as string[] };
        (window as unknown as { cancelAudit: typeof state }).cancelAudit =
          state;
        for (const type of [
          'pointerdown',
          'gotpointercapture',
          'pointercancel',
          'lostpointercapture',
        ])
          el.addEventListener(type, (event) => {
            const pointer = event as PointerEvent;
            state.pointerId = pointer.pointerId;
            state.events.push(type);
          });
      });
      await handle.click();
      await page.evaluate(() => {
        const state = (
          window as unknown as {
            cancelAudit: { pointerId: number; events: string[] };
          }
        ).cancelAudit;
        state.pointerId = 0;
        state.events = [];
      });
      await client.send('Animation.setPlaybackRate', { playbackRate: 0 });
      const box = await handle.boundingBox();
      if (!box) throw new Error('no handle');
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 - 2 },
        ],
      });
      await expect
        .poll(async () =>
          page.evaluate(
            () =>
              (window as unknown as { cancelAudit: { events: string[] } })
                .cancelAudit.events,
          ),
        )
        .toContain('gotpointercapture');
      await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
      const before = await sheet.boundingBox();
      await client.send('Animation.setPlaybackRate', { playbackRate: 0 });
      if (kind === 'pointercancel') {
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchCancel',
          touchPoints: [],
        });
      } else {
        const pointerId = await page.evaluate(
          () =>
            (window as unknown as { cancelAudit: { pointerId: number } })
              .cancelAudit.pointerId,
        );
        expect(pointerId).toBeGreaterThan(0);
        await handle.evaluate(
          (el, id) => el.releasePointerCapture(id),
          pointerId,
        );
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          ],
        });
      }
      await page.evaluate(
        () =>
          new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );
      const cancelEvents = await page.evaluate(
        () =>
          (window as unknown as { cancelAudit: { events: string[] } })
            .cancelAudit.events,
      );
      expect(cancelEvents).toContain('pointerdown');
      expect(cancelEvents).toContain(kind);
      if (kind === 'lostpointercapture')
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchCancel',
          touchPoints: [],
        });
      const after = await sheet.boundingBox();
      await client.send('Animation.setPlaybackRate', { playbackRate: 1 });
      if (!before || !after) throw new Error('missing sheet');
      expect(
        Math.abs(after.height - before.height),
        '취소 직후 높이 불연속',
      ).toBeLessThan(4);
      await expect
        .poll(async () => (await sheet.boundingBox())?.height ?? 0, {
          timeout: 3000,
        })
        .toBeCloseTo(852 * 0.5352, 0);
      expect(await sheet.getAttribute('data-expanded')).toBe('false');
    } finally {
      article.article.description = savedDescription;
    }
  },
  60000,
);

test('articleSheetIgnoresOtherPointerClickDuringDrag', async () => {
  const savedDescription = article.article.description;
  article.article.description = '다중 포인터 검증을 위한 긴 기사. '.repeat(300);
  try {
    const page = await openList(393);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(origin + '/sheet-test-fixture');
    const sheet = page.getByRole('dialog');
    const handle = sheet.locator('button[aria-expanded]');
    await sheet
      .getByRole('heading', { name: article.article.title, exact: true })
      .waitFor();
    await sheet.evaluate(async (e) => {
      await Promise.all(
        e.getAnimations().map((a) => a.finished.catch(() => undefined)),
      );
    });
    const client = await page.context().newCDPSession(page);
    await handle.evaluate((el) => {
      (window as unknown as { otherPointerClicks: number }).otherPointerClicks =
        0;
      el.addEventListener(
        'click',
        (event) => {
          if (event.isTrusted)
            (window as unknown as { otherPointerClicks: number })
              .otherPointerClicks++;
        },
        true,
      );
    });
    const box = await handle.boundingBox();
    if (!box) throw new Error('no handle');
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - 50 }],
    });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    const current = await handle.boundingBox();
    if (!current) throw new Error('no moved handle');
    await page.mouse.click(
      current.x + current.width / 2,
      current.y + current.height / 2,
    );
    const expanded = await sheet.getAttribute('data-expanded');
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { otherPointerClicks: number })
            .otherPointerClicks,
      ),
    ).toBe(1);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    expect(expanded, '다른 포인터의 클릭이 드래그 중 상태를 바꾸지 않음').toBe(
      'false',
    );
  } finally {
    article.article.description = savedDescription;
  }
}, 60000);

test('articleDocumentAndRscWorkWithExplicitLoopbackHostname', async () => {
  const reservation = createServer();
  const port = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const apiPort = (api.address() as AddressInfo).port;
  const next = join(process.cwd(), 'node_modules/next/dist/bin/next');
  const child = spawn(
    process.execPath,
    [next, 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: directory,
      env: {
        ...process.env,
        NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout?.on('data', (chunk) => {
    output += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    output += String(chunk);
  });
  const base = 'http://127.0.0.1:' + port;
  const originalItems = listArticles;
  listArticles = [article];
  try {
    await ready(base, child, () => output);
    const before = detailRequests.length;
    const success = await fetch(base + '/incidents/' + id + '?source=share');
    const html = await success.text();
    expect(success.status).toBe(200);
    expect(detailRequests.length - before).toBe(1);
    expect(success.headers.get('cache-control')).toContain('no-store');
    expect(success.headers.get('x-middleware-rewrite')).toBe(
      '/article-document/' + id + '?source=share',
    );
    expect(html).toContain(article.article.title);
    expect(html).toContain('https://hyunghyung.vercel.app/incidents/' + id);
    const successHead = await fetch(base + '/incidents/' + id, {
      method: 'HEAD',
    });
    expect(successHead.status).toBe(200);
    expect(await successHead.text()).toBe('');
    expect((await fetch(base + '/incidents/' + missingId)).status).toBe(404);
    expect(
      (await fetch(base + '/incidents/' + missingId, { method: 'HEAD' }))
        .status,
    ).toBe(404);
    failDetail = true;
    const unavailable = await fetch(base + '/incidents/' + id);
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).not.toContain('QA_PRIVATE_DETAIL');
    const unavailableHead = await fetch(base + '/incidents/' + id, {
      method: 'HEAD',
    });
    expect(unavailableHead.status).toBe(503);
    expect(await unavailableHead.text()).toBe('');
    failDetail = false;
    const spoofedHeaders: HeadersInit[] = [
      { host: 'attacker.invalid' },
      { 'x-forwarded-host': 'attacker.invalid' },
      { 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'https' },
    ];
    for (const headers of spoofedHeaders) {
      const response = await fetch(base + '/incidents/' + id, { headers });
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-rewrite')).toBe(
        '/article-document/' + id,
      );
    }
    const rsc = await fetch(base + '/incidents/' + id, {
      headers: { rsc: '1' },
    });
    expect(rsc.headers.get('content-type')).toContain('text/x-component');
    for (const path of [
      '/article-document/' + id,
      '/article-document/%61' + id.slice(1),
      '/_next/data/fake/article-document/' + id + '.json',
    ])
      expect((await fetch(base + path)).status).toBe(404);
    const context = await browser!.newContext();
    contexts.push(context);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/incidents');
    await page
      .getByRole('link', { name: article.article.title, exact: true })
      .click();
    await page
      .locator('[data-article-inline]')
      .getByRole('heading', { name: article.article.title })
      .waitFor();
    await page.goBack();
    await page.waitForURL(base + '/incidents');
    expect(errors).toEqual([]);
  } finally {
    failDetail = false;
    listArticles = originalItems;
    await stop(child);
  }
}, 60000);
