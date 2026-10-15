# 진우 목록 더 보기·공용 UI 연결 — 승인 전 조사 제안

작성: 2026-10-05. **구현·테스트 승인 전 제안이다.** 이 문서의 권장값은 새 승인 계약이 아니다. 테스트 작성·실행, 앱/수집기 코드·리포·원격 변경 없이 현재 소스와 문서만 읽었다.

- 앱 조사 기준: `saja-boyz-jinwoo-codex--article-list-api@7a2672a6941343b5d96546b9ced3546f97393fa5`.
- API 조사 기준: `poem-news-collector@890b64d45224a4dfd5a7a5dc00a3d7ef13a5b14a`의 실행 구현인 Go 서버. 이 조사에서 운영 API의 최신 배포 상태를 다시 조회한 것은 아니다.
- 현재 확정된 기사=사건, `기사 발행` 표시, 없는 분류·진행 상태·위치·타임라인 미생성, ID 중복 제거, 안전한 원문 링크 정책은 유지 대상으로 본다. 이를 다시 결정받을 필요는 없다.

## 1. 실제 GET /news 계약

| 항목 | 확인된 코드 동작 | 근거 |
|---|---|---|
| 페이지 | `offset` 기본 0·0 이상, `limit` 기본 20·1–100. 잘못된 숫자는 422. 응답 `{total, items}`. | [pageParams](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:195) |
| 정렬 | UTC 수집 시각을 포함한 snapshot 파일명 역순으로 읽고, 각 snapshot의 원본 기사 배열 순서를 유지해 평탄화한다. 발행 시각 내림차순으로 전체 기사를 재정렬하지 않는다. 같은 수집 시각이면 파일명 UUID가 tie-break다. | [파일 순서](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/storage/json_store.go:56), [평탄화](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:164), [파일 ID](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/news/model.go:110) |
| 검색 | 선택적 `keyword`: 앞뒤 공백 제거, 소문자화 후 기사 원본 title 또는 description의 부분 문자열 검색. 검색한 결과를 만든 다음 offset/limit을 적용한다. | [keyword 처리](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:156), [일치 기준](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:190) |
| total/offset 단위 | 검색 후 중복을 포함한 수집 기사 행. 고유 기사 수가 아니다. offset 이상 남은 행이 없으면 `items=[]`, total은 전체 일치 행 수를 유지한다. | [slice와 total](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:182) |
| 동일 기사 | 수집 이력마다 행은 유지한다. `article_id`는 originallink(빈 값이면 link)의 SHA256 소문자 hex. 앱은 이 ID를 그대로 사용해야 하며 제목만으로 합치면 안 된다. | [ID](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/images.go:45), [중복 보존 기존 검사](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/image_pipeline_test.go:70) |
| 미지원 | GET /news에는 category, status, period/since, pubDate 정렬, 기사 고유 총수, snapshot/cursor가 없다. 수집 POST의 `sort=date/sim`은 GET 전체 이력의 정렬 옵션이 아니다. | [조회 구현](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/httpapi/server.go:150), [수집 파라미터](/Users/kangminkim/lunch/sobaya/apps/poem-news-collector/internal/news/model.go:32) |

`keyword`는 HTML 태그 제거·엔티티 해독 전 원문 필드를 검색한다. 따라서 화면에 보이는 정제된 문자열 검색과 완전히 같다고 설명하면 안 된다. API 검색 의미 변경은 이번 앱 제안의 기본 범위가 아니다.

## 2. 최소 동작 권장안 — 아직 승인 전

**추천: 명시적 ‘더 보기’ 버튼, 한 번에 raw 20행 한 요청, 기존 카드 유지·뒤에 추가.** 무한 스크롤, 자동 여러 페이지 순회, 번호 페이지, 전체 기사 수 표시는 넣지 않는 작은 후속 작업을 제안한다.

