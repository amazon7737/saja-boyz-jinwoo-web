# codex/article-list-api · amazon · 2026-10-04
- claim: collab/active/codex--article-list-api/claim.md

## 이벤트
- supersedes collab/journal/2026-10-04-amazon-article-list-api.md 승인 전·구현 전 상태를 이번 완료 기록으로 대체함 → 승인 기준선 7f05d14와 완료 리뷰 6c17ea0 및 verification.md를 참고할 것.
- changed src/app/incidents/page.tsx 실제 기사 API를 서버에서 최신 20행 한 번 조회하고 오류·재시도를 표시함 → 실행 환경에 NEWS_API_BASE_URL을 설정할 것. 빌드 시 미설정이어도 실행 시 읽는 동적 route임.
- added src/features/article-list/ 기사 전용 카드가 ID 중복 제거·본문 정제·안전한 원문 링크·80px AI 이미지·발행 시각을 담당함 → 기존 IncidentList 인터페이스와 공용 UI를 기사 데이터에 맞춰 변경하지 말 것.
- added src/app/incidents/loading.tsx 기존 IncidentList 로딩 표시를 재사용함 → 이 컴포넌트에서 API를 중복 요청하지 말 것.
- rule API total은 중복 포함 수집 행 수이며 기사 발행 시각은 사건 발생 시각이 아님 → total을 전체 사건 수로 표시하거나 API에 없는 분류·상태·위치를 만들지 말 것.
- rule 발행 시각은 유효한 RFC/ISO 전체 문자열만 검증해 ISO time과 KST 절대 시각으로 표시함 → 잘못된 날짜를 native Date의 보정·추측에 맡기지 말 것.
- done src/app/incidents/ 및 src/features/article-list/ 승인 항목·전체 gate·독립 완료 리뷰·실제 API 브라우저 확인 완료 → 선행 PR #2가 dev에 통합된 뒤 후속 PR을 검토할 것.

## 검증
- 기능 소스 fec482341f83561706b1cf176bb6d1d66aa81463, 독립 리뷰 6c17ea0a79807b3d5bb1b15eb4707631faca5328. plan 보관 직전 canonical status complete/active=null/pending=[]/dirty=false/review.head=HEAD 확인.
- 전체 21개 Vitest 테스트(기존 13+신규 8), format, lint, typecheck, production build, pinned 최종 gate PASS. 테스트·명세·지원 설정은 승인 기준대로 유지.
- 최종 소스의 실제 API 4카드·KST 날짜·ready 이미지·393px 화면·첫 외부 원문 링크 확인. 빈 결과·오류·재시도·로딩·타임아웃·중복·320px/desktop·키보드 검증은 verification.md에 정확한 revision별 범위를 기록.
- node_modules는 동일 버전의 독립 로컬 복사본으로 정리했고 package/lockfile을 변경하지 않았다. API 저장소·수집 POST·운영 설정·공용 UI를 수정하지 않았다.
- 마지막 커밋은 협업 문서·증거와 plan 보관만 수행하며 기능 소스는 리뷰 이후 변경하지 않는다.

## 남은 것
- 기능 PR은 dev 대상 초안으로 게시한다. PR #2는 외부 리뷰 대기이며 이 브랜치는 codex/incident-list 위에 쌓였다. PR #2 병합 권한은 이번 작업에 포함되지 않는다.
- dev와 비교하면 PR #2에서 상속한 다른 claim 파일들이 포함되어 협업 CI가 차단될 것으로 예상된다. 선행 PR 통합 뒤 dev를 merge하고 재검사할 것. 상속 claim 삭제·검사 완화·rebase로 우회하지 말 것.
- ready 이미지가 실제 404면 카드와 원문 링크는 남지만 깨진 이미지가 보인다. 자동 placeholder 전환은 후속 개선 범위다. 공용 폰트·기존 배지·헤더·필터·상세·제보는 이번 범위 밖이다.
- spec.md와 failed-test.md는 collab/journal/plans/2026-10-04-amazon-article-list-api/에 보관한다. 이 마지막 커밋 이후 이 브랜치에서 Sobaya 명령을 실행하지 말 것.
- 자동 주기 모니터는 중지 상태를 유지한다.
