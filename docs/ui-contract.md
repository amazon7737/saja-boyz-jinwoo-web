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
- `/search`: 기능 내부 전용 검색 행과 공통 메뉴. 공통 검색 헤더·필터는 추가하지 않는다. 최근 검색·키워드 검색·더 보기·재시도는 유지한다.
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

- 검색 결과는 search/ui/search-result-card의 텍스트 카드가 소유한다. 제목/요약은 원문 텍스트를 안전하게 표시하고 실제 검색어만 mark로 강조한다. GET q·더보기·재시도·최근검색 저장/삭제 계약은 같다.
- 목록은80px 썸네일과 실제 제목/발행일/요약/원문 링크를 유지한다. 이미지 위 AI 표시는 이미지 실패 시 함께 사라진다.
- 상세는 전용 헤더와 제목/발행일 묶음,190px 사진/fallback, 출처/요약/하단 공유를 제공한다. 분류·상태·발생 위치·타임라인·인용수는 서버가 없어 생성하지 않는다.
- 사용자 요청의 모션은 컨트롤 눌림·필터/시트 진입·검색 결과 교체에만 짧게 적용하며 prefers-reduced-motion을 존중한다. 데이터/SDK/복귀/공유나 포커스 수명주기는 바꾸지 않는다.

모션 클래스: ui-control/ui-link는120ms 색상·그림자, 실제 button만scale0.98, ui-dropdown-enter는140ms/4px, ui-sheet-enter는190ms/10px, ui-overlay-enter는190ms opacity, ui-results-enter는140ms opacity다. CSS는prefers-reduced-motion:no-preference 아래에만 공간 이동/등장을 두며 reduce에서는animation/transition을none으로한다. disabled/aria-disabled 컨트롤은활성피드백에서제외한다. 추가JS상태나닫기지연을사용하지않는다.
