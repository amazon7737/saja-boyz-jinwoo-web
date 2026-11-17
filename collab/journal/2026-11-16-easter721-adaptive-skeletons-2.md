# codex/adaptive-skeletons · easter721 · 2026-11-16
- claim: collab/active/codex--adaptive-skeletons/claim.md

## 이벤트
- changed src/features/search/ui/search-form/search-form.tsx 입력 안내 롤링과 포커스 윤곽을 조정함 → 입력값·한글 조합·자동완성 및 모션 줄이기 동작을 유지할 것.
- changed src/app/report/page.tsx 제보 입력의 포커스 표시를 필드 경계에 맞춤 → 오류·첨부와 키보드 포커스 표시를 유지할 것.
- changed src/components/feedback/list-navigation-pending.tsx 목록 이동 중 목적지 로딩 화면을 표시하고 배경·복제 컨트롤을 잠금 → 이동 취소와 완료 시 포커스 복구를 유지할 것.
- changed src/features/article-detail/ui/detail-sheet/detail-sheet.tsx 상세 복귀 시 기존 시트의 진입 모션을 재생하지 않음 → 최초 진입 모션과 기존 시트 상태를 유지할 것.
- changed src/features/article-list/api/fetch-articles.ts 기간 필터 결과는 서버의 `X-News-Period` 확인이 필요함 → 서버 PR 15의 병합·배포 후 운영 응답 헤더를 확인할 것.
- changed src/proxy-navigation.test.ts 스켈레톤을 연결된 DOM에서 동시에 측정하고 테스트 요청 처리를 한 곳으로 모음 → 화면 크기·채움·로딩 상태 검증을 유지할 것.

## 남은 것
- 서버 PR 15는 아직 열려 있으며 운영 배포 전에는 기간 필터가 오류·재시도를 안내한다.
- 기사 분류 데이터와 계약이 없어 목록 카테고리는 비활성 상태다. 키워드 재정리와 검색어 인식은 이번 범위에서 제외했다.
- PR 68의 GitHub 필수 검사는 대기 중이고 새 커밋에 대한 리뷰가 필요하다.
- 목록 전환 별도 브랜치의 gate는 테스트 308개 통과 기록에도 명령이 비정상 종료했고, 최신 PR 자동 병합은 테스트 파일 충돌로 취소됐다. 해당 실행과 브랜치는 보존했다.
- 통합 테스트는 기본 reporter에서 64개 파일·312개 테스트가 통과하고 종료 코드 0이었다. 실제 스크린리더 음성은 확인하지 않았다.
