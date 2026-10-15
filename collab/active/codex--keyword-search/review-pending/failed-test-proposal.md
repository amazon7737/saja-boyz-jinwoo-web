# 추천 키워드 pending 브라우저 회귀 테스트 초안

기존33개 테스트를 유지한다. 개발 의존성 playwright-core 1.62.1과 Chrome으로 실행한다. 헤더·테스트 본문 전체가 승인 대상이다.

## 실제 Next 전환

```ts
// file: src/app/search/recommendation-loading.test.ts
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium, type Browser } from 'playwright-core';
import { expect, test } from 'vitest';

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
      const response = await fetch(origin + '/search', {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Wait only for the owned local Next server to start.
    }
    await wait(100);
  }
  throw new Error('Next server did not start: ' + output());
}
```

- [ ] recommendedKeywordShowsPendingUntilResultsArrive — 추천 클릭 후 응답 대기·새 결과 전환을 실제 브라우저로 검증

```ts
test('recommendedKeywordShowsPendingUntilResultsArrive', async () => {
  let releaseResponse!: () => void;
  const heldResponse = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let markRequested!: () => void;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  const requests: string[] = [];
  const api = createServer(async (request, response) => {
    const keyword =
      new URL(request.url ?? '/', 'http://fixture.invalid').searchParams.get(
        'keyword',
      ) ?? '';
    requests.push(keyword);
    if (keyword === '교통통제') {
      markRequested();
      await heldResponse;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        total: 1,
        items: [
          {
            article_id: 'a'.repeat(64),
            image_status: 'disabled',
            image_url: null,
            article: {
              title: keyword + ' 검증 기사',
              description: '로컬 회귀 검증 응답',
              pubDate: '2026-10-07T00:00:00Z',
              originallink: 'https://example.invalid/news',
              link: '',
            },
          },
        ],
      }),
    );
  });
  const directory = await mkdtemp(join(tmpdir(), 'search-pending-test-'));
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  try {
    const apiPort = await listen(api);
    const reservation = createServer();
    const appPort = await listen(reservation);
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    for (const path of [
      'src',
      'package.json',
      'next.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
    ]) {
      await cp(join(process.cwd(), path), join(directory, path), {
        recursive: true,
      });
    }
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(directory, 'node_modules'),
      'junction',
    );
    const env = {
      ...process.env,
      NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
      NEXT_TELEMETRY_DISABLED: '1',
    };
    await execute(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'build',
        '--webpack',
      ],
      { cwd: directory, env, timeout: 60000, maxBuffer: 8 * 1024 * 1024 },
    );
    app = spawn(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(appPort),
      ],
      { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    app.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    app.stderr?.on('data', (chunk) => {
      output += String(chunk);
    });
    const origin = 'http://127.0.0.1:' + appPort;
    await ready(origin, app, () => output);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
    });
    await page.goto(origin + '/search?q=' + encodeURIComponent('화재'));
    await page.locator('article').waitFor();
    expect(await page.locator('article').innerText()).toContain(
      '화재 검증 기사',
    );
    await page.getByRole('link', { name: /교통통제/ }).click();
    await Promise.race([
      requested,
      wait(10000).then(() => {
        throw new Error('추천 키워드 API 요청 없음');
      }),
    ]);
    const loading = page.getByRole('status').filter({ hasText: /검색.*불러/ });
    await loading.waitFor({ state: 'visible', timeout: 2500 });
    expect(await loading.getAttribute('aria-busy')).toBe('true');
    expect(await page.locator('article').innerText()).not.toContain(
      '교통통제 검증 기사',
    );
    releaseResponse();
    await page.waitForURL((url) => url.searchParams.get('q') === '교통통제');
    await page
      .locator('article')
      .filter({ hasText: '교통통제 검증 기사' })
      .waitFor();
    expect(
      await page
        .getByRole('searchbox', { name: '기사 키워드 검색' })
        .inputValue(),
    ).toBe('교통통제');
    expect(await loading.count()).toBe(0);
    expect(requests).toContain('교통통제');
  } finally {
    releaseResponse();
    await browser?.close();
    await stop(app);
    api.closeAllConnections();
    await new Promise<void>((resolve) => api.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}, 90000);
```
