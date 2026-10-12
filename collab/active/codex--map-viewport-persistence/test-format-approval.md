# 테스트 포맷 재승인

2026-10-12 사용자가 “포맷 수정 승인, 검증·PR까지 계속 진행”으로 failed-test-format-proposal.md의 정확 대체안을 승인했다. TypeScript AST 구조 비교에서 원본과 대체안의 테스트 이름·기대값·동작 구문이 동일했다.

첫 sobaya 항목은 행동 RED 확인 후 구현됐으나 Format gate에서 중단되어 검증 체크포인트 커밋은 없다. 구현과 기존 metadata는 /tmp/map-viewport-recovery에 보존하고 제품을 승인 전 기준으로 되돌린 뒤 테스트 계획만 대체해 새 baseline을 등록한다. 따라서 새 루프에서도 행동 RED부터 다시 검증한다. 이전 상태는 sobaya approve --replace가 자체 보관한다.
