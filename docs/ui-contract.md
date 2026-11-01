# 공용 UI와 기사 데이터 계약

2026-10-15 지도 홈 연결을 포함한 공통 디자인 기반 구현 기준. 이전 scaffold의 미구현 컴포넌트·URL 필터 설명을 실제 계약으로 교체했다.

| 컴포넌트         | 경로                                                          | 입력과 역할                                                                                                          |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Brand            | src/components/layout/brand/brand.tsx                         | 흉흉 홈 링크. 로컬 SVG 64×24px, 이미지 alt와 화면 읽기 도구용 브랜드 텍스트                                          |
| SearchHeader     | src/components/layout/search-header/search-header.tsx         | isHome: boolean. 지도에서 떠 있는 헤더, 목록에서 일반 흐름 헤더. 검색 링크 /search                                   |
| ArticleFilters   | src/components/layout/article-filters/article-filters.tsx     | isHome: boolean. 목록의 기간·카테고리·상태 준비 중 버튼. 지도에는 추가하지 않음                                      |
| BottomNavigation | src/components/layout/bottom-navigation/bottom-navigation.tsx | pathname: string. /, /report, /incidents 이동. 지도·목록은 aria-current=page, 검색은 지도 영역 aria-current=location |
| AppShell         | src/components/layout/app-shell/app-shell.tsx                 | children: ReactNode. 화면별 조합과 FeatureErrorBoundary. 본문과 API 로직은 각 기능이 소유                            |

각 UI는 해당 이름의 폴더 안에 두고 의미 있는 행동 테스트가 필요한 경우에만 테스트를 함께 둔다. 공통 행동 테스트는 app-shell/app-shell-foundation.test.ts에 있다.

## 화면별 조합

- `/`: 전체 높이 실제 Naver 지도 위에 검색 헤더·필터·메뉴. SDK 네이티브 로고·저작권·축척을 메뉴·선택 시트 위로 배치하고 컨트롤 미지원 시 기본값으로 복구한다.
- `/search`: 기능 내부 전용 검색 행과 공통 메뉴. 공통 검색 헤더·필터는 추가하지 않는다. 최근 검색·키워드 검색·무한 스크롤·재시도는 유지한다.
- `/incidents`: 검색 헤더·필터·메뉴. 접근성 목록 제목은 시각적으로 숨기고 카드 좌우 여백은 shell에서 한 번 적용한다.
- `/incidents/[id]`, `/report`: 공통 검색 헤더·주 메뉴 없이 흰 전체 화면. 전용 헤더와 본문은 각 라우트가 소유한다.

393px에서 헤더52px, 메뉴68px, 제보 버튼54px, 좌우16px가 기준이다. 지도 헤더 top8px, 목록 top12px, 검색 top20px에 safe-area를 더한다. 메뉴 bottom8px에 safe-area를 더하고 넓은 화면은 shell max640px, 메뉴 max608px를 적용한다. 기기 목업의 시각·배터리·홈 바는 넣지 않는다.

## 자산과 폰트

globals.css의 로컬 @font-face는 라틴·숫자 Inter Variable v4.1, 한글 Pretendard Variable v1.3.9 순서로 연결한다. public/fonts에 원본 woff2와 OFL 라이선스를 보관한다. 외부 CDN이나 새 의존성은 없다.

- 창작 브랜드: public/brand/hyunghyung.svg, viewBox 0 0 128 48. 글자는 path이며 런타임 폰트에 의존하지 않는다.
- Figma 지도 아이콘: public/navigation/map-pin.svg, 원본22×22px.
- Figma 필터 아이콘: public/filters/filter.svg, 원본18×18px.

원본 출처·SHA256은 collab/active/codex--figma-ui-foundation/asset-sources.md와 asset-manifest.json, 노드 링크는 [디자인 분석](figma-analysis.md)에 기록한다.

## 실제 데이터와 준비 중 표면

뉴스·지도 계약은 docs의 API 계약 문서를 확인한다. 기사 UI 타입은 src/features/article-list/model/article.types.ts에 있다. 발행 시각을 사건 발생 시각으로 바꾸어 표시하지 않는다.

