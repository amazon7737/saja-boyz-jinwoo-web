# 지도 테스트 초안 probe 결과

2026-10-10, 제품 기준 729f0b2. 신규 테스트 헤더·본문을 sobaya probe.sh로 기존 src/app 안의 일시 파일에서 각각 실행하고 자동 정리했다. 최종 테스트 대상은 src/features/map/ui/map-home/map-home.test.ts다.

- mapMissingKeyExplainsSetupWithoutSdkRequest: assertion RED. 키 누락 안내 alert와 지도 컨테이너 없음.
- mapLoadsNaverSdkAndPreservesHomeNavigation: assertion RED. 주변 지도 컨테이너 없음. 홈 검색·메뉴 보존은 기존 테스트와 실제 브라우저에서 추가 확인한다.
- mapSdkFailureRetriesAndRecovers: assertion RED. 네이버 SDK script 없음.
- mapSdkTimeoutAndAuthenticationFailureAreVisible: assertion RED. 타임아웃 안내 alert 없음.
- mapLocationStartsOnClickAndMovesOnlyAfterSuccess: assertion RED. SDK script와 내 위치 구현 없음.
- mapLocationDenialUnsupportedAndLateCallbacksKeepMapSafe: assertion RED. SDK script와 내 위치 구현 없음.

초기 probe의 디렉터리 부재 및 JSDOM self 부재는 준비 오류였고 RED로 세지 않았다. 기존 src/app에서 probe하고 header에 self를 추가한 뒤 위 6개 실행된 테스트의 assertion RED를 확인했다. 제품 구현·기존 테스트를 바꾸지 않았다.

JSDOM SDK fixture는 외부 네이버 SDK·타일 인증을 검증하지 않는다. 구현 후 사용자 제공 Client ID와 실제 Chrome localhost:3000에서 공급자 SDK·타일 응답·지도 가시성을 확인해야 한다. Web 서비스 URL 등록 여부는 아직 답변이 없다.
