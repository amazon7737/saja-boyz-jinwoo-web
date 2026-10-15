import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', 'src/test-support/**'],
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'ignore' },
          warnOnUnassignedImports: false,
        },
      ],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['import', 'directive'], next: '*' },
        {
          blankLine: 'always',
          prev: '*',
          next: ['export', 'function', 'class', 'return'],
        },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
]);
