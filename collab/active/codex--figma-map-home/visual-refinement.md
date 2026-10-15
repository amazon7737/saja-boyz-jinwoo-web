# 최종 브라우저/소스 대조에서 확인할 항목

- MapPeriodFilter의 border-chip-border는 현재 globals.css 토큰에 없다. 원본 rgba(200,210,220,0.6)를 사용한다. 2026-10-15 추가 metadata/context18:2368 실측: row393×30, icon x16/42×30, period x64/60×27, category x130/82×27, status x218/60×27, gap6. text line15px·arrow8px/line10. 기존 공통기반의32px를 그대로 복제하지 않는다. stroke는 Figma 내부이므로 CSS border 포함 fixed dimensions에서 px11/py5가 내부 x12/y6 위치를 맞춘다. active period는 24시간/7일/30일로 짧게 표시해320px에 맞춘다.
- Preflight가 꺼져 있으므로 새 dropdown의 button에는 border-0/bg-transparent/필요한 bottom border/solid를 명시해야 한다. 현재 MapUnavailableFilter의 border-b만으로 native 2px outset와 회색 배경이 남을 수 있다. 설명 p에도 m-0를 적용하는지 확인한다. 원본 행160×46px·반경14·흰97%와 비교한다.
- 기본 필터 순서는 원본18:2348의 아이콘→기간→카테고리→상태다. 현재 중간 구현은 카테고리→상태→기간이므로 최종 source에서 정렬한다. 팝업은 기본393px에서 원본 위치로, 320px에서는 화면 안으로 제한한다.
- 필터 전체 그룹에 실제 접근성 role=group이 있는지 확인한다(aria-label만 있는 generic div로는 부족).
- 667×375에서 카드 전체 높이가 내 위치 버튼을 검색 헤더 뒤로 밀 수 있다. elementFromPoint hit test와 SDK 저작권 가림을 실제 캡처로 확인한다. 필요하면 낮은 화면의 카드 밀도를 조절한다.
- 기간 활성 칩의 긴 문구와 '발행일 기준' 안내가 320px 필터 행을 넘치지 않는지 확인한다.
- 선택된 필터 아이콘은 원본45:3409의 SVG가 /tmp/figma-map-home-evidence/filter-active.svg에 준비됨(18×18,1112bytes). 기존 회색 필터를 임의로 변색해 대체하지 않는다.
- docs/ui-contract.md는 각 UI 이름의 폴더를 요구한다. 새 carousel/card/image 파일이 현재 carousel 하나의 폴더에 있으므로 최종 컴포넌트 구조를 계약과 대조한다. 보호된 테스트/루트 명세를 건드리지 않는다.
- 추가 metadata/context18:2405: 카드200×152, padding12, header176×38(meta row16 + gap6 + title16), 이미지x12/y60/176×80. Figma stroke는 내부이므로 물리적 CSS border로 content174가 되지 않게 inset ring/outline 등을 사용한다. 데이터에 없는 배지를 만들지 않되 meta row16과 우측 발행일, title line16은 맞출 수 있다. 동적 실제 기사 내용/이미지를 유지한다.
- 추가 metadata/context18:2399: root852에서 bottom-container y521/h331, gradient h221(pt32,title17,gap12,cards152,pb8), card-list localy61, nav-container localy231(gradient221+gap10), nav68+bottom32. iOS상단37/하단25 제외 서비스790에서 gradienttop484, cardstop545, navtop715/bottom783. 기존 웹 메뉴bottom8을 유지하면 gradienttop483/cardstop544/navtop714의1px 차이는 명시 가능. overlay bottom reserve는 메뉴68+bottom8+gap10=86px, carousel 자체221px. 내위치는 원본 rooty463→service426이므로 gradient보다58px 위(버튼44,아래gap14). 낮은375높이는 별도 compact 처리가 필요하며 원본 고정 높이를 그대로 밀어 넣지 않는다.
- MapArticleSheet는 neighborhood까지 지역 대표 위치로 안내하는 기존 분기가 있다. 이번 명세의 precision 의미와 맞는지 확인한다. region의 기존 안내 문자열은 보호 테스트와 함께 유지한다.
- 초기 CLI Figma 인증은 별도라 실패했지만 앱 개인 MCP는 정상. 워커에는 실제 컨텍스트 파일, 부모는 실제 렌더를 기준으로 대조했다. runtime을 수정하거나 OAuth를 우회하지 않았다.
- all-screen-gaps의 제보는 PR22(ba81eb4) 기준으로 정정됨. 제보 파일은 수정하지 않는다.
- 마지막 문서 업데이트: 지도 API 계약·ui-contract·Figma 분석에 숫자 원/기간/카드의 실제 동작을 반영하고 인기/분류/상태/다른 화면 미완료를 분명히 한다. 임시 Figma asset URL을 최종 자산 문서나 런타임으로 남기지 않는다.

## 실제 브라우저 근거
HEAD ad423a0의 기본 Next production build에서109개 테스트와 승인 입력 보존은 통과했으나 667×375 내 위치 hit-test가 실패했다. 실제 버튼y6/height44로 header8~60 뒤에 가려짐. 기본393×790 필터 아이콘44×38(원본42×30), 일반칩30px(원본27), 순서가 icon/category/status/period이며320px의30일 적용 시 기간이 y112로 줄바꿈됐다. modal fieldset에 기본 groove 테두리가 남아 있다. 실제 캡처/metrics는 /tmp/figma-map-home-evidence/before-polish/에 있다. 이 문서는 승인 명세의 시각 보정과 첫 독립리뷰2건 수정을 위한 것이며 새 테스트/기능 승인 변경이 아니다.
