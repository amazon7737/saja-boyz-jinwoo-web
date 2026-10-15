# 추가 경계 없는 실제 Next 페이지 재현

제품 앱에서 의존성을 설치한 후 `node collab/active/codex--suspensive-error-boundaries/evidence/review-fix/prepare-qa.mjs`를 실행한다. 출력된 임시 앱 경로에서 `pnpm exec next build --webpack`, `pnpm exec next start --hostname 127.0.0.1 --port 3110`을 실행한다. 제품 디렉터리에 오류 주입 코드를 쓰지 않는다.

1. `/qa-network`, `/qa-configuration`, `/qa-invalid-response`를 각각 연다. 별도 FeatureErrorBoundary 없이 페이지 클라이언트에서 오류가 발생한다.
2. 유형별 안내·검증 도구의 로그·헤더와 하단 메뉴 유지 여부를 확인한다.
3. 검증 도구의 `원인 해소` 후 제품 오류 안내의 `다시 시도`를 누른다. 정상 페이지로 복구해야 한다.
4. `오류 활성화` 후 새로고침하고 제품 헤더의 `사건 검색` 링크를 누른다. 오류 상태가 남지 않고 `/search` 화면으로 이동해야 한다.

CI 회귀 테스트는 실제 설치된 Next ErrorBoundaryHandler를 마운트한다. 위 production Chrome 검증은 별도의 수동 통합 확인이며, CI에 브라우저 실행기·의존성을 추가하지 않았다. root layout은 검증 도구만 추가했고 관련 제품 모듈 7개의 SHA 일치는 source-checks.json에 기록했다.
