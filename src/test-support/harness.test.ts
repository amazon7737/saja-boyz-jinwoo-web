import { execFileSync } from 'node:child_process';
import { test } from 'vitest';

function runHarness(suite: 'hooks' | 'loop' | 'sobaya') {
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  execFileSync('sh', [`tests/${suite}.sh`], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}

test('harness_hooks', () => runHarness('hooks'), 180_000);
test('harness_loop', () => runHarness('loop'), 180_000);
test('harness_sobaya', () => runHarness('sobaya'), 180_000);
