import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const screenshots = await mkdtemp(join(tmpdir(), 'poem-filter-style-'));
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
const origin = `http://127.0.0.1:${port}`;
let output = '';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NEWS_API_BASE_URL: '', NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: 'local-style-test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**://oapi.map.naver.com/**', (route) => route.abort());
  const checks = [];
  for (const width of [320, 393, 1440]) {
    await page.setViewportSize({ width, height: 852 });
    await page.goto(origin);
    let baseline;
    for (const label of ['기간', '카테고리', '상태']) {
      const trigger = page.getByRole('button', { name: label, exact: true });
      await trigger.click();
      const panel = page.getByRole('group', { name: label + ' 선택', exact: true });
      await panel.waitFor();
      const styles = await panel.evaluate((node) => {
        const selected = node.querySelector('button[aria-pressed=true]');
        const a = getComputedStyle(node), b = getComputedStyle(selected);
        const box = node.getBoundingClientRect();
        return {
          panel: { background: a.backgroundColor, border: a.border, radius: a.borderRadius, padding: a.padding, shadow: a.boxShadow },
          selected: { background: b.backgroundColor, color: b.color, radius: b.borderRadius, padding: b.padding, fontSize: b.fontSize, fontWeight: b.fontWeight, lineHeight: b.lineHeight },
          box: { left: box.left, right: box.right, width: box.width },
        };
      });
      const visual = { panel: styles.panel, selected: styles.selected };
      baseline ??= visual;
      assert.deepEqual(visual, baseline, `${width}px ${label} common computed styles`);
      assert(styles.box.left >= 0 && styles.box.right <= width, `${width}px ${label} viewport bounds`);
      if (label !== '기간') {
        const disabled = await panel.locator('button:disabled').count();
        assert.equal(disabled, label === '카테고리' ? 4 : 3);
      }
      if (width === 393) await page.screenshot({ path: join(screenshots, label + '.png') });
      await page.keyboard.press('Escape');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert(await trigger.evaluate((node) => node === document.activeElement));
      checks.push({ width, label, ...styles });
    }
  }
  const result = { passed: true, checks, screenshots, note: 'Synthetic map configuration; no live map or news API called.' };
  await writeFile(resolve('collab/active/codex--unify-map-filter-style/evidence/browser-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, checks: checks.length, screenshots }));
} finally {
  await browser?.close();
  if (app.exitCode === null) { const exited = once(app, 'exit'); app.kill('SIGTERM'); await exited; }
}
