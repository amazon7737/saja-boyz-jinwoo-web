// file: src/components/feedback/search-cancel-style.test.ts
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { expect, test } from 'vitest';

test('searchCancelPreservesWebkitAppearance', async () => {
  const result = await postcss([tailwind()]).process(
    await readFile('src/app/globals.css', 'utf8'),
    { from: 'src/app/globals.css' },
  );
  const declarations: string[] = [];
  result.root.walkRules((rule) => {
    if (!rule.selector.includes('::-webkit-search-cancel-button')) return;
    rule.walkDecls((declaration) => {
      declarations.push(`${declaration.prop}:${declaration.value}`);
    });
  });
  expect(declarations).toContain('-webkit-appearance:none');
});
