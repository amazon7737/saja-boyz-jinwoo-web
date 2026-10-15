# 목록 승인 후 준비

## 이벤트
- dep AGENTS.md/package.json 사용자 승인한 단일 Vitest 명령으로 연결 → 기존 셸 스위트 3개는 src/test-support/harness.test.ts가 보존하여 전체 실행한다.
- added spec.md 사용자 명시 허용으로 목록 본문 명세 작성 → 라우트 연결·공용 필터·API는 후속 범위다.
- added src/features/incident-list/incident-list.tsx 승인된 빈 준비 소스만 추가 → 아직 실제 목록 구현으로 사용하지 않는다.

## 검증
- Node 24.19.0 / pnpm 10.34.6으로 전체 기존 테스트 7개 통과. format·lint 통과(빈 소스 미사용 props 경고 1개).
- 협업→Sobaya 로컬 pre-commit 위임 경로 실제 실행 성공. 분리된 팀 lock 런타임을 사용하며 공유 루트와 lock을 수정하지 않았다.
- 승인된 빈 소스에서 목록 테스트 다섯 개가 모두 실제 단언 실패로 RED를 보였다.

## 남은 것
- 승인 전 포맷 검사가 누락되어 원본의 긴 줄 일부가 Prettier와 맞지 않는다. 의미를 유지한 정확한 교체본과 전체 주석 검토본을 별도로 제시했다. 추가 승인 전 원본을 대체하지 않는다.
- 교체본 승인 후 정확한 baseline 기록 → 항목별 구현·전체 검사 → 브라우저 확인 → gate·독립 review.
- doctor의 관리 훅 바이트 비교 제한은 알려진 진단 실패로 남는다. 실제 위임 검증과 구별하여 보고한다.
