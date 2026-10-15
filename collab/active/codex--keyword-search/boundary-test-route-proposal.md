# 기존 오류 경계 테스트 경로 분리 수정안

`featureBoundaryRetriesAndResetsOnNavigation`은 `/search` 이동으로 경계 초기화를 확인한 뒤 동일 pathname으로 AppShell의 일반 브랜드 헤더 보존을 검사한다. 이번 검색 명세는 `/search`의 공용 헤더를 숨기므로 서로 모순된다. 일반 화면 헤더 검증 직전에 경로를 `/incidents`로 되돌려 각 검사 목적을 분리한다.

변경은 다음 한 줄뿐이다. 기존 기대값·오류·재시도·네비게이션 초기화 검사·mock·fixture·검증 명령은 모두 유지한다. 새 검색 테스트는 `/search`에서 헤더 없음, `/incidents`에서 기존 헤더 보존을 검증한다. 정확 입력 변경을 커밋하고 sobaya approve --replace 후 최종 gate·독립 리뷰까지 계속한다.

```diff
--- src/components/errors/feature-error-boundary/error-boundaries.test.ts
+++ src/components/errors/feature-error-boundary/error-boundaries.test.ts
@@
   expect(container.querySelector('[role="alert"]')).toBeNull();
   await draw(null);
+  pathname = '/incidents';
   const { AppShell } = await import('../../layout/app-shell/app-shell');
```
