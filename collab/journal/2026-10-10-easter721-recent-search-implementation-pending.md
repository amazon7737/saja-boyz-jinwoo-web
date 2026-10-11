# codex/recent-searches · easter721 · 2026-10-10

- claim: collab/active/codex--recent-searches/claim.md

## 이벤트

- supersedes collab/journal/2026-10-10-easter721-recent-search-draft-pr.md 드래프트의 제품 미구현 상태는 이후 사용자 구현 지시와 세 sobaya 체크포인트로 대체됨 → PR #9의 최신 제품 diff를 확인할 것. 기능 전체 완료는 아님.
- added src/features/search/ui/recent-searches/recent-searches.tsx 브라우저 기록 복원·실행 검색 저장·최신 순·최대 10개·개별 삭제 구현 → 중복 구현하지 말 것. 기존 검색 API와 지도는 그대로 유지됨.
- rule collab/active/codex--recent-searches/test-selector-fix-proposal.md jsdom 27.4.0은 & 포함 aria-label 속성 선택자 조회가 React 없는 최소 재현에서도 실패함 → 승인 전 테스트를 고치거나 접근성 이름을 바꾸지 말 것.

## 남은 것

- 체크포인트 0416019·caa7701·0679a6b는 각각 전체 41·42·43개 테스트와 Format/Lint를 통과해 push됐다. 신규 4번째 항목에서 jsdom 선택자 결함으로 sobaya가 needs_human, active implement 상태를 보존했다. 신규 5번째 항목·최종 gate·독립 리뷰는 미완료.
- 사용자에게 조회 문법만 바꾸는 정확 수정안 승인을 요청했다. 임시 복사본에서는 해당 수정안의 4번째 테스트가 통과했다. 원래 승인된 테스트/계획은 변경하지 않았다.
- 실제 Chrome에서 폼·추천·최근 링크·재검색 중복 정리·삭제 시 API 요청 없음·새로고침 뒤 삭제 유지·실패 검색 기록·최대 10개·HTML 문자열 텍스트 출력, 320/393/1280px 가로 넘침 없음, 저장소 접근/쓰기 차단 시 검색 유지와 pageerror 없음 확인. 별도 복사본 타입/webpack 프로덕션 빌드 통과.
- 발견한 제품 결함: 저장값 복원 시 trim과 중복 정리 누락, Tailwind preflight 없는 기본 스타일 때문에 행의 하단 이외 테두리 표시. 승인된 명세 범위에서 source 보완 후 실제 Chrome 전체 검증을 다시 진행해야 한다.
- 이 인수인계는 진행 상태 기록이며 완료 기록이 아니다. 활성 항목의 HEAD 바인딩을 보존하기 위해 claim·수정 제안·본 저널은 아직 커밋하지 않았다. 사용자 승인 후 입력 변경 커밋 및 approve.sh --replace로 새 기준을 기록하고 이전 이력을 보존할 것.
- /tmp/recent-search-product-qa의 제품 서버 localhost:3821과 로컬 QA API localhost:3820은 실행 중이다. 실제 API 연결 개발 서버로 소개하지 말 것.
