# 기사 상세·목록 진입·공유 완료

2026-10-11 · @amazon · `codex/article-detail` · 대상 `dev`

## 이벤트

- added src/app/incidents/[id]/ `GET /news/{article_id}`를 직접 조회하는 기사 상세·로딩·기사 없음 화면 → 상세 링크는 `/incidents/{article_id}`를 사용할 것.
- changed src/features/article-list/ui/article-card/article-card.tsx 제목을 내부 상세 링크로 연결하고 원문 링크를 별도로 유지 → 목록과 검색 결과에서 동일한 진입 동작을 재사용할 것.
- added src/app/incidents/[id]/detail-share.tsx 기본 공유·취소·클립보드·수동 복사 처리 → 공유에는 추적 파라미터 없는 프런트 상세 URL을 사용할 것.
- done src/app/incidents/[id]/ 승인 항목 8개, 전체 테스트 48개 및 최종 독립 리뷰 완료 → 아래 검증 리비전과 보관된 승인 기준으로 PR을 검토할 것.
- supersedes collab/journal/2026-10-11-amazon-article-detail-start.md 구현 시작 상태를 완료 상태로 갱신.

## 제공 동작

- 최신 단건 응답을 5초 제한으로 읽으며, 제목·description 요약·발행 시각·안전한 원문 URL·준비된 AI 이미지를 표시한다.
- 잘못된 ID/API 404와 설정·통신·응답 형식 오류를 구분한다. 재시도는 같은 상세 주소를 다시 조회한다.
- 이미지 로딩이 실패하면 대체 표시로 전환하고 AI 이미지 문구를 없앤다. 기사 내용·원문·공유는 유지한다.
- Figma 상세 11:2043을 현재 AppShell 안에 적용했다. 승인 범위대로 공유 헤더·하단 내비게이션은 유지하고, API에 없는 위치·분류·상태·타임라인은 추가하지 않았다.
- 지도, 검색 페이지, 공용 API 목록 조회 함수, 의존성과 공용 토큰은 변경하지 않았다. 서버 호출은 조회 전용이며 수집·이미지 생성 요청을 추가하지 않았다.

## 승인·검증 근거

- 사용자가 2026-10-11 신규 8개 테스트와 기존 4개 대체안을 승인. 기준 커밋: `eaa52ebdcc72a6de546a74bf374739a450ccfe3d`.
- 검증·독립 리뷰 HEAD: `43b51ba66e372a0d4e5339b90f04d827fd79f3f5`.
- Sobaya 팀 고정 버전 `83af28db653c29a54be880ae49671725b6bbbcc4`, Node 24, pnpm 10.34.6 사용. 승인 입력과 기존 테스트를 보존한 8개 체크포인트 완료.
- 전체 `./node_modules/.bin/vitest run` 48개, `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build` 통과. 최종 gate와 별도 읽기 전용 컨텍스트의 독립 리뷰 통과, 조치 가능한 지적 없음.
- Chrome에서 운영 OCI 기사로 목록→상세, 직접 진입·새로고침, 검색→상세→뒤로가기의 검색어 유지, 실제 클립보드 복사, 준비된 이미지 표시·로딩 실패 대체를 확인했다. JavaScript 실행 오류 없음.
- 393×852와 1280×1000 화면을 확인했다. 별도 임시 API를 연결한 실제 Next.js 프로덕션 서버에서도 503 오류→재시도→새 조회 성공 및 API 404 화면을 확인했다.
- 기본 공유 API 분기는 승인 테스트의 모의 객체로 검증했다. 모바일 OS 공유창 자체의 실기기 검증은 포함하지 않았다.
- 실행 환경에서 발생한 경로 상속과 pnpm 자동 캐시는 작업별 실행 경로로 분리했다. 최종 diff에는 패키지 캐시가 없다.

## 남은 것

- 승인 명세·계획은 `collab/journal/plans/2026-10-11-amazon-article-detail/`에 이동한다. 최종 커밋은 기록·claim 갱신과 계획 이동만 포함하며 위 리뷰 HEAD의 제품 소스는 그대로다. 이후 이 브랜치에서 Sobaya 명령을 실행하지 않는다.
- 남은 절차는 `dev` 대상 PR 리뷰·병합이다. OCI 재배포는 이번 프런트 PR에 필요하지 않다.
