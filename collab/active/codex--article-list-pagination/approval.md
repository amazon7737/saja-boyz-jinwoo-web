# 기사 목록 더 보기 실행 입력 승인

2026-10-11 사용자 응답: **“승인한다”**.

직전 응답에서 제시한 `review.ko.md`의 정확한 공유 헤더·테스트 3개와 `spec-proposal.md` 명세를 승인했다. 구현·검증 후 dev 대상 PR 생성까지 진행한다.

- `spec-proposal.md`를 내용 변경 없이 `spec.md`로 등록한다.
- `failed-test-proposal.md`를 내용 변경 없이 `failed-test.md`로 등록한다. 실행할 헤더와 테스트는 `evidence/review-integrity.json`의 해시와 일치한다.
- 초안 문서에 남아 있는 당시의 승인 전 표시는 이 기록으로 갱신한다. 실행 입력 자체는 수정하지 않는다.
- 기존 58개 테스트·helpers·fixtures·명령·의존성은 유지한다. 승인된 새 항목 3개만 harness가 순서대로 추가한다.
- 팀 고정 Sobaya `83af28d`의 기본 선택 정책(Astra)을 사용하며 항목별 전체 suite checkpoint, 최종 gate와 독립 리뷰를 거친다.
- 브라우저 검증은 로컬 API fixture를 사용한다. 운영 수집·이미지 생성·OCI 재배포·PR 병합은 이번 범위에 포함하지 않는다.
