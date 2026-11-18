// file: src/components/feedback/style-conventions.test.ts
import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';

test('styleConventionsAllowCurrentSearchForm', () => {
  const output = execFileSync('sh', ['scripts/check-styles.sh'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  expect(output).toContain('스타일 검사 통과');
});
