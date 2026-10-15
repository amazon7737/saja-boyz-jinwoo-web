# codex/shared-ui-foundation · easter721 · 2026-10-01
- claim: collab/active/codex--shared-ui-foundation/claim.md

## 이벤트
- added src/components/ui/ 검색 헤더·기간/카테고리/상태 필터·사건 배지·하단 메뉴 제공 → amazon은 docs/ui-contract.md의 props와 공용 컴포넌트를 사용하고 중복 구현하지 말 것
- added src/features/incidents/filter-selection.ts 필터 URL 파싱·직렬화·기간 변환 제공 → 지도와 목록은 q/category/status/period 계약을 공유할 것
- changed src/components/layout/app-shell.tsx 홈·목록에 공용 헤더와 필터, 상세·제보에는 전체 화면 레이아웃 적용 → amazon은 화면 본문만 구현할 것
- changed src/app/globals.css 모바일 공용 폭·하단 메뉴 여백·본문 이동 링크 적용 → 화면별 CSS는 전역 파일 대신 각 화면에 둘 것
- added public/figma/shared/ Figma 원본 SVG를 로컬 자산으로 제공 → 원본을 재사용하고 임시 다운로드 URL을 코드에 넣지 말 것
- done src/components/ui/ 공용 UI 선행 구현과 검증 완료 → PR 머지 후 각자 화면 구현을 시작할 것
- rule docs/work-split.md easter721은 지도·검색, amazon은 목록·상세·공유·제보 담당 → 상대 claim과 PR을 확인하고 공유 파일 수정 전 조율할 것

## 검증
- 테스트 172개(단위 8, 훅 84, 루프 48, sobaya 계약 32), lint, 타입 검사, 포맷 검사, 프로덕션 빌드 통과.
- 실행: sh scripts/collab.sh run -- env -u CLAUDE_PROJECT_DIR pnpm run check. 래퍼의 CLAUDE_PROJECT_DIR가 임시 테스트 저장소로 유출되는 첫 실행 실패를 환경 변수 제거로 해결했으며 하네스 코드는 변경하지 않음.
- 브라우저에서 공용 미리보기 디자인, 상태 선택과 메뉴 닫힘, 홈→목록 필터 유지, 초기화 후 검색어 유지를 확인.

## 남은 것
- 이 PR은 공용 UI 선행 범위. 지도·검색 실제 화면은 easter721 후속 작업이며 목록·상세·제보 본문은 amazon 담당.
- 지도 SDK, 뉴스 API, 제보 저장은 연결하지 않음. 현재 사건 화면 본문은 기존 준비 화면.
- amazon의 시작 claim과 분담 수락은 아직 확인되지 않음. 앞선 분담 저널의 ask @amazon을 확인할 것.
- sobaya 미연결 상태여서 직접 구현·검증 루프로 진행함. PR 머지 후 새 브랜치에서 다음 작업을 시작할 것.
