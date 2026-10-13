# 실제 제보 접수 구현 및 통합 검증 완료

2026-10-13 · @amazon · codex/report-submission

## 이벤트

- supersedes collab/journal/2026-10-13-amazon-report-submission-draft.md 승인 대기·미구현 상태 → 사용자가 계약·기준선 교체·9개 신규 항목을 승인했고 구현·전체 gate·독립 리뷰·실제 Go 통합 검증을 완료했다.
- changed src/app/report/page.tsx 로컬 확인 폼을 익명 multipart 접수·검증된 접수번호 표시·동일 내용 재시도 키·성공 후 잠금으로 연결함 → 제보를 뉴스로 자동 공개하거나 기존 로컬 확인 동작을 중복 구현하지 않는다.
- added .env.example NEXT_PUBLIC_REPORT_API_BASE_URL 공개 HTTPS 주소 자리 → 서버 team-poem/poem-news#2와 정확한 REPORTS_ALLOWED_ORIGINS를 함께 설정한 후 활성화한다. 프런트에는 인증 비밀을 넣지 않는다.
- rule collab/active/codex--report-submission/completion.md 검증 HEAD da20a13과 backend f91d7ff의 Chrome→HTTPS→Go→비공개 파일 저장 결과를 보존함 → 완료 범위·빌드 환경 제약·운영 활성화 전제를 이 기록으로 확인한다.
- done src/app/report/ 승인 항목 9개와 기존 첨부 회귀 2개, 전체 gate·독립 리뷰 및 실제 합성 제보 E2E 완료 → dev 대상 PR로 검토한다. 서버 PR은 https://github.com/team-poem/poem-news/pull/2 이다.

## 검증

- Node 24.19.0 / pnpm 10.34.6. 전체 suite 75개·format·lint·typecheck PASS, Webpack production build PASS.
- `review.head=da20a13fd15d3af539cb49bf07f50fc1e1f3ddca`, 승인 헤더·테스트·기존 Tailwind 유지. PR #15 squash 병합과 동일한 dev tree를 내용 변경 없이 이력에 연결했다.
- 임시 진단으로 응답 시각·불확실한 재시도와 성공 후 중복 제출을 재현·수정했고, 마지막 12개 진단 PASS. 승인 테스트는 추가·수정하지 않았다.
- 실제 Chrome 393×852에서 preflight 204, 새 접수 201, 동일 키 재시도 200·동일 접수증, 충돌 409, 최종 저장 1건, 저장 권한·파일 SHA·KST 변환·비공개 GET 거부·기존 뉴스 불변·성공 후 잠금 및 새 제보 초기화 PASS.
- 제한: 작업 checkout의 공유 의존성 symlink 때문에 기본 Turbopack 빌드는 실패하여 기존 브라우저 검사와 같은 `--webpack`을 사용했다. 중첩 리뷰 Chrome 환경 제약과 기존 favicon 404를 완료 기록에 구분해 남겼다.

## 남은 것

- dev 대상 프런트 PR 생성·리뷰 및 서버 PR #2와 배포 순서 조정. 이번 검증은 로컬 합성 자료를 사용했으며 운영 서버 접수 활성화는 포함하지 않는다.
- 운영 빌드에 실제 공개 HTTPS API 주소를 넣고, 서버 origin·저장 용량·접수 한도를 설정한다. 익명 제보 조회·관리 UI·자동 공개는 이번 범위가 아니다.
