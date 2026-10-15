import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = process.cwd();
const require = createRequire(root + '/package.json');
const { ESLint } = require('eslint');
const eslint = new ESLint({ cwd: root });
const bad =
  "import type { ReactNode } from 'react';\nexport function example(value: ReactNode) {\n  const result = value;\n  return result;\n}\n";
const good =
  "import type { ReactNode } from 'react';\n\nexport function example(value: ReactNode) {\n  const result = value;\n\n  return result;\n}\n";
const [invalid] = await eslint.lintText(bad, {
  filePath: root + '/src/app/convention-probe.ts',
});
assert(
  invalid.messages.some((m) => m.ruleId === 'padding-line-between-statements'),
);
const [valid] = await eslint.lintText(good, {
  filePath: root + '/src/app/convention-probe.ts',
});
assert.equal(valid.errorCount, 0);
const [excluded] = await eslint.lintText(bad, {
  filePath: root + '/src/app/convention-probe.test.ts',
});
assert.equal(
  excluded.messages.filter((m) =>
    ['import/order', 'padding-line-between-statements'].includes(m.ruleId),
  ).length,
  0,
);
const badGroups =
  "import { AppShell } from '@/components/layout/app-shell/app-shell';\nimport type { ReactNode } from 'react';\n\nexport type Example = ReactNode;\nexport { AppShell };\n";
const [groups] = await eslint.lintText(badGroups, {
  filePath: root + '/src/app/convention-probe.ts',
});
assert(groups.messages.some((m) => m.ruleId === 'import/order'));
const productConfig = await eslint.calculateConfigForFile(
  root + '/src/app/layout.tsx',
);
const testConfig = await eslint.calculateConfigForFile(
  root + '/src/app/incidents/article-list-pagination.test.ts',
);
assert.equal(productConfig.rules['import/order'][0], 2);
assert.equal(productConfig.rules['padding-line-between-statements'][0], 2);
assert(!testConfig.rules['import/order']);
assert(!testConfig.rules['padding-line-between-statements']);
assert(testConfig.rules['react-hooks/rules-of-hooks']);
console.log(
  JSON.stringify(
    {
      invalidFormattingRejected: true,
      invalidImportGroupsRejected: true,
      validFormattingAccepted: true,
      testStyleExcluded: true,
      existingNextLintPreserved: true,
      invalidRules: invalid.messages.map((m) => m.ruleId),
    },
    null,
    2,
  ),
);