| 상황 | 권장 동작 |
|---|---|
| 최초 요청 | 기존 서버 GET `offset=0&limit=20`과 기존 카드 표시 정책 유지. 새로 필요한 raw 총수/다음 offset은 페이지 제어에만 사용한다. |
| 다음 요청 | 마지막으로 성공한 요청의 `offset + items.length`를 다음 offset으로 사용한다. 화면에 추가된 고유 카드 수로 계산하지 않는다. 앱 서버를 경유해 고정된 NEWS API에 GET하며 브라우저 직접 API 호출·수집 POST는 추가하지 않는다. |
| 중복 | 현재 탐색 세션 전체의 `article_id`를 기준으로 중복 제거한다. 먼저 본 카드와 위치·내용을 유지하며 처음 보는 ID만 API 순서대로 끝에 붙인다. 같은 제목의 다른 ID는 보존한다. 이후 중복 행으로 기존 카드의 이미지/본문을 갱신하는 기능은 넣지 않는 안이다. |
| 정렬 | 첫 응답과 추가 응답의 수집 이력 순서를 유지한다. 클라이언트에서 pubDate로 다시 정렬하지 않는다. UI가 ‘최신 기사순’이라고 오해하게 만들지 않는다. |
| 끝 판단 | 성공한 응답의 raw `nextOffset >= total`이면 더 보기를 종료한다. 정상 API의 `items=[]` 역시 끝이다. 마지막 페이지가 20행이어도 offset+20=total이면 종료한다. 고유 카드가 20개 미만이라는 이유로 종료하지 않는다. |
| 중복만 있는 페이지 | raw 20행이 모두 기존 ID여도 offset은 20 전진한다. total이 더 남으면 버튼을 유지하고 ‘이번 조회에 새 기사가 없어요’ 같은 status를 알린다. 한 클릭으로 자동 다음 요청을 연속 실행하지 않는다. 다음 클릭은 전진한 offset을 사용한다. 마지막 중복 페이지이면 카드 수는 그대로 두고 종료한다. |
| 더 보기 대기 | 기존 카드·원문 링크를 유지한다. 버튼 중복 실행을 막고 로딩 status를 제공한다. 최초 로딩 화면으로 목록 전체를 되돌리지 않는다. |
| 더 보기 실패 | 기존 카드·순서·다음 offset을 보존하고 목록 아래 추가 로딩 오류와 재시도 액션을 표시한다. 같은 offset/검색 조건으로 재시도하며, 실패로 페이지를 건너뛰거나 처음 목록으로 돌아가지 않는다. 기존 5초 제한·내부 오류 비노출·명시적 재시도 방식을 유지한다. |
| 검색 조건 변경 | 검색어가 실제 연결된 단계에서는 기존 누적 카드·seen ID·offset·추가 로딩 오류를 초기화하고 새 조건의 offset=0부터 조회한다. 이전 조건의 늦은 응답은 취소하거나 무시하여 섞이지 않게 한다. 요청 중 반복 클릭도 같은 페이지를 중복 반영하지 않아야 한다. |
| 접근성 | native button 및 키보드 실행, 로딩/새 카드 수/중복뿐 결과/마지막 결과 status, 실패 alert를 제안한다. 완료 시 임의로 카드나 문서 상단에 포커스를 옮기지 않는다. 버튼이 마지막에 사라질 때 포커스 처리도 구체 테스트 초안에서 확인할 항목이다. |

예시: 첫 요청 raw 20행 → 고유 12카드이면 다음 offset은 20이다. 다음 raw 20행이 모두 중복이면 카드 12개, 다음 offset 40이다. total 43에서 offset 40 응답이 raw 3행(고유 새 기사 1개)이면 카드 13개로 끝낸다. total=43을 ‘사건 43건’으로 표시하지 않는다.

