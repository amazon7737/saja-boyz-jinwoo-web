# 기사 상세 작업 순서

2026-10-10 · 최신 dev `f5bc8cf`에서 시작.

## 확인한 상태

- 목록·검색은 실제 `/news` API와 연결돼 있다. 공유 ArticleCard는 원문 링크만 표시하고 내부 상세 링크는 없다.
- `/incidents/[id]`는 항상 `notFound()`를 실행한다. `/report`는 준비 안내 화면이며 접수 API도 연결되지 않았다.
- 선행 Go API `GET /news/{article_id}`는 `527532c`로 OCI에 배포했다. 실제 기사와 준비된 이미지 URL이 반환되는 것을 다시 확인했다.
- 소유권은 기존 분담을 따른다. amazon은 목록·상세·제보, easter721은 지도·검색·공용 기반이다.

## 진행 순서

1. **검토본 승인**: `docs/drafts/article-detail/proposal.md`, `review.ko.md`와 `existing-tests.patch`에 명세·실행 입력·기존 4개 테스트의 변경점을 준비했다. 새 기능은 승인받았지만 정확한 신규 테스트와 대체 baseline의 승인은 아직 없다.
2. **명세와 baseline 등록**: 승인 후 명세를 새 `spec.md`, 신규 계획을 `failed-test.md`로 등록하고 승인된 기존 테스트 패치를 적용한다. 대체한 기존 테스트 4개는 현재 구현에서도 GREEN이므로 baseline을 먼저 RED로 만들지 않는다. 다른 테스트·헤더·헬퍼는 보존한다.
3. **순차 구현**: 팀 고정 Sobaya `83af28d`와 `scripts/collab.sh run -- ...`을 사용해 8개 항목을 구현한다. 사용할 런타임은 `/Users/kangminkim/.codex/worktrees/jinwoo-pinned-runtime/sobaya`다. 상세→오류→안전한 표시→타임아웃→이미지 오류→공유→목록/검색 진입→로딩/404 순서다.
4. **완료·PR**: 전체 테스트·포맷·lint·타입·빌드, 실제 API·브라우저 확인, gate·독립 리뷰 후 plan을 보관하고 `dev` 대상 PR을 연다. 사용자가 PR 생성을 이미 요청했다.

Figma 상세 `11:2043`과 공유 `34:3311`을 다시 확인했다. 표시 데이터는 이미지와 AI 생성 표시, 제목, 기사 발행 시각, description 요약, 원문 링크다. 공유는 기본 Web Share와 클립보드/수동 URL 대체를 사용한다.

확인해야 할 화면 동작은 loading, 실제 404와 API 장애의 구분, 재시도, 이미지 실패 대체, 안전한 원문 URL, 좁은 화면의 배치다. 공유 API helper와 레이아웃의 변경 필요성은 화면 명세 시점에 결정하며 현재는 수정하지 않는다.

제보는 제출 대상 API·첨부 저장·필수 항목을 정한 뒤 별도 기능으로 진행한다. 이번 착수로 자동 포함하지 않는다.

## 별도 리뷰 사항

PR #8에 대해 재현한 네이버 지도 인증 실패 시 오류 안내/재시도가 누락되는 문제는 `dev f5bc8cf`에도 남아 있다. 상세 작업 범위와 소유권을 넓혀 지도 코드를 수정하지 않는다.

## 현재 단계

기존 40개 테스트 PASS. 신규 8개 probe RED, 기존 4개 대체안 probe GREEN. 단계별 lint와 가상 TypeScript 검사 및 독립 초안 리뷰 완료. 프런트 제품 코드·기존 테스트·spec.md는 아직 변경하지 않았다. 증거와 한계는 `docs/drafts/article-detail/verification.md`에 기록한다.

직접 `doctor.sh`를 실행하면 `.githooks/pre-commit`을 사용자 훅으로 경고한다. 이 앱의 기존 협업 훅은 공통 git-dir의 Sobaya 관리 훅으로 연결하며, 그 훅은 이미 고정 런타임을 가리킨다. 훅·루트 하네스·팀 lock을 덮어쓰지 않는다. 현재 baseline 미등록은 승인 전 상태이므로 정상이다.
