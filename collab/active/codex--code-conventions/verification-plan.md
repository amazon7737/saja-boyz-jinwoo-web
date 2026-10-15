# 실행 계획 보완

빈 행동 계획으로 approve.sh를 실행했으나 plan parser가 “plan must contain at least one test entry”로 거부해 승인 상태는 생성되지 않았다. 런타임을 변경하지 않고 기존 dev의 완료된 AppShell 검사 한 개를 헤더/본문 그대로 failed-test.md에서 참조한다. 기존 전체 테스트·명령·기대값은 변경하지 않으며 신규 테스트 승인을 요구하는 변경도 없다. 사용자가 승인한 구조 리팩터링 범위는 그대로다. 별도 기존 계약 참조를 승인 baseline에 기록한 뒤 변경 전후 gate·독립 review를 실행한다.