목록의 ArticleFilters는 모두 disabled이며 title에 준비 중 안내가 있다. 지도 필터는 MapHome이 데이터와 함께 소유하며 아래 계약을 따른다. URL을 변경하거나 가짜 결과를 만들지 않는다. 이전 목표 문서의 FilterBar, IncidentFilterControls, IncidentBadges, /ui-preview, URL category/status/period 유틸은 현재 공용 구현 계약이 아니다.

API에 없는 사건 분류·상태·발생 시각·타임라인·인용 수·거리·LIVE 수치를 임의 생성하지 않는다. API 필터 규약이 확정되면 별도 승인한 기능으로 연결한다.

## 후속 디자인 작업

지도 숫자 원·가로 기사 카드·기간 필터·전체 필터는 지도 홈에서 연결했다. 목록·검색 카드 본문과 상세 간격은 추가 피드백으로 보정했다. 상세 타임라인/위치·커스텀 공유 시트 동작은 후속 범위이며 제보 보정은 PR22를 기준으로 판단한다. 이번 지도 검증은 codex--figma-map-home/verification.md, 전체 화면별 남은 차이는 같은 폴더의 all-screen-gaps.md를 확인한다.

## 지도 홈의 실제 연결

- `MapHome`: API 지도 기사 결과·공개 SDK clientId를 받아 SDK/카메라 수명주기와 데이터 동기화를 소유한다. `MapAllFilters`, `MapPeriodFilter`, `MapUnavailableFilter`는 각각의 UI 폴더에 있으며 데이터 로직은 map/model에서 분리한다. 카테고리/상태는 서버 계약 미제공을 명시한다.
- `MapArticleCarousel`, `MapCarouselCard`, `MapCarouselImage`: 각각의 이름 폴더. 실제 기사 발행시각·이미지·상세 링크를 표시하고 이미지 실패만 해당 이미지가 소유한다. 카드 전체도 같은 단일 상세 링크로 접근하며 실제 상세 URL은 바꾸지 않는다.
- 기본393px 필터: icon42×30, 기간60×27, 카테고리82×27, 상태60×27, gap6. 선택 기간은 짧은 칩 문구와 접근성 설명을 제공하고 popup/전체 필터에 발행일 기준을 보인다. 원본의 활성 필터 SVG는 public/filters/filter-active.svg(18×18)를 그대로 쓴다.
- 일반 높이의 카드200×152, 내부 이미지176×80, 간격10. carousel221px와 메뉴 사이10px를 유지한다. 기존 메뉴68/bottom8을 유지해 정규화 Figma와 세로1px 차이가 있다. 높이550px 이하에서는 이미지 없는62px 카드로 압축해 내 위치/필터/메뉴가 겹치지 않게 한다.
- 전체 필터는 밝은 공통 시트 적용안이다. 임시 선택·적용/취소/초기화, focus trap·배경 inert·스크롤/포커스 복구를 제공한다. 별도의 완성된 밝은 전체 필터 원본이 있는 것처럼 표현하지 않는다.
- SDK 네이티브 저작권·로고·축척은 공개 컨트롤을 유지하며 카드와 선택 시트 위로 배치한다. 시안 지도 이미지를 제품 배경으로 사용하지 않는다.

## 검색·목록·상세 표시와 인터랙션

- 검색 결과는 search/ui/search-result-card의 텍스트 카드가 소유한다. 제목/요약은 원문 텍스트를 안전하게 표시하고 실제 검색어만 mark로 강조한다. GET q·무한 스크롤·재시도·최근검색 저장/삭제 계약은 같다.
- 목록은80px 썸네일과 실제 제목/발행일/요약/원문 링크를 유지한다. 이미지 위 AI 표시는 이미지 실패 시 함께 사라진다.
- 상세는 전용 헤더와 제목/발행일 묶음,140px 사진/fallback, 출처/요약/하단 공유를 제공한다. 분류·상태·발생 위치·타임라인·인용수는 서버가 없어 생성하지 않는다.
- 사용자 요청의 모션은 컨트롤 눌림·필터/시트 진입·검색 결과 교체에만 짧게 적용하며 prefers-reduced-motion을 존중한다. 데이터/SDK/복귀/공유나 포커스 수명주기는 바꾸지 않는다.

모션 클래스: ui-control/ui-link는120ms 색상·그림자, 실제 button만scale0.98, ui-dropdown-enter는140ms/4px, ui-sheet-enter는190ms/10px, ui-overlay-enter는190ms opacity, ui-results-enter는140ms opacity다. CSS는prefers-reduced-motion:no-preference 아래에만 공간 이동/등장을 두며 reduce에서는animation/transition을none으로한다. disabled/aria-disabled 컨트롤은활성피드백에서제외한다. 추가JS상태나닫기지연을사용하지않는다.

