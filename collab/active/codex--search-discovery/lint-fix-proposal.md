# 승인 테스트 변수명만 수정하는 추가 제안

## 원인과 수정
- 첫 신규 테스트 구현 뒤 필수 Lint에서 Next no-assign-module-variable 규칙이 승인된 테스트의 module 지역 변수를 차단했다. 승인 전 제안자가 해당 린트를 누락했다.
- 테스트 이름·기대값·mock·fixture·검증 순서는 그대로 유지하고 module → routeModule 변수명만 바꾼다. 길이에 따른 Prettier 줄바꿈만 함께 확정.
- spec.md와 기존 보안1개 변경안은 그대로. 린트 설정·전체 Test 명령·테스트 수를 바꾸지 않는다.
- 정확 전체 파일: lint-fix-source.txt. 정확 전체 plan: lint-fix-failed-test-proposal.md.
- 임시 복사본에서 저장소 Prettier 설정을 명시한 포맷·Next ESLint·TypeScript 전체 타입 검사 exit0 확인.
- 승인 후 현재 소바야 구현 소스를 유지하고 새 정확 헤더/plan을 반영해 approve --replace로 이전 승인 기록을 보존한다. 이미 구현된 첫 항목은 ALREADY GREEN 및 전체 스위트로 검증하고 다음6항목을 이어간다.
- 첫 metadata 구현은 full checkpoint 완료 전이다. 추가 승인 전에는 기존 테스트/기대값 원본을 수정하지 않는다.

## 정확 diff
```diff
--- approved/search-discovery.test.ts
+++ proposed/search-discovery.test.ts
@@ -50,14 +50,14 @@
   return (await loader()) as Record<string, unknown>;
 }
 async function metadata(path: string, input = props()) {
-  const module = await load(path);
-  if (typeof module.generateMetadata === 'function')
-    return (module.generateMetadata as MetadataRoute)(input);
+  const routeModule = await load(path);
+  if (typeof routeModule.generateMetadata === 'function')
+    return (routeModule.generateMetadata as MetadataRoute)(input);
   assert(
-    module.metadata && typeof module.metadata === 'object',
+    routeModule.metadata && typeof routeModule.metadata === 'object',
     path + ' 메타데이터가 있어야 한다',
   );
-  return module.metadata as Metadata;
+  return routeModule.metadata as Metadata;
 }
 function view(tree: ReactNode) {
   const container = document.createElement('div');
@@ -140,8 +140,8 @@
   });
   expect(JSON.stringify(info.openGraph)).not.toContain(apiOrigin + '/images/');
   expect(JSON.stringify(info)).not.toContain('publisher:');
-  const module = await load('./incidents/[id]/page.tsx');
-  const container = view(await (module.default as Route)(props()));
+  const routeModule = await load('./incidents/[id]/page.tsx');
+  const container = view(await (routeModule.default as Route)(props()));
   expect(container.querySelector('h1')?.textContent).toBe(info.title);
   expect(
     container.querySelector('section[aria-label="기사 요약"]')?.textContent,
@@ -177,7 +177,7 @@
   invalid.article.originallink = 'javascript:alert(1)';
   invalid.article.link = 'data:text/html,unsafe';
   request.mockImplementation(async () => Response.json(invalid));
-  const safe = view(await (module.default as Route)(props()));
+  const safe = view(await (routeModule.default as Route)(props()));
   expect(JSON.stringify(graphs(safe))).not.toMatch(
     /javascript:|data:text|2026-02-31|datePublished/,
   );
@@ -283,8 +283,8 @@
 });
 
 test('serverArchiveLinksOlderRawPagesWithoutReplacingInfiniteScroll', async () => {
-  const module = await load('./archive/page.tsx');
-  assert(typeof module.default === 'function');
+  const routeModule = await load('./archive/page.tsx');
+  assert(typeof routeModule.default === 'function');
   const fixtures = Array.from({ length: 20 }, (_, index) =>
     item((index + 21).toString(16).padStart(64, '0')),
   );
@@ -292,7 +292,7 @@
   request.mockImplementation(async () =>
     Response.json({ total: 41, items: fixtures }),
   );
-  const container = view(await (module.default as Route)(props('2')));
+  const container = view(await (routeModule.default as Route)(props('2')));
   expect(container.querySelectorAll('article')).toHaveLength(19);
   expect(container.querySelector('a[href="/archive"]')).not.toBeNull();
   expect(container.querySelector('a[href="/archive?page=3"]')).not.toBeNull();
@@ -312,7 +312,7 @@
   });
   request.mockReset();
   for (const page of ['0', '-1', '1.5', 'x', '9007199254740992']) {
-    await expect((module.default as Route)(props(page))).rejects.toThrow(
+    await expect((routeModule.default as Route)(props(page))).rejects.toThrow(
       'TEST_SEO_NOT_FOUND',
     );
   }
@@ -320,17 +320,17 @@
   request.mockImplementation(async () =>
     Response.json({ total: 41, items: [] }),
   );
-  const end = view(await (module.default as Route)(props('4')));
+  const end = view(await (routeModule.default as Route)(props('4')));
   expect(end.querySelector('a[href="/archive?page=5"]')).toBeNull();
   request.mockImplementation(async () => new Response('', { status: 503 }));
-  const failed = view(await (module.default as Route)(props('2')));
+  const failed = view(await (routeModule.default as Route)(props('2')));
   expect(failed.querySelector('[role="alert"]')).not.toBeNull();
   expect(failed.querySelector('a[href="/archive?page=2"]')).not.toBeNull();
 });
 
 test('serviceAnswersAreVisibleAndReachableWithoutMapJavaScript', async () => {
-  const module = await load('./about/page.tsx');
-  const container = view(await (module.default as Route)(props()));
+  const routeModule = await load('./about/page.tsx');
+  const container = view(await (routeModule.default as Route)(props()));
   expect(container.querySelector('h1')?.textContent).toContain('흉흉');
   for (const text of [
     '내 주변의 사건 사고',

```
