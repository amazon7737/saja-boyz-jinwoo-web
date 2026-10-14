# 공용 UI와 기사 데이터 계약

2026-10-14 공통 디자인 기반 구현 기준. 이전 scaffold의 미구현 컴포넌트·URL 필터 설명을 실제 계약으로 교체했다.

| 컴포넌트         | 경로                                                          | 입력과 역할                                                                                                          |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Brand            | src/components/layout/brand/brand.tsx                         | 흉흉 홈 링크. 로컬 SVG 64×24px, 이미지 alt와 화면 읽기 도구용 브랜드 텍스트                                          |
| SearchHeader     | src/components/layout/search-header/search-header.tsx         | isHome: boolean. 지도에서 떠 있는 헤더, 목록에서 일반 흐름 헤더. 검색 링크 /search                                   |
| ArticleFilters   | src/components/layout/article-filters/article-filters.tsx     | isHome: boolean. 기간·카테고리·상태 준비 중 버튼. 지도에서 원본 필터 아이콘 추가                                     |
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

기간·카테고리·상태 필터는 모두 disabled이며 title에 준비 중 안내가 있다. URL을 변경하거나 가짜 결과를 만들지 않는다. 이전 목표 문서의 FilterBar, IncidentFilterControls, IncidentBadges, /ui-preview, URL category/status/period 유틸은 현재 공용 구현 계약이 아니다.

API에 없는 사건 분류·상태·발생 시각·타임라인·인용 수·거리·LIVE 수치를 임의 생성하지 않는다. API 필터 규약이 확정되면 별도 승인한 기능으로 연결한다.

## 후속 디자인 작업

이 기반 PR은 전체 디자인 완료가 아니다. 지역 고정 좌표와 기사 수에 따른 숫자 원(1건 포함), 지도 가로 기사 카드, 목록·검색 카드 본문, 상세 타임라인/위치, 선택·공유 시트와 제보 본문 세부 모양은 후속 범위다. 화면별 비교는 같은 브랜치 visual-verification.md를 확인한다.
