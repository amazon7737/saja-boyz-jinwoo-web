# 테스트 조회 문법 수정 승인

2026-10-10 사용자가 test-selector-fix-proposal.md에 대한 승인 요청에 “승인”이라고 답했다. 제안된 정확 코드만 failed-test.md 및 materialized 테스트의 4번째 항목에 적용한다. 다른 본문·헤더·fixtures·기존 40개 테스트·명령은 유지한다.

- 기존 baseline: 7aa779b4420dea4a0b05d3c58100cd902903531e.
- 완료 이력: 0416019·caa7701·0679a6b의 세 항목은 각각 전체 41·42·43개 테스트와 hygiene를 통과했다.
- 기존 상태와 이력은 approve.sh --replace가 approvals/에 보관한다. 계획의 완료된 세 체크박스를 보존한다. 신규 4번째 및 5번째 항목은 여전히 미완료로 검증한다.
- 제품 복원 정규화·행 테두리·긴 텍스트는 보존된 4번째 항목에서 sobaya step.sh --resume 및 Astra로 수정했다. 소스만 변경했으며 기존 jsdom 선택자 실패가 남아 defect로 반환했다. 이를 완료된 체크포인트로 취급하지 않는다.
- 소스 보완과 승인된 조회 문법을 함께 커밋하고 새 baseline 승인 뒤 전체 suite·gate·독립 리뷰·프로덕션 빌드·Chrome 검증을 진행한다.
