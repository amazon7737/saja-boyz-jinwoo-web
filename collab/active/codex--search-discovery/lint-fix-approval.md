# 변수명 수정 추가 승인
- 사용자 응답: 변수명 수정 승인, 검증·PR까지 계속 진행.
- lint-fix-proposal.md·lint-fix-source.txt·lint-fix-failed-test-proposal.md의 해시는 lint-fix-hashes.json.
- module → routeModule 변수명만 변경. 테스트 이름/기대값/fixture/동작/전체 Test 명령/기존 보안 변경안 유지.
- 이전 소바야 baseline dd64b24와 RED 증거를 보존하고 사용자 승인에 따라 approve --replace로 새 정확 입력을 등록한다.
- 현재 첫 공통 metadata 소스는 이미 소바야 워커가 구현했다. 새 승인 첫 항목은 ALREADY GREEN을 정직하게 기록하고 전체 suite/독립 review를 그대로 수행한다.
