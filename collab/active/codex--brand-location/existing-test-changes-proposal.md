# 기존 위치 테스트 정확 변경

기존 mapLocationStartsOnClickAndMovesOnlyAfterSuccess, mapLocationDenialUnsupportedAndLateCallbacksKeepMapSafe 두 검사를 자동 시작 계약에 맞춰 확장·교체한다. 권한 거부/미지원·중복 클릭·완료 뒤 재시도·이탈 뒤 콜백 보호는 유지하고 StrictMode·SDK 전 요청·최초 중심·복귀·직접 드래그·비정상 좌표를 추가한다.

- 전체 정확 파일: proposed-tests/map-home.test.ts.txt
- 정확 diff: existing-test-changes.diff
- header/fixture: 모듈 초기화, StrictMode 렌더 옵션, getCenter/getZoom과 drag 이벤트 관찰만 보강. 기존 SDK4개 본문은 바이트 동일하다.
- 다른 원본 테스트 파일은 변경하지 않는다. 위치2개는 baseline에서만 분리하고 러너가 새 정확 본문으로 복원한다. 최종 전체121개.
- 승인 전 probe: 기존4PASS/새위치2RED, 포맷·린트·타입PASS. 구현 전 명세에 없는 동작을 통과로 주장하지 않는다.
