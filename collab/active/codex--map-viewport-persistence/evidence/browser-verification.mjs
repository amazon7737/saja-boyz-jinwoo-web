import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const root = process.env.MAP_VIEWPORT_APP ?? process.cwd();
const require = createRequire(root + '/package.json');
const { chromium } = require('playwright-core');
const out = '/tmp/map-viewport-browser-evidence';
await mkdir(out, { recursive: true });
const id = '1'.padStart(64, '0');
const item = {
  article_id: id,
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '지도 복귀 검증 기사',
    description: '격리 QA fixture',
    pubDate: '2026-10-12T00:00:00Z',
    originallink: 'https://publisher.example.invalid/1',
    link: '',
  },
};
const fixture = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const path = new URL(req.url, 'http://fixture.invalid').pathname;
  if (path === '/news') res.end(JSON.stringify({ total: 1, items: [item] }));
  else if (path === '/news/' + id) res.end(JSON.stringify(item));
  else {
    res.writeHead(404);
    res.end('{}');
  }
});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  success: false,
  flows: [],
  pageErrors: [],
  sdkResponses: [],
  tileResponses: [],
  providerResponses: [],
};
let browser, child;
try {
  const port = await new Promise((resolve) =>
    fixture.listen(0, '127.0.0.1', () => resolve(fixture.address().port)),
  );
  child = spawn(
    process.execPath,
    [
      require.resolve('next/dist/bin/next'),
      'start',
      '--hostname',
      'localhost',
      '--port',
      '3000',
    ],
    {
      cwd: '/tmp/map-viewport-product-qa',
      env: {
        ...process.env,
        NEWS_API_BASE_URL: 'http://127.0.0.1:' + port,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let log = '';
  child.stdout.on('data', (s) => (log += s));
  child.stderr.on('data', (s) => (log += s));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(log);
    try {
      const r = await fetch('http://localhost:3000/incidents');
      await r.body?.cancel();
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await pause(100);
  }
  assert(ready, 'QA server starts');
  browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu'],
  });
  for (const width of [320, 393, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 852 },
      permissions: ['geolocation'],
      geolocation: { latitude: 37.5, longitude: 127.1 },
      locale: 'ko-KR',
    });
    await context.addInitScript(() => {
      window.__docToken = Math.random();
      window.__createdMaps = [];
      window.__geoCalls = 0;
      const original = navigator.geolocation.getCurrentPosition.bind(
        navigator.geolocation,
      );
      navigator.geolocation.getCurrentPosition = (...args) => {
        window.__geoCalls++;
        return original(...args);
      };
      document.addEventListener(
        'load',
        (event) => {
          if (
            !(event.target instanceof HTMLScriptElement) ||
            !event.target.src.includes('oapi.map.naver.com')
          )
            return;
          const maps = window.naver?.maps;
          if (!maps) return;
          const Constructor = maps.Map;
          maps.Map = new Proxy(Constructor, {
            construct(target, args) {
              const map = Reflect.construct(target, args);
              window.__map = map;
              window.__createdMaps.push({
                latitude: map.getCenter().lat(),
                longitude: map.getCenter().lng(),
                zoom: map.getZoom(),
              });
              return map;
            },
          });
        },
        true,
      );
    });
    const page = await context.newPage();
    page.on('pageerror', (error) =>
      report.pageErrors.push({ width, error: error.message }),
    );
    page.on('response', (response) => {
      const u = new URL(response.url());
      if (u.hostname === 'oapi.map.naver.com' && u.pathname.endsWith('maps.js'))
        report.sdkResponses.push({ width, status: response.status() });
      if (u.hostname !== 'localhost' && report.providerResponses.length < 100)
        report.providerResponses.push({
          width,
          host: u.hostname,
          path: u.pathname,
          status: response.status(),
        });
      if (
        /naver\.(com|net)$|pstatic\.net$/.test(u.hostname) &&
        u.pathname.includes('/styles/basic/')
      )
        report.tileResponses.push({ width, status: response.status() });
    });
    await page.goto('http://localhost:3000/');
    const waitMap = () =>
      page.waitForFunction(
        () =>
          window.__map &&
          document.querySelector('button[aria-label="내 위치"]')?.disabled ===
            false,
      );
    await waitMap();
    await page.waitForTimeout(2500);
    const docToken = await page.evaluate(() => window.__docToken);
    assert.equal(await page.evaluate(() => window.__geoCalls), 0);
    await page.evaluate(() => {
      window.__map.setCenter(new window.naver.maps.LatLng(35.1796, 129.0756));
      window.__map.setZoom(15, false);
    });
    await page.getByRole('link', { name: '목록', exact: true }).click();
    await page.waitForURL('**/incidents');
    await page
      .getByRole('link', { name: '지도 복귀 검증 기사', exact: true })
      .click();
    await page.waitForURL('**/incidents/' + id);
    await page.getByRole('link', { name: '지도', exact: true }).click();
    await page.waitForURL('http://localhost:3000/');
    await waitMap();
    assert.equal(
      await page.evaluate(() => window.__docToken),
      docToken,
      'SPA navigation',
    );
    assert.deepEqual(
      await page.evaluate(() => ({
        latitude: window.__map.getCenter().lat(),
        longitude: window.__map.getCenter().lng(),
        zoom: window.__map.getZoom(),
      })),
      { latitude: 35.1796, longitude: 129.0756, zoom: 15 },
    );
    assert.equal(
      await page.evaluate(() => window.__geoCalls),
      0,
      'return does not request location',
    );
    await page.getByRole('button', { name: '내 위치', exact: true }).click();
    await page.waitForFunction(
      () =>
        window.__geoCalls === 1 &&
        Math.abs(window.__map.getCenter().lat() - 37.5) < 1e-6,
    );
    await page.getByRole('link', { name: '사건 검색', exact: true }).click();
    await page.waitForURL('**/search');
    await page.goBack();
    await page.waitForURL('http://localhost:3000/');
    await waitMap();
    await page.waitForTimeout(1500);
    assert.deepEqual(
      await page.evaluate(() => ({
        latitude: window.__map.getCenter().lat(),
        longitude: window.__map.getCenter().lng(),
        zoom: window.__map.getZoom(),
      })),
      { latitude: 37.5, longitude: 127.1, zoom: 15 },
    );
    assert.equal(await page.evaluate(() => window.__geoCalls), 1);
    assert.equal(
      await page
        .locator('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]')
        .count(),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: out + '/restored-' + width + '.png' });
    await page.reload();
    await waitMap();
    assert.deepEqual(
      await page.evaluate(() => ({
        latitude: window.__map.getCenter().lat(),
        longitude: window.__map.getCenter().lng(),
        zoom: window.__map.getZoom(),
      })),
      { latitude: 37.5665, longitude: 126.978, zoom: 12 },
    );
    report.flows.push({
      width,
      listDetailReturn: true,
      geolocationReturn: true,
      historyBack: true,
      reloadResets: true,
      sdkScriptCount: 1,
      overflow: false,
    });
    await context.close();
  }
  assert.deepEqual(report.pageErrors, []);
  assert(
    report.sdkResponses.length > 0 &&
      report.sdkResponses.every((r) => r.status === 200),
  );
  assert(
    report.tileResponses.some((r) => r.status === 200),
    'real map tiles loaded',
  );
  report.success = true;
} catch (error) {
  report.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (child && child.exitCode === null) {
    const ended = once(child, 'exit');
    child.kill('SIGTERM');
    await Promise.race([ended, pause(2000)]);
    if (child.exitCode === null) {
      child.kill('SIGKILL');
      await ended;
    }
  }
  fixture.closeAllConnections();
  await new Promise((resolve) => fixture.close(resolve));
  await writeFile(out + '/result.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
