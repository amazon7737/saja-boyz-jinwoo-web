# codex/shared-ui-foundation · easter721 · 2026-10-01
- claim: collab/active/codex--shared-ui-foundation/claim.md

## 이벤트
- supersedes src/components/ui/ 앞선 done 이벤트의 개발 완료 판정을 보류함 → sobaya gate와 독립 review 전에는 완성 기반으로 취급하지 말 것
- rule docs/sobaya-recovery.md 일반 pnpm 검사로 sobaya 개발 루프를 대체하지 않음 → collab.sh run으로 sobaya approve/loop/gate/review를 사용할 것
- changed harness/config.sh sobaya 기본 위치를 앱 형제 ../sobaya로 연결 → 각 클론에 sobaya를 설치하거나 SOBAYA_ROOT 환경 변수를 지정할 것
- added harness/sobaya.lock 팀 sobaya 버전 83af28d 기록 → 연결 검사에서 lock과 로컬 버전을 비교할 것

## 남은 것
- PR #1은 초안으로 전환. 이전 테스트 172개·빌드 통과는 일반 검사 결과이며 sobaya 승인·gate·review 증거가 아님.
- 연결 검사는 통과했으나 doctor brain index 오류, pnpm Test 계약 미지원, 사용자 승인 baseline 부재가 남음. docs/sobaya-recovery.md 참조.
- 설치가 만든 spec.md·failed-test.md는 미승인 로컬 템플릿이며 main에 넣지 않음. 정확한 승인안을 준비해 사용자 검토 후 개발을 재개할 것.
