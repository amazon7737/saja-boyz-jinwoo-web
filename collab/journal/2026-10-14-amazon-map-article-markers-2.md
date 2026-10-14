# codex/map-article-markers · amazon · 2026-10-14

- claim: collab/active/codex--map-article-markers/claim.md

## 이벤트

- changed src/features/map/ui/map-home/map-home.tsx 기사 위치 보기는 고유 좌표가 하나면 setCenter/setZoom(15), 둘 이상이면 fitBounds를 사용한다 → Naver SDK fitBounds는 좌표 배열 길이가 2 미만이면 아무 작업도 하지 않으므로 단일 지역에 fitBounds를 다시 사용하지 말 것.

## 검증과 남은 것

- 하나의 기사와 같은 좌표에 있는 두 기사를 한 테스트로 검증하고 실제 RED→GREEN을 관찰했다. 기존 여러 좌표 fitBounds 동작은 유지한다.
- 전체 22 파일 94 테스트 통과(110.37초), lint/typecheck/build/format/diff 검사 통과. 검증 로그는 claim 폴더 verification의 single-position 자료에 있다.
- 공식 SDK 문서: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html . 실행 중 SDK 구현의 짧은 좌표 배열 조기 반환도 읽기 전용으로 확인했다.
- 사용자 추가 지시인 피그마 마커/선택 기사 패널 표현을 같은 브랜치에서 이어서 적용한다. 배포·실제 브라우저 검증은 부모 세션 담당이다.

## 남은 것

- 위 검증과 후속 작업 내용은 유지한다. 필수 저널 절 이름을 보완한 추가 기록이며 제품 동작 변경은 없다.
