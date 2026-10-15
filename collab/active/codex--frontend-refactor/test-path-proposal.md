# 리팩터링 테스트 경로 변경 초안

기존 테스트 본문·기대값·mock·fixture는 유지한다. 아래 diff와 파일 이동만 승인 대상으로 한다. API 라우트 테스트와 하네스 테스트는 유지한다. .test.ts를 유지하므로 수집 설정 변경은 없다.

## src/features/article-list/article-image-error.test.ts → src/features/article-list/ui/article-list/article-list.test.ts

```diff
--- src/features/article-list/article-image-error.test.ts
+++ src/features/article-list/ui/article-list/article-list.test.ts
@@ -1,9 +1,10 @@
-// file: src/features/article-list/article-image-error.test.ts
+// file: src/features/article-list/ui/article-list/article-list.test.ts
 // @vitest-environment jsdom
 import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
 import { act, createElement } from 'react';
 import { createRoot, type Root } from 'react-dom/client';
-import { ArticleList, type ArticleCollectionItem } from './article-list';
+import { ArticleList } from './article-list';
+import type { ArticleCollectionItem } from '../../model/article.types';
 
 const apiOrigin = 'https://news.example.invalid';
 const idA = 'a'.repeat(64);
```

## src/features/incident-list/incident-list.test.ts → src/features/incident-list/ui/incident-list/incident-list.test.ts

```diff
--- src/features/incident-list/incident-list.test.ts
+++ src/features/incident-list/ui/incident-list/incident-list.test.ts
@@ -1,8 +1,8 @@
-// file: src/features/incident-list/incident-list.test.ts
+// file: src/features/incident-list/ui/incident-list/incident-list.test.ts
 import { expect, test } from 'vitest';
 import { createElement } from 'react';
 import { renderToStaticMarkup } from 'react-dom/server';
-import type { Incident } from '../incidents/types';
+import type { Incident } from '@/features/incidents/model/types';
 import { IncidentList } from './incident-list';
 
 const now = new Date('2026-10-02T03:00:00.000Z');
```

## src/features/incidents/filter-incidents.test.ts → src/features/incidents/model/filter-incidents.test.ts

```diff
```

## src/components/errors/error-boundaries.test.ts → src/components/errors/feature-error-boundary/error-boundaries.test.ts

```diff
--- src/components/errors/error-boundaries.test.ts
+++ src/components/errors/feature-error-boundary/error-boundaries.test.ts
@@ -1,4 +1,4 @@
-// file: src/components/errors/error-boundaries.test.ts
+// file: src/components/errors/feature-error-boundary/error-boundaries.test.ts
 // @vitest-environment jsdom
 import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
 import { act, createElement, type ComponentType, type ReactNode } from 'react';
@@ -8,8 +8,8 @@
 vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
 const modules = import.meta.glob([
   './feature-error-boundary.tsx',
-  '../../app/error.tsx',
-  '../../app/global-error.tsx',
+  '../../../app/error.tsx',
+  '../../../app/global-error.tsx',
 ]);
 let container: HTMLDivElement;
 let root: Root;
@@ -114,7 +114,7 @@
   expect(container.textContent).toContain('정상 내용');
   expect(container.querySelector('[role="alert"]')).toBeNull();
   await draw(null);
-  const { AppShell } = await import('../layout/app-shell');
+  const { AppShell } = await import('../../layout/app-shell/app-shell');
   await draw(
     createElement(
       AppShell,
@@ -129,7 +129,7 @@
 });
 
 test('nextRouteErrorBridgesResetSafely', async () => {
-  for (const path of ['../../app/error.tsx', '../../app/global-error.tsx']) {
+  for (const path of ['../../../app/error.tsx', '../../../app/global-error.tsx']) {
     await draw(null);
     const load = modules[path];
     expect(load, `${path}가 있어야 한다`).toBeTypeOf('function');
```

## src/components/errors/next-error-boundary.test.ts → src/components/errors/feature-error-boundary/next-error-boundary.test.ts

```diff
--- src/components/errors/next-error-boundary.test.ts
+++ src/components/errors/feature-error-boundary/next-error-boundary.test.ts
@@ -1,12 +1,12 @@
-// file: src/components/errors/next-error-boundary.test.ts
+// file: src/components/errors/feature-error-boundary/next-error-boundary.test.ts
 // @vitest-environment jsdom
 import { afterEach, beforeEach, expect, test, vi } from 'vitest';
 import { act, createElement } from 'react';
 import { createRoot, type Root } from 'react-dom/client';
 import { ErrorBoundaryHandler } from 'next/dist/client/components/error-boundary';
-import { AppShell } from '../layout/app-shell';
-import { FeatureError } from './feature-error-boundary';
-import RouteError from '../../app/error';
+import { AppShell } from '../../layout/app-shell/app-shell';
+import { FeatureError } from '../model/feature-error';
+import RouteError from '../../../app/error';
 
 let pathname = '/incidents';
 vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
```
