import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const fixture = await mkdtemp(join(tmpdir(), 'poem-headlines-browser-'));
const raw = join(fixture, 'raw');
await mkdir(raw);
const titles = ['서울 수사 진행 소식', '부산 사건 조사 소식', '인천 현장 확인 소식'];
const articles = titles.map((title, i) => ({
  title, description: '로컬 합성 검증 기사',
  originallink: `https://fixture.invalid/${i}`, link: `https://fixture.invalid/${i}`,
  pubDate: new Date(Date.now() - i * 3600000).toUTCString(),
}));
await writeFile(join(raw, '20261101T000000000000Z_11111111111111111111111111111111.json'), JSON.stringify({
  schema_version: 1, id: '20261101T000000000000Z_11111111111111111111111111111111',
  collected_at: new Date().toISOString(), request: { query: 'fixture', display: 3, start: 1, sort: 'date' },
  response: { lastBuildDate: new Date().toUTCString(), total: 3, start: 1, display: 3, items: articles },
}));
async function port() {
  const server = createServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const value = server.address().port;
  await new Promise((resolveClose) => server.close(resolveClose));
  return value;
}
const apiOrigin = `http://127.0.0.1:${await port()}`;
const appPort = await port();
const appOrigin = `http://127.0.0.1:${appPort}`;
const children = [];
let browser;
let output = '';
function start(command, args, env) {
  const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  children.push(child);
  return child;
}
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* startup */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error('Local startup failed: ' + output);
}
try {
  start(process.env.POEM_TEST_BINARY, [], {
    ADDR: apiOrigin.replace('http://', ''), NEWS_DATA_DIR: raw,
    NEWS_IMAGE_DIR: join(fixture, 'images'), NEWS_LOCATION_DIR: join(fixture, 'locations'),
    NEWS_IMAGES_ENABLED: 'false', NEWS_LOCATIONS_ENABLED: 'false', REPORTS_ENABLED: 'false',
    NEWS_VIEWS_ALLOWED_ORIGINS: appOrigin, NAVER_CLIENT_ID: '', NAVER_CLIENT_SECRET: '',
    CLOUDFLARE_ACCOUNT_ID: '', CLOUDFLARE_API_TOKEN: '',
  });
  await ready(apiOrigin + '/health');
  for (const article of articles) {
    const id = createHash('sha256').update(article.originallink).digest('hex');
    const response = await fetch(`${apiOrigin}/news/${id}/views`, {
      method: 'POST', headers: { Origin: appOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: '11111111-1111-4111-8111-111111111111' }),
    });
    assert.equal(response.status, 204);
  }
  const ranking = await (await fetch(apiOrigin + '/news/popular/today')).json();
  assert.equal(ranking.items.length, 3);
  assert.equal(ranking.timezone, 'Asia/Seoul');
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(appPort)], { NEWS_API_BASE_URL: apiOrigin });
  await ready(appOrigin + '/api/search-headlines');
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto(appOrigin + '/search');
  const input = page.getByRole('searchbox', { name: '기사 키워드 검색' });
  await input.waitFor();
  await page.waitForFunction(() => document.querySelector('input[type=search]')?.placeholder.endsWith(' 검색하기'));
  const first = await input.getAttribute('placeholder');
  await input.fill('내 검색어 유지');
  await page.waitForFunction((previous) => document.querySelector('input[type=search]')?.placeholder !== previous, first);
  assert.equal(await input.inputValue(), '내 검색어 유지');
  const second = await input.getAttribute('placeholder');
  assert.notEqual(first, second);
  assert(titles.some((title) => first === title + ' 검색하기'));
  assert(titles.some((title) => second === title + ' 검색하기'));
  await input.fill('');
  await page.screenshot({ path: join(fixture, 'search-rolling.png'), fullPage: true });
  await page.goto(appOrigin + '/');
  const searchEntry = page.getByRole('link', { name: '기사 키워드 검색', exact: true });
  await page.waitForFunction(() => document.querySelector('header a[href="/search"]')?.textContent.endsWith(' 검색하기'));
  const headerText = await searchEntry.textContent();
  assert(titles.some((title) => headerText.includes(title)));
  await page.screenshot({ path: join(fixture, 'home-rolling.png'), fullPage: true });
  assert.deepEqual(failures, []);
  const result = { passed: true, ranking: ranking.items.map((item) => ({ title: item.title, views_today: item.views_today })), first, second, typedInputPreserved: true, homeHeader: headerText, consoleErrors: failures, screenshot: join(fixture, 'search-rolling.png') };
  await writeFile(resolve('collab/active/codex--rolling-search-headlines/evidence/browser-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  for (const child of children.reverse()) {
    if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
  }
}
