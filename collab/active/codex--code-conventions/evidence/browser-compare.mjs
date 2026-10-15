import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const root = process.cwd();
const require = createRequire(root + '/package.json');
const { chromium } = require('playwright-core');
assert(
  process.argv[2] && process.argv[3],
  'Usage: node browser-compare.mjs BEFORE_BUILD AFTER_BUILD',
);
const out = process.argv[4] ?? '/tmp/code-conventions-browser-evidence';
await mkdir(out, { recursive: true });
const id = '1'.padStart(64, '0');
const item = {
  article_id: id,
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '컨벤션 검증 기사',
    description: '동작과 레이아웃을 유지하는 코드 작성 컨벤션 검증',
    pubDate: '2026-10-11T00:00:00Z',
    originallink: 'https://publisher.example.invalid/1',
    link: '',
  },
};
const fixture = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, 'http://fixture.invalid');
  if (url.pathname === '/news')
    res.end(JSON.stringify({ total: 1, items: [item] }));
  else if (url.pathname === '/news/' + id) res.end(JSON.stringify(item));
  else {
    res.writeHead(404);
    res.end('{}');
  }
});
const listen = (server) =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const processes = [];
let browser;
const report = { screens: [], pageErrors: [], success: false };
try {
  const apiPort = await listen(fixture);
  browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu'],
  });
  const results = [];
  for (const [label, dir] of [
    ['before', process.argv[2]],
    ['after', process.argv[3]],
  ]) {
    const reserve = createServer();
    const port = await listen(reserve);
    await new Promise((resolve) => reserve.close(resolve));
    const child = spawn(
      process.execPath,
      [
        require.resolve('next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      {
        cwd: dir,
        env: {
          ...process.env,
          NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: '',
          NEXT_TELEMETRY_DISABLED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    processes.push(child);
    let serverLog = '';
    child.stdout.on('data', (s) => (serverLog += s));
    child.stderr.on('data', (s) => (serverLog += s));
    const origin = 'http://127.0.0.1:' + port;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(serverLog);
      try {
        const r = await fetch(origin + '/incidents');
        await r.body?.cancel();
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await pause(100);
    }
    assert(ready, label + ' production server must start');
    const captures = [];
    for (const width of [320, 393, 1280])
      for (const [name, path] of [
        ['map', '/'],
        ['search', '/search'],
        ['results', '/search?q=' + encodeURIComponent('서울')],
        ['list', '/incidents'],
        ['detail', '/incidents/' + id],
        ['report', '/report'],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: 852 },
          locale: 'ko-KR',
          timezoneId: 'Asia/Seoul',
        });
        const page = await context.newPage();
        page.on('pageerror', (e) =>
          report.pageErrors.push({ label, width, name, error: e.message }),
        );
        await page.goto(origin + path);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        const shell = page.locator('main#main-content').locator('..');
        const dom = await shell.evaluate((node) => node.outerHTML);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          label + ' ' + name + ' horizontal overflow',
        );
        const filename = label + '-' + name + '-' + width + '.png';
        const screenshot = await page.screenshot({
          path: out + '/' + filename,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
        });
        captures.push({ name, width, dom, screenshot });
        await context.close();
      }
    results.push(captures);
  }
  for (let i = 0; i < results[0].length; i++) {
    const before = results[0][i],
      after = results[1][i];
    assert.equal(
      after.dom,
      before.dom,
      before.name + ' ' + before.width + ' DOM changed',
    );
    assert(
      before.screenshot.equals(after.screenshot),
      before.name + ' ' + before.width + ' screenshot changed',
    );
    report.screens.push({
      route: before.name,
      width: before.width,
      domEqual: true,
      screenshotEqual: true,
    });
  }
  assert.deepEqual(report.pageErrors, []);
  report.success = true;
} catch (e) {
  report.error = String(e.stack ?? e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) {
      const ended = once(child, 'exit');
      child.kill('SIGTERM');
      await Promise.race([ended, pause(2000)]);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await ended;
      }
    }
  }
  fixture.closeAllConnections();
  await new Promise((resolve) => fixture.close(resolve));
  await writeFile(out + '/result.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
