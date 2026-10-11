import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = process.cwd();
const require = createRequire(root + '/package.json');
const ts = require('typescript');
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const baseline = process.argv[2] ?? '11dce4241a11b7fe3b66cbb07e30eda1d492abb6';
const changed = git('diff', '--name-only', baseline)
  .trim()
  .split('\n')
  .filter(Boolean);
const protectedPattern =
  /(?:\.test\.[cm]?[jt]sx?$|(?:^|\/)(?:tests|test-support|fixtures)(?:\/|$))/;
const protectedChanges = changed.filter((p) => protectedPattern.test(p));
assert.deepEqual(
  protectedChanges,
  [],
  'Existing tests, support and fixtures must not change',
);
for (const path of ['package.json', 'pnpm-lock.yaml']) {
  assert.equal(
    readFileSync(root + '/' + path, 'utf8'),
    git('show', baseline + ':' + path),
    path + ' must remain identical',
  );
}
function tree(node) {
  const children = [];
  ts.forEachChild(node, (n) => children.push(tree(n)) && undefined);
  const text =
    ts.isIdentifier(node) ||
    ts.isStringLiteralLike(node) ||
    ts.isNumericLiteral(node)
      ? node.text
      : undefined;
  return { kind: node.kind, ...(text === undefined ? {} : { text }), children };
}
function canonical(path, source) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const imports = file.statements.filter(ts.isImportDeclaration);
  const sideEffects = imports
    .filter((n) => !n.importClause)
    .map((n) => n.moduleSpecifier.text);
  const importTrees = imports.map((n) => JSON.stringify(tree(n))).sort();
  const rest = file.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map(tree);
  return { sideEffects, importTrees, rest };
}
const sources = changed.filter((p) => /^src\/.*\.tsx?$/.test(p));
const automatic = [],
  manual = [];
for (const path of sources) {
  const before = git('show', baseline + ':' + path);
  const after = readFileSync(root + '/' + path, 'utf8');
  const previous = canonical(path, before),
    next = canonical(path, after);
  assert.deepEqual(
    next.sideEffects,
    previous.sideEffects,
    path + ' side-effect imports',
  );
  assert.deepEqual(
    next.importTrees,
    previous.importTrees,
    path + ' imports preserve declarations',
  );
  if (path === 'src/components/layout/app-shell/app-shell.tsx') {
    manual.push(path);
    continue;
  }
  assert.deepEqual(
    next.rest,
    previous.rest,
    path + ' AST changed beyond whitespace/import grouping',
  );
  automatic.push(path);
}
console.log(
  JSON.stringify(
    {
      baseline,
      testsUnchanged: true,
      packagesUnchanged: true,
      astEquivalent: automatic,
      manualReview: manual,
    },
    null,
    2,
  ),
);
