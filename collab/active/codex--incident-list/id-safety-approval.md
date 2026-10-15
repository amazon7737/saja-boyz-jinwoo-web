# ID 예외 처리 승인 기록

2026-10-02 사용자가 review.id-safety-proposal.md로 제시한 명세 예외·신규 incidentUnsafeIds 테스트·새 기준선을 “승인한다”로 승인했다.

- spec.id-safety-proposal.md를 spec.md에 바이트 그대로 반영했다.
- failed-test.id-safety-proposal.md를 failed-test.md에 바이트 그대로 반영했다. 기존 다섯 항목과 공유 헤더·실행 지원은 유지한다.
- 빈 ID·`.`·`..`·올바르지 않은 Unicode ID는 카드 정보를 보존하되 링크 대신 “상세 정보 없음”을 표시한다.
- 이 기록을 포함한 커밋을 공식 approve --replace로 등록한다. 이전 상태와 checkpoint는 공식 approvals 보관본에 유지하며 수동으로 상태·체크박스를 변경하지 않는다.
- 신규 한 항목을 step으로 구현·검증한 뒤 브라우저 검증과 전체 gate·독립 review를 수행한다. 라우트·API 연결은 후속 범위다.
