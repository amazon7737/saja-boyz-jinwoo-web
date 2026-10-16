# codex/reading-experience · easter721 · 2026-10-16
- claim: collab/active/codex--reading-experience/claim.md

## 이벤트
- changed src/app/globals.css 카드160ms 진입·skeleton1.4s pulse와 reduced-motion 정지 처리를 추가함 → 기존 드롭다운/시트·SDK 마커 transform은 유지하며 신규 카드에만 ui-card-enter 사용.
- added src/components/feedback/ 형태별 ArticleSkeleton·장식 LoadingSpinner를 제공함 → 새 텍스트 전용 로딩 대신 접근 가능한 role/status와 함께 재사용.
- added src/features/article-list/ui/article-list/use-article-tail.ts 검색/목록 공통 근접 감지와 IO 미지원 scroll/resize fallback 정리 → 다른 페이지네이션 구현을 중복 추가하지 말 것.
- changed src/features/article-list/ui/article-list/paginated-article-list.tsx 더보기 대신 자동 추가·추가 skeleton·실패 시 수동 재시도로 변경함 → 첫 기사 우선 중복 제거·원시 수신 수 offset·종료 규칙과 재시도 중 포커스를 유지.
- changed src/features/search/ui/search-results/search-results.tsx 검색어 전환/언마운트의 늦은 응답을 무시하며 같은 자동 추가 동작을 사용함 → key={keyword} 격리 유지.
- changed src/app/search/page.tsx 검색47px/내부44px 컨트롤·추천 칩36px/아이콘gap6px·고정 spinner 자리를 적용함 → pending 문장으로 칩을 늘리지 말 것.
- changed src/components/layout/bottom-navigation/bottom-navigation.tsx 탭과 중앙54px 제보 버튼 사이8px 간격을 확보함 → 키보드 포커스 윤곽을 없애서 겹침을 해결하지 말 것.
- changed src/app/report/page.tsx 접수 중 spinner·aria-busy·버튼 누름 피드백만 추가함 → 기존 입력/첨부/요청 키/60초 제한/Suspensive 경계를 유지.
- done collab/active/codex--reading-experience/verification.md 115개 테스트·format/lint/typecheck/default build·Astra 독립 리뷰·전체 Chrome 검증 완료 → source HEAD2f76efc와 metadata-only 보관 커밋을 구분해 확인.

## 남은 것
- dev 대상 PR 리뷰 후 GitHub squash 병합. 이 브랜치에서 승인/병합은 실행하지 않았다.
- 원본 체크아웃의 사용자 next-env.d.ts 수정 유지. 회사/customer 프로젝트 작업 없음.
- 외부 API POST 없이 뉴스/지도 GET만 검증했다. 실제 모바일 OS 공유창·프로덕션 제보 배포 확인은 이번 UI 범위가 아니다.
- GitHub 코멘트·태그는 게시 전 사용자 문구 승인 필요. 알림용 계정은 amazon7737이다.
