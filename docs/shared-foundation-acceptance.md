# 공용 기반 단계와 인수 조건

2026-10-02 amazon7737의 PR #1 피드백을 반영한 승인 전 계획이다. 범위표는 정확한 테스트 본문 승인이나 GREEN 증거를 대신하지 않는다.

## 1단계: 공용 레이아웃 체크포인트

기존 초안 browseChrome/navigationKeepsFilters/selectedFilters/immersiveRoutes 4개로 검색·필터·내비게이션의 배치, 선택 표시와 상세·제보 레이아웃을 시작한다. 정적 HTML 검사만으로 상호작용이나 공용 기반 완료를 판정하지 않는다. 이 단계만 끝난 상태에서는 amazon에 완료 인수를 요청하지 않는다.

## 2단계: 재사용 가능한 공용 기반

SearchHeader, FilterBar, IncidentFilterControls, IncidentBadges, BottomNav를 docs/ui-contract.md의 props로 제공한다. 배지는 society/security/politics/international과 ongoing/publicized/closed의 라벨·표현을 지원한다. 기존 Incident/IncidentFilters와 filterIncidents를 유지하며 readFilterSelection/writeFilterSelection/toIncidentFilters를 제공한다. 정확한 테스트 본문과 필요한 DOM 테스트 지원은 2단계 baseline 승인 전에 초안으로 제시한다.

| 검증 영역        | 반드시 확인할 입력·행동과 결과                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL 읽기         | 모든 category 4개, status 3개, period 3개를 각각 읽기. q 공백 제거. 빈 값·미지원 enum은 선택에서 제외                                                                           |
| URL 쓰기·왕복    | 한글·공백·&·+ 검색어와 모든 선택값의 read→write→read 일치. 원본 URLSearchParams 불변, page/view 같은 기존 params 보존                                                           |
| 기간             | 고정 now로 1w=7일, 1m=30일, 3m=90일 UTC since 변환. filterIncidents의 시작 경계 직전 제외·정각 포함·직후 포함. 시간대·연도 경계 포함                                            |
| 실제 선택        | 각 기간·분류·상태 라디오를 DOM에서 선택 → router URL 갱신 → 갱신 URL로 렌더 → 선택 라벨·checked 표시 확인. 사회/진행 중/1주 외 모든 값 포함                                     |
| 화면 상태 초기화 | 필터 선택·초기화 시 page 삭제, q와 view 등 무관 params 보존. 초기화는 category/status/period만 삭제. URL 쓰기 유틸 자체는 page를 지우지 않고 화면 어댑터가 결과 페이지를 초기화 |
| 양방향 이동      | 홈에서 목록 링크 실행, 목록에서 홈 링크 실행. 각 대상 URL에서 필터·검색어 유지와 올바른 활성 메뉴 확인. 화면 전용 page는 전달하지 않음                                          |
| 잘못된 URL       | category/status/period가 미지원 문자열이면 기본 선택, 렌더 오류 없음. 유효 값과 잘못된 값이 섞여도 유효한 선택은 유지                                                           |
| 드롭다운         | 실제 버튼으로 열기, 선택 후 닫힘, Escape로 닫힘·트리거 포커스 복귀, 바깥 클릭과 포커스 이동으로 닫힘. 닫을 때 URL·선택 불변                                                     |
| 초기화 버튼      | 선택이 없으면 disabled. 클릭 후 검색어 유지, 조건 삭제, page 초기화, 선택 표시 기본값 복귀                                                                                      |
| 배지·재사용      | 모든 분류·상태 라벨, 공용 컴포넌트 props로 렌더. 화면이 같은 헤더·필터·메뉴를 중복 추가하지 않음                                                                                |

DOM 행동 테스트는 이벤트를 실행하고 실제 router 호출 및 다시 렌더된 상태를 검사한다. 소스 문자열이나 aria-label 존재만으로 성공 처리하지 않는다. 필요한 환경·imports·runnable 준비는 사용자 검토 대상이다. 새 테스트는 승인 전에는 초안이며 환경 오류를 RED로 인정하지 않는다.

## 3단계: 인수와 dev 통합

1. 1·2단계의 명세·정확한 테스트·지원 코드·전체 검사 계약을 승인 baseline에 기록한다. 단계별 승인과 checkpoint SHA를 남긴다.
2. sobaya가 승인된 항목을 materialize하고 RED→워커→전체 GREEN을 검증한다. 기존 테스트·하네스 스위트와 lint·format·typecheck·build도 통과해야 한다.
3. 브라우저에서 Figma 치수·원본 SVG·모바일 레이아웃·키보드 동작을 확인하고 근거를 기록한다.
4. 최종 sobaya gate 통과와 해당 HEAD에 바인딩된 독립 review 결과를 PR에 기록한다. plan 보관 커밋 이후 차이가 있으면 그 SHA도 명시한다.
5. amazon은 위 재사용 계약과 증거를 확인하고 리뷰 승인한다. feature→dev는 squash, dev→main은 별도 리뷰 PR. 구현 워커 review와 GitHub 사람의 승인은 각각 확인한다.

## GitHub 정책 적용 상태

dev는 main의 c8ee953에서 생성했다. 2026-10-02 사용자 공개 전환 후 저장소는 public이며 main/dev 보호 API 적용과 조회 모두 성공했다. 양쪽 모두 승인 1명, 마지막 push 작성자 외 승인, 새 push 재승인, 필수 CI 3개, 최신 base와 대화 해결을 요구하고 관리자에게도 적용한다. force push·삭제를 금지하고 선형 히스토리를 요구한다. 저장소는 squash만 허용하고 merge/rebase merge 및 auto-merge를 끈다. 로컬 하네스도 dev/main 직접 코드 push를 막는다.

같은 시점 PR #1의 base는 dev, reviewDecision은 REVIEW_REQUIRED, mergeStateStatus는 BLOCKED로 확인했다. 이 값은 리뷰·CI에 따라 변하는 현재 상태이며 계속 고정되는 값은 아니다. 이전 비공개 상태에서의 403은 과거 기록이며 현재 미적용 상태를 뜻하지 않는다. 관리자의 저장소 설정 변경 권한 자체까지 막은 것은 아니다.
