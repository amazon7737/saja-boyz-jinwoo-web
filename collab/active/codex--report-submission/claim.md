---
branch: codex/report-submission
owner: amazon
started: 2026-10-13
status: done
goal: feat(report): 실제 제보 접수와 서버 저장 연결
next: PR 16 후속 수정 재리뷰. 운영 접수 활성화는 서버 배포와 공개 API 주소·정확한 웹앱 origin 설정이 필요하다.
base: dev
---

## 메모

- 2026-10-13 사용자가 실제 제보 접수를 amazon이 맡는다고 diff에 기록하고 작업을 시작하도록 지시했다.
- PR #15의 UI·검증·첨부 선택·Tailwind 구현(e045e01)을 재사용한다. 이 PR이 dev에 병합되기 전에는 그 브랜치 위에 쌓아 중복 구현을 피한다.
- 프런트 접수 흐름은 team-poem/saja-boyz-jinwoo, Go 접수 API·파일 저장은 team-poem/poem-news의 codex/report-intake에서 준비한다.
- 현재 착수는 담당 선언·계약·테스트 초안 작성이다. 새 접수 정책과 실행 테스트는 아직 승인 전이며 기존 승인 테스트·명세는 바꾸지 않는다.
- 실제 접수·서버 저장은 기존 '입력 확인' UI와 별도의 후속 작업이다. 접수한 제보를 검증된 뉴스로 자동 공개하지 않는다.
- 지도·검색·공용 UI와 뉴스 수집·이미지 생성은 이번 기능에 포함하지 않는다.
- 사용자 선택은 익명 접수 + 첨부 저장이다. docs/report-submission-contract.md와 docs/drafts/report-submission/에서 계약·기준선 교체·주석 검토본·probe 근거를 볼 수 있다. 실제 접수 구현은 아직 시작하지 않았다.

- 2026-10-13 사용자가 최종 계약·기준선 교체·프런트 9개/서버 8개 테스트를 명시적으로 승인했다. approval.md에 정확한 입력 해시와 채택 상태를 기록했다. 이전 승인 전 메모는 이 기록으로 후속 갱신된다.
- 2026-10-13 구현·9개 체크포인트·전체 gate·독립 리뷰·실제 Chrome→HTTPS→Go→비공개 저장 E2E를 완료했다. completion.md와 completion/에 검증 증거를 보존했다. PR #15의 dev squash 병합을 확인하고 동일한 전체 tree를 보존하며 ancestry를 연결했다. 위의 승인 전/미구현 메모는 이 완료 기록으로 대체된다.

- 2026-10-13 PR #16의 요청 제한·Suspensive 오류 복구 코멘트를 별도 승인/검증 후 통합했다. recovery/completion.md와 recovery/integration.md에 6개 항목·최종 독립 리뷰·전체 81개·실제 Chrome 결과 및 source 동일성을 보존했다. 운영 배포는 수행하지 않았다.