## 아이콘과 텍스트

일반 UI는 `components/ui/icon/icon.tsx`와 `icon-text/icon-text.tsx`를 사용한다. OS별 이모지의 실제 폭이나 문자 공백으로 간격을 맞추지 않는다. 외부 아이콘 패키지는 추가하지 않는다.

| 역할      | SVG 박스 | 사용                         |
| --------- | -------- | ---------------------------- |
| indicator | 8px      | 좁은 필터의 펼침 표시        |
| compact   | 12px     | 날짜·출처·작은 보조 링크     |
| default   | 14px     | 위치·시계·돋보기·추천 키워드 |
| action    | 16px     | 기사 공유                    |

`globals.css`의 `--spacing-icon-*` 토큰이 실제 박스와 gap을 정한다. `IconText`는 중앙 정렬, 아이콘 수축 방지, 텍스트 min-width0를 기본으로 한다. 간격은 compact4px, default6px, comfortable8px이며 작은 칩/필터·메타정보·공유/최근 검색에 맞춰 선택한다. 출처는 suffix 아이콘과 텍스트만 밑줄·말줄임을 유지하고, 긴 위치는 줄바꿈하되 아이콘과 겹치지 않는다.

아이콘은 장식용 `aria-hidden`/`focusable=false` SVG다. 실제 버튼·링크·입력의 접근 이름과 조작 영역은 사용처가 유지한다. 제보 위치 affix는 좌측14px+아이콘14px+간격6px의 입력 패딩을 사용하며 테두리1px은 별도로 남는다. 고정 폭 필터는 아이콘을 키우지 않고 작은 표시 역할과 안쪽 패딩으로 글자를 온전히 유지한다.

승인된 브랜드 로고, 지도 숫자원·마커, 메가폰, 내 위치/닫기/필터의 독립 SVG, 로딩 스피너와 네이티브 날짜 선택기는 별도 목적의 크기를 유지한다. 이를 inline 아이콘 크기로 일괄 축소하지 않는다.

## 지도 숫자 원의 상대 크기

`map-display-groups.ts`는 현재 지도 캔버스 안의 대표점만 모아 고유 기사 수를 비교하고 최종 `diameter`를 반환한다. 캐러셀의 최근4개 제한이나 화면 밖 대규모 그룹을 크기 분포에 섞지 않는다. SDK 투영/양수 화면 치수를 사용할 수 없는 환경에서는 전체 좌표 그룹을 사용한다.

서로 다른 건수는 로그 비율과 최소 시각 간격으로38.4–88px에 연속 배치한다. 고유 건수가 적으면 인접 차이는 최소4px, 많으면 전체 범위를 나눈 간격을 사용한다. 같은 건수는 같은 지름이며 단일/모두 동률은48px이다. 특정 기사 수 구간이나1/2/12 전용 분기는 없다. 이는 통계 면적의 정비례 표현이 아니라 상대 규모의 가독성을 위한 규칙이다.

겹치는 원의 연결요소를 고유 기사로 병합하고 새 분포에서 크기를 다시 계산해 더 이상 겹침이 없을 때 마친다. 한 계산 안에서는 병합만 하고 다음 이동·줌·필터·resize에서는 원본 그룹에서 시작한다. 렌더링된 너비/높이와 SDK anchor, 충돌 판정은 같은 최종 지름을 사용한다. 대표점·기사 ID 집합이 유지되는 선택은 크기 변화에도 시트와 포커스를 유지하며, 닫기 시 현재 마커로 복귀한다.