응답 구조 검사·날짜·본문·출처·이미지 계약과 기존 21개 승인 테스트는 보존 대상으로 둔다. 상충하는 새 동작이 필요하면 기존 테스트를 몰래 수정하지 않고 별도 승인안을 제시해야 한다. 현재 최초 빈 결과 문구는 무검색 상황의 ‘아직 수집된 기사가 없어요’다. q 검색까지 연결하는 단계에서 검색 결과 0의 안내 문구는 별도 제안으로 정해야 한다.

## 3. offset 페이지의 실제 한계

각 GET은 그때 저장소를 다시 읽으며 고정 snapshot/cursor가 없다. 탐색 중 새 collection이 앞에 추가되면 다음 offset의 경계가 밀린다. 앱 전체 ID 중복 제거는 이미 본 카드의 재노출을 막지만 **새로 앞에 들어온 모든 기사를 이번 탐색에서 빠짐없이 받는 보장**은 만들지 못한다. 원본 수집순은 유지해도 사용자 세션 전체가 한 시점의 스냅샷이라고 주장할 수 없다.

최소 권장안은 현재 API를 유지하고 새로고침/검색 조건 재진입 시 처음부터 최신 이력을 읽는 것이다. ‘탐색 시작 시점의 모든 기사 무누락·정확한 고유 총수’가 필수라면 서버의 snapshot/cursor 또는 별도 고유 기사 목록 계약이 먼저 필요하며, 이는 별도 API 변경 승인이 필요한 대안이다. 끝 표시는 ‘현재 목록을 모두 확인했어요’ 정도로 두고 영구적인 전체 수집 완료를 뜻하지 않게 한다.

## 4. 공용 UI·URL 연결의 소유권과 간극

| 영역 | 현재 사실·권장 연결 경계 |
|---|---|
| 소유권 | SearchHeader·FilterBar·IncidentFilterControls·IncidentBadges·BottomNav·AppShell 및 `readFilterSelection/writeFilterSelection/toIncidentFilters`는 솔피(easter721) 담당이다. 우리 목록의 새로운 shared UI/URL 유틸 복제품을 만들지 않는 안이다. [분담](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/work-split.md:15) |
| 실제 제공 여부 | 이 작업트리의 ui-contract는 재개발 목표라는 정정이 있고 shared UI/URL 어댑터는 아직 없다. claim의 active만으로 인수 완료를 판단하지 않는다. 재사용 컴포넌트·URL·실제 DOM 상호작용·gate·독립 리뷰까지 확인 후 소비한다. [계약 상태](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/ui-contract.md:3), [인수 조건](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/shared-foundation-acceptance.md:9) |
| 검색 | 공유 URL의 `q`를 승인된 공용 읽기 어댑터로 해석하고 API `keyword`에 연결하는 것이 가능한 다음 단계다. 문자열은 URLSearchParams로 전달하고 빈 q는 무검색으로 본다. 검색 입력·최근 검색 화면 자체는 솔피 담당이다. [q 계약](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/ui-contract.md:24) |
| 분류·상태 | 현재 기사 API에 데이터나 필터가 없다. 선택 UI만 보이고 실제 결과는 무시되는 형태로 연결하면 안 된다. 가짜 값을 채우거나 수집한 일부 20행을 사건 전체인 것처럼 필터링하지 않는다. 기사 목록에서 미지원 컨트롤을 숨길지 비활성 안내할지는 공용 UI의 지원 기능 계약으로 솔피와 조율할 제안이다. |
| 기간 | 공용 period는 현재 `Incident.occurredAt` 기준 7/30/90일 계약인데 실제 API는 `pubDate`만 있다. 이를 말없이 기사 발행 기간으로 치환하지 않는다. 발행 기간 검색을 원하면 의미·서버 조회 방식부터 별도 결정해야 한다. [기간 변환](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/ui-contract.md:29), [현재 순수 필터](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/src/features/incidents/filter-incidents.ts:14) |
| 페이지 상태/URL | 최소 더 보기는 누적 카드와 raw offset을 목록의 메모리 상태로 두는 안을 권장한다. 새 `offset` URL 계약을 임의로 만들지 않는다. q 변경·페이지 재진입은 초기화한다. 기존 공유 계획의 일반 URL 쓰기는 page/view 등 나머지 키 보존, 화면 어댑터가 page 초기화, 지도↔목록은 화면 전용 page 미전달이다. 추후 URL 페이지 상태를 택하면 이 계약을 먼저 조율한다. [초기화/이동](/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api/docs/shared-foundation-acceptance.md:19) |
| 스타일/레이아웃 | 공용 header/nav를 목록에 다시 추가하지 않는다. 필터 인수 과정의 전역 폰트·공용 배지 변경은 솔피 범위다. 현재 기사 카드에서 없는 배지를 추가하지 않는다. |

