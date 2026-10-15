# 지도 홈 구현·Figma 대조 검증

2026-10-15 · dev119172a 기반. 정확 승인 baseline3b155aa. 지도 홈 범위이며 전체 화면 재구축 완료가 아니다.

## 소바야와 소스 출처

신규7개가 RED/ALREADY GREEN→전체 GREEN의 검증 체크포인트를 거쳤다. 순서대로0059cda/f8f76d6/a21942f/bb6ba63/d977705/936e95d/ad423a0. 크기·선택 항목은 앞선 숫자 원 변경에서 이미 충족돼 ALREADY GREEN receipt로 저장됐다.

기존 테스트3개만 정확 승인한 대로 baseline 전에 바꾸고 나머지99개 및 원래 지원코드·명령·의존성은 유지했다. 첫 실행은 새 baseline의 옛 기대값2개가 신규 항목 외에서 RED여서 중단됐다. 앱 Astra 소스 어댑터로1건 숫자 원·AppShell 중복 필터만 먼저 전환했고 원래 루프를 재개했다. 이 별도 호출은 신규 항목 receipt로 계산하지 않는다. source AppShell 포맷1곳도 도구로 정리했다. 세부근거는 preflight-source-transition.json.

7개 완료 뒤 첫 독립 소스 리뷰는 필터 줄바꿈과 가로 화면 내 위치 가림2건을 찾아 완료 판정을 보류했다. 실제 production Chrome에서도667×375 hit-test가 실패했다. 원본·현재 캡처4개를 첨부한 앱 Astra 소스 작업으로 두 결함과 칩/카드/폼 시각 차이를 보정했다. source-only 별도 보정 결과는 visual-source-worker.json이며 테스트나 승인 파일을 바꾸지 않았다. 최종 source HEAD의 전체 gate·새 독립 review 결과는 final-review.json과 최종 저널에 기록한다. runtime은 변경하지 않았다.

## 실제 브라우저

- 기본 Next production build, 실제 Chrome/Naver SDK. 등록 localhost:3000을 사용했다. 별도3021포트는 실제 authFailure라서 사용하지 않았다. 다른 서버를 종료하지 않았고 테스트 fixture는127.0.0.1:4200의 공개 GET 대역만 썼다.
- 393×790 비교: 헤더x16/y8/361×52, 필터icon42×30·기간60×27·분류82×27·상태60×27/gap6. 카드x16/y544/200×152, 다음x226(gap10), 이미지176×80. carousel221px, 메뉴와10px. 원38.4/48/72px 실제 DOM geometry를 확인했다.
- 320×700(30일 활성 포함),393×852,667×375,1440×900에서 가로 overflow·버튼 가림 없음. 가로 화면은 이미지 없는62px 카드다. native ©NAVER/로고·축척과 선택 시트 위 저작권을 보존했다.
- 지역12건 선택/닫기·포커스, 카드→실제 상세→뒤로가기, 기간24시간/30일·숫자 원과 카드 동기화, 분류/상태미제공, popup Escape/바깥 클릭, 전체 시트20회 Tab/Shift+Tab·취소/초기화/적용, 이미지404 대체, API실패/원래빈결과를 확인했다. 위치는 브라우저의 합성 서울 좌표를 사용했다.
- 합성25기사의 지역12/7/5/1과 실제 운영 API는 구분했다. 운영 GET에서 total82/resolved3을 읽고 기사 위치 보기로 실제3개 대표점을 확인했다. 이 조회는 수집/위치생성을 시작하지 않으며 운영 POST0건, unhandled page error0건이다. 실제 OS GPS/실기기 safe-area를 완료로 주장하지 않는다.

## Figma와의 구분

지도18:2348·선택45:3317 및 원본 하위 노드의 context/metadata/render를 다시 대조했다. iOS목업 상단37/하단25는 웹에 넣지 않는다. 기존 메뉴bottom8 유지로 정규화 원본과 세로1px 차이가 있다. 지도 타일·지리적 좌표/카메라·실제 기사 내용은 동적이다.

인기도 없음→‘최근 보도 기사’. 분류·상태 없음→원본 메뉴 표면과 미제공/disabled 안내. 원본45:3317의 정치/진행중 선택을 실제 동작으로 완료했다고 주장하지 않는다. 전체 필터는 별도의 밝은 원본이 없어 승인한 공유패널/이전필터의 밝은 적용안이다. 창작SVG 브랜드는 기존 승인 예외다.

