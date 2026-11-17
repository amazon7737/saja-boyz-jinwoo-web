# 검색 스타일 시나리오

```ts
// file: src/components/feedback/style-conventions.test.ts
import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';
```

- [x] styleConventionsAllowCurrentSearchForm — 검색 폼을 포함한 전체 src가 기존 스타일 검사를 통과한다.
```ts
test('styleConventionsAllowCurrentSearchForm', () => {
  const output = execFileSync('sh', ['scripts/check-styles.sh'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  expect(output).toContain('스타일 검사 통과');
});
```

## WebKit 검색 취소 버튼

```ts
// file: src/components/feedback/search-cancel-style.test.ts
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { expect, test } from 'vitest';
```

- [x] searchCancelPreservesWebkitAppearance — 실제 생성된 검색 취소 버튼 CSS에 기존 WebKit 접두 속성이 유지된다.
```ts
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
```