지도 좌표 보완: Naver의 `fromCoordToOffset`은 SDK가 삽입한 이동 DOM pane 기준이다. 현재 지도 중심의 offset을 빼고 외부 canvas 반폭/반높이를 더해 viewport 좌표로 정규화한다. 원점이 우연히 일치하는 최초 화면만으로 pan·resize 처리를 검증하지 않는다. [공식 좌표계 문서](https://navermaps.github.io/maps.js.ncp/docs/tutorial-Projection.html).

## 로딩 피드백

- 이미지 다운로드 중에는 예약된 목록·지도 카드·상세 이미지 영역에 장식 스켈레톤을 표시한다. 성공·실패·다른 URL·브라우저 캐시 완료에서 종료한다. 이미지 없음 표시와 AI 캡션, JS 비활성 이미지 가시성을 유지한다.
- 최초 홈의 서버 기사 조회는 전체 높이 지도 표면과 카드 스켈레톤·스피너를 표시한다. 실제 SDK/위치 조회는 데이터 준비 뒤 기존 MapHome이 담당한다. Figma 필터와 비활성 옵션은 그대로 유지한다.
- 검색 버튼/Enter 제출은 버튼 스피너와 결과 스켈레톤을 표시한다. 입력·GET q·URL 인코딩은 유지하고 대기 중 중복 제출과 결과 포커스를 막는다. 같은 검색어 제출도 새 결과와 페이지 상태로 교체한다.
- 상세 재시도는 오류 안내와 실제 href를 유지하며 스피너·busy와 중복 방지를 제공한다. 성공/재실패에서 대기를 끝내며 수정키·새 탭 링크 동작도 유지한다.
- 로딩 문장은 화면 읽기 도구용으로만 제공한다. 실제 오류·빈 결과·준비 중 필터 안내는 로딩과 구분하여 유지한다. 직접 공유 주소의 첫 HTML 이전 대기는 브라우저 문서 요청 구간이며 서버 본문/SEO/404를 보존한다.

## 기사 시트의 기본·수동 확장

모든 지도·목록·검색·직접 상세는 기본 접힘 상태로 시작한다. 기본은 `height:auto`와 `max-height:53.52dvh`로 내용만큼 열리며 최대 화면 절반 정도를 사용한다. 이 비율은 Figma852px 화면의456px 패널을 기준으로 한다.

사용자가 핸들을 위로24px 이상 드래그하거나 키보드/클릭으로 펼치면 `height`와 `max-height`를 `calc(100dvh - max(49px, env(safe-area-inset-top)))`로 전환해 실제 상단 가까이 확장한다. 아래 드래그/접기는 기본 내용 높이로 돌아간다. 수동 확장의 공간은 사용자 요청이며 기본 상태의 불필요한 공백과 구분한다. 공유는 본문 흐름에 두고 `mt-auto`로 앞 여백을 만들지 않는다. 높이/상한 전환은 reduced-motion을 존중한다.

본문은 flex-auto/min-h-0·내용 수축 방지로 내부 스크롤한다. 기존 focus trap·body lock·선택 시트의 숨긴 DOM/스크롤·포커스 복귀·높이 보고 observer를 유지한다. JS 없는 직접 유입도 기본 시트에서 서버 본문과 CSS 스크롤을 제공하며 확장 조작만 JS에 의존한다. 메타데이터·공유 주소·실제404와 기존 전체 필터는 유지한다.

## AI 이미지 안내 범위

“AI로 생성된 이미지입니다.”는 실제 이미지가 있는 상세 시트와 지도 선택 시트의 이미지 바로 아래에만 작게 표시한다. 상세10px/15px, 선택 썸네일9px/12px를 사용한다. 일반 목록과 지도 하단 카드에는 AI 배지를 표시하지 않는다. 이미지 없음/실패에서는 시트 캡션도 숨기고 pending/성공에는 유지한다. 선택 시트의 공통 ArticleImage는 명시적인 showAiCaption 옵션을 켜며, 기본값은 표시하지 않음이다. 스켈레톤은80px 이미지 wrapper 안에 두어 캡션 영역을 덮지 않는다.

## 지도 필터 드롭다운 공통 스타일

기간·카테고리·상태는 `map-filter-dropdown`의 `MapFilterTrigger`, `MapFilterPanel`, `MapFilterOption`을 함께 사용한다. 기간 필터를 기준으로27px 트리거,12px 글자, 흰 패널·12px 모서리·테두리·6px 패딩·공통 그림자, 선택 항목의 브랜드 색상과 옅은 배경을 통일한다. 카테고리의 기존82px 너비와 나머지60px 너비, 상태 메뉴의 좁은 화면 정렬은 유지한다. 카테고리·상태의 미제공 항목은 계속 disabled이며 기간 선택·닫기·포커스 복귀 로직은 각 필터가 소유한다. 설명 문단의 sr-only 정책은 이 공통 스타일과 독립적으로 유지한다.
