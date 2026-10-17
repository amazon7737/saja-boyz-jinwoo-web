# codex/pr38-main-ancestry · amazon · 2026-10-17
- claim: collab/active/codex--pr38-main-ancestry/claim.md

## 이벤트
- rule 이번 PR38 통합에 한해 사용자가 merge commit 예외를 승인함 → 필수 CI와 다른 사람의 최신 head 승인 뒤 dev에 merge commit으로 반영할 것.
- changed src/features/map/ui/map-home/map-home.tsx main 이력을 연결하며 충돌을 dev 내용으로 해결했고 dev 대비 제품 변경은 없음 → 브랜드 아이콘·자동 위치·안내 배치를 그대로 보존할 것.

## 검증
- 기준 dev: 4fb8e914a6cfa77196ff98187591f918d303d824, main: ee2eacac851b4b6bdb2a84d4c8b8a264696422e9.
- 충돌 해결 전체 트리 f85eaf638a4ae3abe44318638339dd1b7c74d848는 기준 dev 트리와 동일함. 이번 claim·저널만 별도 추가함.
- 동일 제품 트리에서 전체 Vitest 29개 파일·121개 테스트, 타입 검사, lint(기존 경고 3개), 포맷, 스타일 검사, 프로덕션 빌드 통과.
- 통합 PR의 최종 head 필수 CI 결과와 독립 승인 리뷰는 GitHub에서 별도 확인한다.

## 남은 것
- 통합 PR 하나의 필수 CI·독립 승인 후 merge commit으로 dev에 반영하고 PR38의 mergeable을 확인한다.
- PR38의 main 최종 병합·배포는 수행하지 않는다. 보호 우회·강제 push·이력 재작성은 하지 않는다.
