# 제보 복구 테스트 준비 단계 교체 검토 · amazon · 2026-10-13
- claim: collab/active/codex--report-recovery/claim.md

## 이벤트
- touching src/app/report/page.tsx 제보 요청 60초 제한·로컬 Suspensive 복구 구현은 b23c532에 있으며 4개 체크포인트 완료 → PR #16 반영 전 최종 하네스 검증이 남았으므로 완료로 간주하지 않는다.
- rule docs/drafts/report-recovery-timer-setup 승인된 테스트의 초기 Next Link 타이머 오인이 재현돼 공통 준비 코드 한 줄 교체를 제안함 → 사용자 승인 전 현재 spec.md·failed-test.md·테스트 helper를 변경하지 않는다.

## 남은 것
- 사용자에게 제시한 교체본은 renderReport의 root.render 이후 await advance(1) 추가뿐이다. 여섯 테스트 본문과 제품 소스 변경은 없다.
- 독립 임시 사본: 원본 5통과/1실패, 후보 6통과, 전체 19개 파일/81개 통과, 타입·lint·format 종료 0. 정확한 검토본·실패 원인·원문 대조·실행 결과는 docs/drafts/report-recovery-timer-setup/proposal.ko.md와 evidence/에 보관했다.
- 현재 pinned Sobaya 상태는 needs_human, 기준선 397f81b, 마지막 체크포인트 b23c532이다. 5번 테스트는 하네스가 원문대로 materialize한 상태이며 미커밋이다. 보호 입력 해시는 모두 유지됐다.
- 교체 승인 후에만 계획 헤더와 실행 파일 helper에 동일한 한 줄을 적용하고, 이전 승인·체크포인트 기록을 보존한 채 승인 기준선을 --replace로 기록한다. 이후 남은 두 항목·final gate·독립 리뷰·실제 Chrome 흐름을 완료하고 기존 PR #16에 통합한다.
- 별도 Chrome 진단은 /tmp/poem-report-recovery-browser/verify.cjs에 준비됐으나 아직 실행하지 않았다. 운영 요청·배포·PR 본문 변경·새 코멘트는 수행하지 않았다.
