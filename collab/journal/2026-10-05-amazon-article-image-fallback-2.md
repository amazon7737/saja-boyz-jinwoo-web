# codex/article-image-fallback · amazon · 2026-10-05
- claim: collab/active/codex--article-image-fallback/claim.md

## 이벤트
- changed src/features/article-list/article-list.tsx ready 이미지의 실제 로딩 실패를 80×80 ‘이미지 없음’으로 대체하고 새 URL에서는 이미지 상태만 초기화 → 기존 기사 조회·본문·발행·원문 계약을 유지할 것
- added src/features/article-list/article-image.tsx 기사 이미지 전용 client 컴포넌트 → 전체 목록을 client로 옮기지 않고 검증된 URL만 전달할 것
- dep jsdom@27.4.0 승인 DOM 행동 테스트용 개발 의존성 추가 → pnpm install --frozen-lockfile로 동일 환경을 사용할 것
- done src/features/article-list/ 승인 항목2개와 기존21개 테스트, 실제404·손상 JPEG·정상 API desktop/mobile 검증 완료 → 최종 gate·독립 리뷰 원본은 claim의 verification.md와 evidence를 볼 것
- supersedes collab/journal/2026-10-05-amazon-article-image-fallback.md 승인 대기 기록 이후 사용자가 정확 입력을 승인했고 기능 검증을 마침 → approval.md의 실제 승인 기록을 기준으로 볼 것

## 남은 것
- PR은 dev 대상으로 외부 리뷰 대기. 선행 PR #2·#3은 dev에 통합됐다.
- 더 보기·공용 필터·UI·상세·제보·수집·배포는 이 구현에 포함하지 않았다. pagination-ui-proposal.md는 별도 승인 전 제안이다.
- 로컬 실제 API preview는 http://127.0.0.1:3005/incidents. 오류 재현용3004/39072는 종료했다.
- 승인 plan은 최종 gate·독립 리뷰 후 plans/에 보관한다. 이후 이 브랜치에서 Sobaya 명령을 다시 실행하지 않는다.
