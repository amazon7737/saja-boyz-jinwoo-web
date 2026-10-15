# PR #5 Next 오류 경계 연결 수정 검증

## 수정과 기준

아마존의 98a57df 리뷰에서 지적한 Next 경계 순서를 수정했다. RouteError는 unknown 입력을 받아 실제 클라이언트 FeatureError만 유형별 안내와 안전한 reason 로그로 처리한다. 서버 오류의 원래 클래스 보존을 가정하지 않고 일반 안내·retry 우선/reset 호환을 유지한다. 기존 API·이미지·AppShell 코드는 변경하지 않았다.

승인 baseline bb39124, 핵심 구현 체크포인트 7bb810c, 두 번째 회귀 체크포인트 65db84f. Sobaya가 첫 항목 RED → GREEN, 두 번째 항목 ALREADY GREEN으로 검증했다. 전체 28개 테스트·포맷·lint 통과. 최종 두 테스트가 모두 포함된 제품 코드에서 pnpm run typecheck와 pnpm run build(Turbopack)도 직접 통과했다. 제품 빌드에는 QA 라우트가 없다.

## 실제 Next 페이지 통합 확인

[evidence/review-fix/browser-observations.md](evidence/review-fix/browser-observations.md)와 browser-results.json에 기록했다. Next 16.3.8 production(webpack)과 Chrome에서 추가 FeatureErrorBoundary 없이 세 클라이언트 오류를 각각 발생시켰다. 유형별 안내·console.error reason 로그, 원인 해소 후 제품 재시도, 오류 상태에서 제품 검색 Link를 통한 경로 복구, 브랜드·내비게이션 유지가 모두 확인됐다. 최종 소스로 재빌드·재검증했고 관련 제품 파일 7개의 SHA-256이 QA 앱과 일치한다.

[evidence/review-fix/reproduction.md](evidence/review-fix/reproduction.md)와 prepare-qa.mjs로 재현할 수 있다. QAControls는 AppShell 앞에서 원인 제어와 로그 관찰만 하며 오류 경계를 추가하지 않는다. Fault도 오류 경계를 추가하지 않는다. 임시 앱을 사용하므로 제품 라우트에 오류 주입 코드를 넣지 않는다. CI 통합 테스트는 설치된 Next ErrorBoundaryHandler를 사용하며, production Chrome 검증은 별도 수동 확인이다. 브라우저 E2E 의존성을 추가하지 않았다.

기존 evidence/fault-client.tsx.txt와 기존 browser-observations.md는 최초 경계 단독 검증의 역사적 기록이다. 실제 페이지 연결 검증은 이번 review-fix 증거로 정정한다.

## 독립 리뷰

첫 fresh read-only 리뷰는 구현의 기능 결함이나 범위 이탈을 찾지 못했으나, 새 브라우저 증거가 아직 커밋되지 않았다는 P2를 보고했다. 실제 수행한 fixture와 production 결과를 이 커밋에 추가한다. 이 증거를 포함한 리비전의 최종 gate·독립 리뷰를 다시 진행한다. 리뷰어 테스트 실행의 임시 파일 EPERM 한계는 호스트 gate·실제 브라우저 확인과 구분한다.

## 최종 완료

증거를 포함한 리비전 `350899a6e804106facc5b4a0ca2cc5d4dbbf59af`에서 Sobaya 최종 gate·fresh 독립 리뷰가 완료됐다. 추가 조치가 필요한 결함 없음. 리뷰어는 문구·로그·재시도·회귀 검증과 새 프로덕션 증거를 확인하고 제품 파일 7개 해시도 직접 비교했다. 읽기 전용 환경의 EPERM 때문에 리뷰어 자체 테스트 재실행은 불가능했으며, 실행 통과는 호스트 Sobaya gate·제품 타입/빌드·Chrome 관찰로 확인했다. raw 보고서와 완료 상태는 evidence/review-fix/independent-review.json 및 completion.json에 보관했다.

이후 계획 보관·claim·저널·최종 검증 기록 커밋은 제품 소스·테스트·의존성을 변경하지 않는다. GitHub 필수 CI와 아마존 재리뷰는 최종 push 뒤 확인·요청한다.
