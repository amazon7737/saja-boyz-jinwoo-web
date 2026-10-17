# 브랜드 아이콘과 첫 진입 내 위치 자동 이동 — 명세

## 목적
최신 origin/dev e555169(PR35 포함) 기반 codex/brand-location에서 흉흉 브랜드 아이콘을 제공하고, 지도 첫 진입에 버튼을 누르지 않아도 브라우저 위치 권한을 요청해 허용된 현재 위치로 이동한다. 기존 사용자 탐색·복귀·SDK 오류 복구를 유지한다.

## 브랜드 아이콘
- 기존 승인 public/brand/hyunghyung.svg의 원형 관측 심벌을 재사용한다. 작은 탭에서는 글자를 생략하고 짙은 윤곽·빨간 신호와 흰 배경을 사용한다. 별도 AI 래스터 이미지나 새 폰트·의존성을 추가하지 않는다.
- 검토용 proposed-assets/icon.svg, favicon.ico, apple-icon.png를 정확한 바이트로 src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png에 복사한다. ICO는16/32/48px, Apple은180×180px이며 SVG는48×48 viewBox이다.
- Next 파일 기반 아이콘 규칙을 사용해 공통 HTML에 icon·apple-touch-icon 링크를 출력한다. 기존 Google 확인 태그·기사별 SEO/OG·제목과 로고는 유지한다. 수동 중복 링크나 전체 PWA·오프라인 기능은 추가하지 않는다.
- 기존 브랜드 README에 파생 아이콘 출처와 크기를 기록한다. 실제 운영 빌드의 이미지 응답·content type·head 링크와 16/32/48px 가독성을 확인한다.

## 첫 위치 요청과 지도
- MapHome 첫 진입(클라이언트 준비 시)에 SDK 로딩과 병행하여 getCurrentPosition을 자동 시작한다. 브라우저의 기본 권한 UI를 사용하며 별도 확인 버튼을 요구하지 않는다. 이미 허용/거부된 권한은 브라우저 설정대로 처리한다.
- SDK보다 위치가 먼저 확인되면 최초 Map 생성 중심부터 검증된 내 위치를 사용하고 위치 마커를 표시한다. SDK가 먼저 준비되면 지도를 계속 사용할 수 있고, 위치가 확인되면 자동 이동한다. 기존 기본 zoom과 지도 높이·오버레이를 유지한다.
- 위치 조회에는 기존10초 timeout을 사용한다. 권한 거부·미지원·시간 초과·조회 실패·유효하지 않은 좌표는 지도와 기사 조회를 막지 않고 복구 가능한 안내를 표시한다. 권한 대화상자 응답 시간과 실제 팝업 표시는 브라우저가 제어한다.
- 좌표는 유한한 latitude[-90,90], longitude[-180,180]만 지도에 적용한다. 요청 중 내 위치 버튼은 중복 요청을 막고, 완료·실패 후 다시 사용할 수 있다.
- 같은 진입에서 React StrictMode·필터 변경·SDK 재시도로 위치 요청이 중복되지 않아야 한다. StrictMode effect 정리 뒤 도착한 유효 응답은 살아 있는 지도에 전달되며 버려져 영구 대기 상태가 되지 않아야 한다.
- 기사 상세·검색·목록에서 지도에 돌아올 때 저장된 메모리 뷰포트가 있으면 마지막 중심·zoom 복원을 우선하고 자동으로 현재 위치를 다시 덮어쓰지 않는다. 새 탭·새로고침에서는 다시 첫 진입 흐름을 사용할 수 있다. 기존 메모리 방식의 범위만 사용한다.
- 사용자가 자동 조회 중 지도를 직접 드래그하면 늦은 자동 응답으로 선택한 위치를 되돌리지 않는다. 이후 내 위치 버튼을 누르면 다시 수동 이동할 수 있다.
- SDK 실패·재시도·언마운트 뒤 오래된 위치 응답은 폐기된 지도/마커와 새 요청 상태를 바꾸지 않는다. 위치 버튼의 수동 재조회·오류 복구를 유지한다.
- 위치를 localStorage/sessionStorage/쿠키나 새 서버 API·로그에 저장/전송하지 않는다. 기존 지도 SDK 표시 이외의 추적이나 watchPosition 지속 추적은 추가하지 않는다.

## 범위와 정확 검사
- 기존 위치 테스트2개를 확장·교체한다. 새 정확 본문과 header/fixture는 failed-test-proposal.md 및 proposed-tests/map-home.test.ts.txt에 있다. header는 테스트마다 모듈을 초기화하고 StrictMode·SDK viewport/drag를 관찰할 수 있게 한다. 기존 SDK4개 검사 본문과 다른 테스트 파일은 그대로 유지한다.
- old2는 승인 baseline에서 분리하고 러너가 정확 새2개로 복원한다. 등록 baseline119개, 최종121개이며 테스트 생략/skip/가짜 통과는 없다. 전체 명령은 AGENTS.md의 ./node_modules/.bin/vitest run 그대로다.
- 아이콘 값/파일명을 그대로 따라가는 단위 테스트는 만들지 않고 실제 운영 HTML 링크·파일 응답·이미지 크기·시각 검수로 확인한다.
- 포맷·린트·타입 검사와 검증용 probe에서 기존4개PASS/자동위치2개RED를 승인 전에 확인한다.

## 완료
정확 초안 승인 → 소바야 구현·전체 회귀 → 기본 Next Turbopack 빌드·타입·실제 Chrome 권한 허용/거부·SDK 지연·뷰포트 복귀·모바일 화면·아이콘 응답/HTML 확인 → gate·신선한 읽기 전용 리뷰 → 저널·계획 보관·커밋·푸시·dev PR.
브라우저 검증은 검증용 좌표와 격리 권한 컨텍스트를 사용한다. 운영 계정이나 실제 사용자 위치는 조회하지 않는다. 패키지·잠금 파일·하네스·API 계약은 바꾸지 않는다. GitHub 코멘트·멘션·리뷰 요청·승인·머지는 별도 지시 없이 하지 않는다.

## 근거
- https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
