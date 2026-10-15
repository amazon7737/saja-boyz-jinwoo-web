# codex/article-list-api · amazon · 2026-10-04
- claim: collab/active/codex--article-list-api/claim.md

## 이벤트
- rule 기사 1개를 사건 1개로 표시한다는 사용자 결정을 반영함 → API에 없는 분류·상태·위치·발생 시각을 채우지 말 것.
- touching src/app/incidents/ 및 src/features/article-list/의 실제 기사 목록 연결을 별도 브랜치에서 준비함 → 공용 필터/UI·상세·제보와 중복하지 말 것.
- added collab/active/codex--article-list-api/ 명세·8개 후보 테스트·지원 설정·검증 기록을 준비함 → 정확한 새 입력 승인 전에는 API 화면 구현 완료로 취급하지 말 것.
- rule API total과 offset은 중복 포함 수집 행 기준임 → 이번 연결은 최근 20행 한 배치의 동일 article_id만 제거하며, total을 전체 사건 수로 표시하지 말 것.
- added collab/active/codex--article-list-api/design-check.md 실제 Figma/브라우저 대조 결과 → 기존 카드의 배지색·높이·폰트 차이와 새 라우트의 이중 여백 위험을 참고할 것.

## 검증
- 팀 lock Sobaya 83af28d의 probe로 최종 후보 8개 모두 행동 RED를 확인했다. 누락 import나 가짜 빈 구현을 RED 증거로 사용하지 않았다.
- 제안한 Vitest 별칭 설정을 적용한 격리 복사본에서 기존 전체 13개 테스트가 통과했다.
- 최종 후보 전체 파일의 typecheck·format·lint가 통과했다. pinned 계획 파서의 헤더·본문·대상 일치를 확인했다.
- 운영 API 공개 GET은 health 정상, news total 4와 ready/disabled 이미지 메타데이터를 반환했다. 수집·운영 설정 변경은 하지 않았다.
- 기존 컴포넌트의 Figma 대조는 별도 브라우저 컨텍스트에서 수행했다. API 연결 화면은 구현 전이며 디자인 일치 완료로 주장하지 않는다.

## 남은 것
- `review.md`에 표시된 정확한 테스트·지원 설정과 `spec.proposal.md`를 승인받아 `spec.md`/`failed-test.md`에 기록한 뒤 새 기준선을 생성한다. 기존 완료 브랜치의 승인 상태를 재사용하지 않는다.
- 승인 후에는 pinned runtime `/Users/kangminkim/.codex/worktrees/jinwoo-pinned-runtime/sobaya`를 사용한다. 앱 작업 경로는 `apps/saja-boyz-jinwoo-codex--article-list-api`이며, 워커 실행은 `scripts/collab.sh run -- ...`으로 감싼다.
- 이 작업 트리에는 의존성 버전이 같은 기존 앱의 node_modules 항목을 로컬 링크했다. 공유 package.json/lockfile은 바꾸지 않았다.
- 승인된 항목별 구현·전체 체크포인트, 실제 `/incidents`의 운영 GET·원문 이동·이미지·상태 전환·모바일/데스크톱·Figma 대조, 최종 gate와 독립 review를 마쳐야 한다.
- PR #2는 외부 리뷰 승인이 필요해 병합하지 않았다. 현재 브랜치는 `codex/incident-list@71da47d` 위에 쌓였고 base는 `codex/incident-list`다. dev 통합 시 PR #2의 병합 상태를 다시 확인한다.
- 자동 주기 모니터는 재개하지 않았다. 기존 승인 소스·테스트·공용 UI·API 저장소는 변경하지 않았다.