추천 분할: (A) 기존 무검색 목록 더 보기부터 독립 후속 명세·테스트 준비 → (B) 솔피 공용 계약 인수와 지원 가능한 q 연결을 별도 승인 증분으로 준비. 이렇게 하면 더 보기를 위해 미제공 공용 파일을 대신 구현할 필요가 없다.

## 5. 승인 전에 남은 선택 — 제안값과 대안

| 결정점 | 추천 제안값 | 다른 요구일 때 필요한 범위 |
|---|---|---|
| 탐색 UI/중복뿐 응답 | 버튼 1회당 raw 20행 한 요청, 중복뿐이어도 진행 안내 후 다음 클릭 | 매번 고유 20개 채우기는 다중 요청 상한·지연·부분 실패 규칙 필요. 무한 스크롤은 별도 UI/접근성 범위. |
| 목록 유지/URL | 같은 목록에 머무는 동안만 누적, 재진입·새로고침 시 첫 페이지 | 뒤로가기 복원·공유 URL까지 누적 깊이 보존은 URL/히스토리와 공용 어댑터 계약 추가. |
| 실시간 일관성 | 현 offset API의 이동 경계 허용, 새로고침으로 최신 복귀 | 무누락 고정 탐색은 API cursor/snapshot 변경을 먼저 논의. |
| q 연결 시점 | 공용 어댑터 실제 인수 후 q→keyword 연결, 우선 더 보기와 분리 | 같은 기능에 검색을 넣으면 공용 제공 일정·검색 빈 결과 문구·조건 변경 레이스까지 함께 승인. |
| 미지원 공용 필터 | 기사 목록에서는 category/status/period 컨트롤을 숨기는 방향을 솔피에게 제안 | 비활성 안내를 선호하면 공용 props/시안 합의. 실제 동작시키려면 데이터·서버 계약부터 새로 필요. |

위 항목은 초안 작성 시 채택할 권장값이며, 현재 사용자 승인을 받았다고 기록하지 않는다. 확정된 기사 표시 정책은 재질문하지 않는다. 제보·상세·지도·이미지 404 보완·공용 폰트/배지 수정은 이 준비 문서의 구현 범위로 추가하지 않는다.

## 6. 이후 검토할 행동 사례 — 테스트 코드는 아직 없음

정상 2배치 추가와 순서, 첫/다음 배치 내부 및 페이지 간 중복, 다른 ID의 같은 제목, raw offset 대 고유 카드 수, 마지막 20행/짧은 마지막/빈 응답, 중복뿐 중간·마지막 배치, 최초 빈 목록, 연속 클릭의 단일 반영, 추가 실패 후 기존 카드 보존·같은 offset 재시도, 5초 제한, q 변경 시 offset/seen 초기화와 오래된 응답 무시, HTML 안전 렌더·원문 정책 유지, 실제 키보드 버튼/포커스/status 확인이 후보 검토 대상이다. 기존 21개 테스트를 그대로 두고 실제 준비 시 의미 있는 증분으로 묶을 수 있다. **이번 조사에서는 새 테스트·fixture·probe·구현을 만들거나 실행하지 않았다.**
