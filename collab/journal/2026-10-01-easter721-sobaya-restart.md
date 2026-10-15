# codex/shared-ui-foundation · easter721 · 2026-10-01
- claim: collab/active/codex--shared-ui-foundation/claim.md

## 이벤트
- removed src/components/ui/ 직접 구현한 공용 UI 전체 제거 → amazon은 기존 구현을 가져오지 말고 새 sobaya 선행 PR을 기다릴 것
- removed src/features/incidents/filter-selection.ts 직접 구현한 URL 유틸과 추가 테스트 제거 → 초기 사건 타입과 filterIncidents만 현재 사용 가능
- removed public/figma/shared/ 기존 UI 자산 제거 → sobaya 재개발 단계에서 Figma 원본을 다시 확보할 것
- changed src/components/layout/app-shell.tsx 초기 main scaffold로 복원 → 새 공용 UI 계약은 목표이며 아직 구현되지 않았음
- changed src/app/globals.css 초기 main 스타일로 복원 → 후속 sobaya 워커가 공용 디자인을 구현할 것
- supersedes public/figma/shared/ 앞선 자산 제공 이벤트 무효 → 자산 재개발 완료 전에는 사용하지 말 것
- added docs/sobaya-restart-approval.md 명세·Test 계약·전체 하네스 지원 코드 승인안 → 승인 전 approve.sh와 구현 워커를 실행하지 말 것
- changed harness/config.sh 기존 sobaya/apps 자동 감지를 우선하고 형제 클론을 차선으로 탐색 → 별도 위치는 SOBAYA_ROOT 환경 변수 지정
- changed tests/sobaya.sh 미결합 가짜 저장소에서 실제 앱 lock 상속 제거 → 테스트 기대값은 그대로이며 승인 baseline 전 준비 수정임

## 남은 것
- git diff origin/main -- src 결과 없음: 초기 src와 일치.
- sobaya 공식 probe: browseChrome, navigationKeepsFilters, selectedFilters, immersiveRoutes 모두 실행된 assertion 실패로 RED. 환경·import 오류 아님.
- pnpm 검사 계약 변경안은 승인 대기. 패키지 관리는 pnpm 유지. 정확한 테스트 초안은 claim 폴더에 공유.
- 사용자 승인 후 명세와 검사 지원을 반영하고 approve → loop → gate → 독립 review를 실행해야 함. 개발 완료 아님.
- PR #1은 계속 초안이며 이 삭제 커밋은 초기환경 복원 단계다.
