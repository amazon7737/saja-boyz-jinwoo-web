import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
const origin = `http://127.0.0.1:${port}`;
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NEWS_API_BASE_URL: '' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
app.stdout.on('data', (chunk) => { output += chunk; });
app.stderr.on('data', (chunk) => { output += chunk; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* startup */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert(ready, output);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.route('**/_vercel/insights/script.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.__analyticsTestCalls = window.vaq || []; window.va = (...args) => window.__analyticsTestCalls.push(args);',
  }));
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  await page.waitForFunction(() => window.__analyticsTestCalls?.some(([name, event]) => name === 'pageview' && event.path === '/'));
  assert.equal(await page.locator('script[src$="/_vercel/insights/script.js"]').count(), 1);
  await page.getByRole('link', { name: '기사 키워드 검색', exact: true }).click();
  await page.getByRole('searchbox', { name: '기사 키워드 검색' }).waitFor();
  await page.waitForFunction(() => window.__analyticsTestCalls?.some(([name, event]) => name === 'pageview' && event.path === '/search'));
  assert.equal(await page.locator('script[src$="/_vercel/insights/script.js"]').count(), 1);
  const calls = await page.evaluate(() => window.__analyticsTestCalls.filter(([name]) => name === 'pageview'));
  assert.equal(calls.filter(([, event]) => event.path === '/').length, 1);
  assert.equal(calls.filter(([, event]) => event.path === '/search').length, 1);
  assert.deepEqual(errors, []);
  const result = { passed: true, scriptCount: 1, pageviews: calls, browserErrors: errors, note: 'Real production SDK with a local test script sink. No analytics events sent to Vercel; dashboard ingestion requires deployment.' };
  await writeFile(resolve('collab/active/codex--vercel-web-analytics/evidence/browser-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  if (app.exitCode === null) { const exited = once(app, 'exit'); app.kill('SIGTERM'); await exited; }
}
