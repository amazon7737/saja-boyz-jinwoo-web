import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { siteOrigin } from './site-metadata';

test('serviceGuideListsExistingPublicPagesInUtf8', () => {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(
    readFileSync(join(process.cwd(), 'public/llms.txt')),
  );
  expect(text).toContain('# 흉흉');
  expect(text).toContain('지역 대표 좌표');
  expect(text).toContain('기사 발행 시각');
  expect(text).toContain('원문');

  const pages = [
    ['/about', 'src/app/about/page.tsx'],
    ['/archive', 'src/app/archive/page.tsx'],
    ['/incidents', 'src/app/(browse)/incidents/page.tsx'],
    ['/sitemap.xml', 'src/app/sitemap.ts'],
  ];
  for (const [path, source] of pages) {
    expect(text).toContain(`${siteOrigin}${path}`);
    expect(existsSync(join(process.cwd(), source)), path).toBe(true);
  }
});
