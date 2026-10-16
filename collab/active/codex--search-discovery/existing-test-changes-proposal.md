# 기존 테스트 변경 — 승인 요청

articleDetailSafePresentation 1개의 selector 한 곳만 변경한다. HTML/script 주입, 안전하지 않은 원문·이미지, 날짜 검증 등 기존 검증은 유지한다. 비실행 application/ld+json 스크립트를 명시적으로 제외하며 새 회귀에서 JSON 파싱·데이터 일치·script 탈출을 검증한다.

승인 후 이 테스트 본문만 baseline에서 분리한 뒤 runner가 정확 본문으로 다시 추가한다. 다른 기존114개 테스트 본문은 변경하지 않는다.

전체 변경안: proposed-tests/article-detail.test.ts.txt

```diff
--- before/article-detail.test.ts
+++ after/article-detail.test.ts
@@ -200,7 +200,11 @@
       '안내 <script>alert(1)</script>',
     );
     expect(view.textContent).toContain('"확인"');
-    expect(view.querySelector('script, img, b, time')).toBeNull();
+    expect(
+      view.querySelector(
+        'script:not([type="application/ld+json"]), img, b, time',
+      ),
+    ).toBeNull();
     expect(
       view.querySelector('a[href="https://portal.example.invalid/article"]'),
     ).not.toBeNull();

```
