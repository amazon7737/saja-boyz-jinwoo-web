# 네이버 지도 홈 첫 작업 명세 초안

2026-10-09 · dev de54654 기반. 제공자 선택과 자격 설정은 사용자와 확정했으며 세부 명세·정확 테스트 코드는 아직 승인 전이다.

## 사용자 설정
- Application: poem-map. Dynamic Map 활성화와 사용자 제공 한도(일 1,000건 / 월 6,000,000건)를 기록한다. 콘솔 한도·요금은 직접 확인하지 않았다. 반복 SDK 요청을 피한다.
- Client ID는 ignored .env.local의 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID에 설정했다. 실 ID와 Client Secret을 커밋하지 않는다. 웹 지도에 Client Secret을 전달하지 않는다.
- Web 서비스 URL의 localhost:3000 등록 여부와 배포 도메인은 사용자 답변 대기. SDK/타일 인증 성공은 아직 검증하지 않았다.

## 첫 기능
- /의 준비 패널을 실제 네이버 지도 홈으로 교체. 기본 중심은 서울시청(37.5665, 126.9780), zoom 12이며 사용자 위치·사건 위치라는 의미를 부여하지 않는다.
- NEXT_PUBLIC_NAVER_MAP_CLIENT_ID로 https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=... 로드. 페이지 진입마다 중복 script·지도 객체·리스너가 쌓이지 않게 관리. 실패한 로드는 다시 시도 가능하게 한다.
- 지도 컨테이너 접근성 이름은 주변 지도. SDK 준비 중 role=status·aria-busy, 키 미설정·script/인증 실패·10초 로드 시간 초과에 읽을 수 있는 오류와 다시 시도 버튼 제공. 인증 오류를 지도 정상 로드로 표시하지 않는다.
- 지도 패닝·줌과 네이버 로고/출처 표시 보존. 모바일 컨테이너 크기 변경을 처리하고 내비게이션·검색 오버레이가 공급자 출처를 가리지 않게 배치한다.
- 내 위치는 버튼 클릭 시에만 navigator.geolocation.getCurrentPosition 요청. pending 중 중복 클릭 방지, 성공 시 지도 중심 이동·현재 위치 표시. 권한 거부·시간 초과·지원 안 함이면 안내하고 기본 지도는 유지. 언마운트 뒤 늦은 callback 무시, 이전 위치 표시 정리. 위치를 서버에 전송하거나 저장하지 않는다.
- 검색 진입은 기존 /search 기사 키워드 검색을 사용. 주소 검색처럼 표시하지 않는다. 하단 메뉴 재사용, /search·/incidents 및 오류 경계 보존.

## Figma와 구조
- 개인 계정으로 [지도 기본 18:2348](https://www.figma.com/design/TCSILMzViAVqeHRphoyHCH?node-id=18-2348), [선택 필터 45:3317](https://www.figma.com/design/TCSILMzViAVqeHRphoyHCH?node-id=45-3317)을 재조회했다. 전체 고해상도 컨텍스트는 claim 폴더의 figma-*.txt에 보관.
- 실제 네이버 지도를 배경에 쓰고 기존 흉흉 브랜드·검색 헤더를 부유 표면으로 배치. 16px 측면 여백, 둥근 헤더, 44px 내 위치 버튼/20px crosshair, 반투명 표면·기존 Tailwind 토큰 재사용. iOS 상태바·지도 스크린샷을 제품 자산으로 넣지 않는다.
- 내 위치 crosshair와 위치 표시는 해당 Figma 자산을 구현 단계에 내려받아 정확한 크기로 사용. 클러스터/사건 이미지 등 후속 데이터 요소를 샘플 실사건으로 노출하지 않는다.
- src/features/map/ui/map-home/에 컴포넌트와 관련 테스트를 모으고 SDK 연결은 필요한 작은 api/모듈로 둔다. 전역 store·과도한 추상화·새 제품 의존성 없음. AppShell 홈 스타일 변경은 홈에만 한정하고 기존 헤더 렌더 계약과 모든 기존 테스트를 유지한다.

## 테스트 초안
failed-test-proposal.md에 신규 6개 정확 본문·헤더·SDK fixture를 준비했다. 기존 34개 테스트·명령·의존성을 유지한다. probe-result.md의 각 RED는 미구현 상태에서의 실패 근거이며 기대값의 정당성이나 실제 SDK 인증 성공을 뜻하지 않는다. 명세와 정확 초안을 함께 승인받은 뒤 sobaya approve/loop로 구현한다.
1. 키 누락/로딩/SDK 준비 완료에 따른 상태와 지도 생성 및 script 중복 방지.
2. script 오류·인증 실패·시간 초과와 재시도 복구.
3. 클릭 전 위치 요청 없음, 클릭 후 pending→위치 이동·현재 위치 표시, 반복 클릭의 이전 표시 정리.
4. 권한 거부·시간 초과·미지원 및 언마운트 뒤 늦은 callback의 처리.
5. 홈의 검색 진입·메뉴와 검색/목록 계약 보존. 실제 Chrome에서 공급자 SDK·타일 로딩 확인과 320/393/1280px 화면 검사.

## 제외와 API 협업
실제 사건 마커·클러스터·카테고리/기간/상태 필터·핫한 사건·선택 카드/바텀시트는 사건 API에 좌표·식별·분류·시각 계약이 생긴 뒤 구현한다. 뉴스 title에서 위치를 임의 추정하거나 지도에 테스트 사건을 표시하지 않는다. amazon7737 담당 상세·제보를 대신 만들지 않는다.

근거: [현재 SDK 시작 가이드](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html), [Client ID 및 서비스 설정](https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-Getting-Client-ID.html).
