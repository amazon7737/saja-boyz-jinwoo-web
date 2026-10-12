# 지도 위치 복원 검증

- 승인 baseline: `65dc2d90c05975947e8dcfc8e64f77d8875fb92c`, 독립 리뷰 HEAD: `48a0da07c384411ae81c7962c694bca64718ef1a`.
- sobaya 현재 상태 complete, 미완료 항목 없음, review done. 전체 기존 61개 + 신규 3개 = 64개 테스트, Format/Lint gate 통과.
- 각 항목의 measured RED 또는 ALREADY GREEN과 전체 gate 결과는 evidence/sobaya-state.json의 receipts에 보존했다. 첫 항목은 재진입 복원, 두 번째는 Client ID 변경 시 이전 SDK 스크립트 정리까지 검증한다.
- baseline 이후 기존 테스트·helper·fixture·패키지·lock·명령은 변경하지 않았다. 새 제품 모듈과 MapHome 생명주기만 변경했다.
- 격리 소스에서 pnpm run typecheck와 pnpm exec next build --webpack 통과. 빌드·타입 생성은 작업 브랜치의 승인 입력을 변경하지 않도록 별도 QA 디렉토리에서 실행했다.
- 실제 Chrome에서 네이버 Maps SDK와 타일 HTTP 200. 기사 API는 격리 fixture이며 실제 사건 데이터를 지도에 표시하지 않았다. 320/393/1280px 각각 목록→상세→지도, 내 위치→검색→뒤로가기, 자동 위치 재요청 없음, SDK 스크립트 1개, 새로고침 기본 위치, 가로 넘침 없음, pageerror 없음을 확인했다.
- 최초 Chrome probe는 SDK 초기화 직후 타일 대기 없이 이동했고 타일 수집 도메인도 naver.com만 검사해 타일 assertion이 실패했다. QA 스크립트에 렌더링 대기와 naver.net 수집을 추가하고 다시 실행해 실제 타일·화면을 확인했다. 제품 코드·승인 테스트 기준을 바꾸지 않았다.
- 테스트 포맷은 사용자 별도 승인 후 구문 구조 동일성을 확인해 재등록했다. 이전 구현·상태는 /tmp/map-viewport-recovery와 sobaya approval archive에 보존했다. 실패를 검증 체크포인트로 표시하지 않았다.

## 재현

작업 루트에서 `python3 collab/active/codex--map-viewport-persistence/evidence/prepare-qa.py`, `/tmp/map-viewport-product-qa`에서 타입 검사·webpack 빌드, 작업 루트에서 `node collab/active/codex--map-viewport-persistence/evidence/browser-verification.mjs`를 실행한다. 실제 지도 확인에는 ignored local Client ID와 localhost:3000 등록이 필요하며 Secret은 사용하지 않는다. localhost:3000을 다른 프로세스가 사용 중이면 먼저 조율한다. 스크립트는 자신이 시작한 서버·브라우저만 정리한다.
