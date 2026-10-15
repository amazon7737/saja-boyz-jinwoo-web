# 검색 테스트 문법·포맷 수정안

승인된 신규 검색 테스트에서 `module` 변수명이 Next의 `@next/next/no-assign-module-variable`에 걸렸다. 전체 32개 동작 테스트 및 타입 검사는 통과했지만 형식·린트 검사로 checkpoint가 중단됐다.

다음 정확 diff만 신규 테스트와 failed-test.md의 해당 코드 블록에 반영한다. `module` → `loadingModule` 식별자와 Prettier 포맷만 변경한다. 테스트 기대값·mock·fixture·기존 28개 테스트·검증 명령·명세·제품 동작은 유지한다. 변경된 정확 입력을 커밋하고 sobaya approve --replace 후 계속한다.

```diff
--- src/app/search/search-page.test.ts
+++ src/app/search/search-page.test.ts
@@ -94,9 +94,7 @@
   const empty = await renderSearch('화재');
   const status = empty.querySelector('[role="status"]');
   assert(status);
-  expect(status.textContent).toContain(
-    '검색 결과가 없어요',
-  );
+  expect(status.textContent).toContain('검색 결과가 없어요');
   expect(empty.querySelector('[role="alert"]')).toBeNull();
   mock.mockRejectedValueOnce(new Error('PRIVATE_SERVER_DETAIL'));
   const failed = await renderSearch('서울 & 화재');
@@ -116,9 +114,11 @@
   expect(url.searchParams.get('q')).toBe('서울 & 화재');
   const load = loadingModules['./loading.tsx'];
   assert(load);
-  const module = (await load()) as { default: ComponentType };
+  const loadingModule = (await load()) as { default: ComponentType };
   const loading = document.createElement('div');
-  loading.innerHTML = renderToStaticMarkup(createElement(module.default));
+  loading.innerHTML = renderToStaticMarkup(
+    createElement(loadingModule.default),
+  );
   expect(
     loading.querySelector('[role="status"][aria-busy="true"]'),
   ).not.toBeNull();
```