검색11:1864/공유34:3311/목록11:2123/제보11:2221 모두 재조회했지만 지도 밖 본문은 수정하지 않았다. 제보 보정 PR22를 처음 열린 PR 목록과 연결하지 못한 누락은 기록을 정정했다. PR22·제보 소유권과 지도 작업은 겹치지 않는다. GitHub 코멘트/리뷰승인/병합/배포는 실행하지 않았다.

실제 캡처6개는 evidence/, 자세한 geometry/체크는 browser-report.json, 승인입력 보존은 protected-inputs.json, 원본치수는 figma-measurements.json에 있다. 비교 HTML은 /tmp/figma-map-home-comparison.html에 별도로 생성했다.

## 사용자 추가 요청 반영

검색 초기/결과·목록·상세의 실제393px 캡처를 먼저 제시하고, related-screens-addendum.md에 따라 전용 검색 카드·강조·초기 섹션 밀도·목록 정보 계층·상세 사진/본문/공유 배치를 보정했다. 첫 추가 소스 워커의 focused37개는 통과했고 추천검색 브라우저1개는90초 timeout이었다. 이 실패를 통과로 기록하지 않으며 최종 전체gate에서 다시 검증한다. 추가 마감의 기존22개는 통과했다.

이후 사용자의 절제된 인터랙션 요청에 따라 컨트롤120ms·버튼scale0.98, 드롭다운140ms/4px, 시트190ms/10px, 검색 결과section fade140ms를 전용ui-클래스로 추가했다. reduced-motion에선animation/transition을끈다. 관련19개는 통과했고 모션 워커가 처음 잘못 포함한 포트 테스트 실행은 중단해 성공으로 세지 않는다. globals.css에 범위가 정해진 스타일만 추가하며 전역reset·SDK/카메라·데이터·API·치수·승인테스트/명세는 유지한다.

최종 실제브라우저/전체gate/독립리뷰 결과는 final-review.json·related-browser-report.json·motion-browser-report.json 및 최종 증거를 따른다. 이 추가 소스 실행은 Sobaya7개 승인 항목 receipt에 합쳐서 계산하지 않는다.

## 최종 브라우저 결과

기본 next build 성공 후 실제 Naver SDK 지도10개 검증 그룹, 운영 공개GET4회/쓰기0회/82개중좌표3개, 검색·목록·실제이미지 상세7개 검증 그룹, 모션/동작줄이기3개 검증 그룹이 모두 성공했다. 모든 실제브라우저 pageErrors는0이다. 모션은 computedStyle로120/140/190ms, reduce의animation:none/transition:0s/scale:none을 확인했다. 관련 화면은320/393/667가로/1440폭에서 넘침이 없고 상세사진은190px다. 영상의clipboard검증은브라우저메모리mock으로시스템클립보드를변경하지않았다.

최종 브라우저 소스 hash는 browser-verified-source-files.json, 화면과 영상은 evidence/에 보관한다. 최종 전체 gate와 독립 리뷰는 소스 커밋 뒤 다시 실행하며, 결과를 추측해 통과로 기록하지 않는다.

## 독립 리뷰의 검색 입력 회귀 수정

fc05b5e에서 전체109개는모두통과했지만 독립리뷰는 제출전검색어지우기 회귀1개를P2로확인했다. native search cancel을숨긴클래스1개를삭제해기존브라우저입력동작을복구했다. 새기능/상태/테스트는추가하지않았다. 기본빌드와기존search-page3개가통과했고 실제Chrome에서제출전native X로지우기와제출후URL초기화를모두재현해성공했다. 다른제품파일hash는동일하다. 이후커밋에서전체gate/독립리뷰를다시수행한다.

## 최종 소스 검증

소스 HEAD 89a013fc362af218903643ccc64d6652c1c20632에서 전체109개/실패0/건너뜀0, format:check와 lint, 새 Astra 독립 리뷰가 통과했다. 기본 production build·typecheck와 실제 Chrome의 지도/연관 화면/모션/동작 줄이기/native 검색 지우기도 검증했다. 이후 커밋은 plan 보관·저널·claim 등 메타데이터만 포함한다. 모든 제품 파일은 browser-verified-source-files.json과 같다.
