# 지도 기사 API 소비 계약

2026-10-14 · `GET /map/articles`를 기존 기사 상세와 연결한다. 지도 마커는 **기사 또는 같은 좌표의 기사 묶음**이며, 여러 언론사의 보도를 하나의 실제 사건으로 식별·병합한 결과는 아니다.

## 조회와 표시

- 기준 주소는 서버 환경변수 `NEWS_API_BASE_URL`. 브라우저는 이 서버 API를 직접 호출하거나 주소를 지오코딩하지 않는다.
- 홈의 서버 컴포넌트가 `/map/articles?offset=0&limit=100`부터 순차 조회한다. 첫 응답의 `total`까지 읽고 `article_id`로 중복을 제거한다. `total`은 좌표 없는 기사를 포함한다.
- 응답 전체 조회의 제한 시간은 15초이며 `cache: no-store`를 사용한다. HTTP 실패·계약 오류·조회 중 total 변경·진행되지 않는 페이지는 오류 상태로 표시하고 부분 결과를 전체 결과처럼 보여주지 않는다.
- 여러 offset 요청은 원자적 스냅샷이 아니다. 수집과 조회가 겹쳐 정렬이 바뀌면 중복 제거 후에도 새 기사가 다음 새로고침에 나타날 수 있다. 서버 bbox·시간·분류 필터와 커서 스냅샷은 아직 없다.
- `location_status: resolved`이며 검증된 위치 객체가 있는 기사만 마커에 포함한다. 그 외 기사는 기존 목록에 남기며 임의 좌표를 만들지 않는다.
- 동일한 위도·경도의 기사들은 숫자가 표시된 마커 하나로 묶는다. 클릭하면 해당 위치의 기사 카드를 모두 스크롤해서 볼 수 있고 `/incidents/{article_id}`로 이동한다. 줌 기반 클러스터나 실제 사건 병합은 아니다.
- 기본 서울 중심과 같은 탭의 뷰포트 복원은 유지한다. **기사 위치 보기**를 누르면 모든 확인된 좌표가 보이는 범위로 이동한다.
- 지도 API 오류나 좌표 없음은 별도 안내하고 기본 지도·내 위치 기능은 유지한다. 실패 시 기사 위치 다시 불러오기로 페이지를 새로 조회한다.

## 응답 필드

기존 기사 필드 `collection_id`, `article_id`, `article`, `image_status`, `image_url`에 다음 필드를 추가한 별도 응답이다. 기존 `/news` 및 상세의 필드 계약을 바꾸지 않는다.

| 필드                              | 의미                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `location_status`                 | `unprocessed`, `resolved`, `unresolved`, `failed`                                           |
| `location_reason`                 | 상태와 일치하는 이유 또는 null                                                              |
| `location.latitude` / `longitude` | 유한한 JSON number, WGS84 위도 -90~90 / 경도 -180~180                                       |
| `location.label`                  | 서버가 확인한 위치명, 빈 문자열 불가                                                        |
| `location.precision`              | `address`, `neighborhood`, `region`                                                         |
| `location.evidence`               | `field`는 title 또는 description, `text`는 해당 원문 필드에 실제 포함된 비어 있지 않은 구절 |

`region`은 2026-10-14 지역 대표 좌표 카탈로그 처리와 함께 추가하는 값이다. 이 프런트 브랜치는 기존 `address`·`neighborhood`와 새 `region`을 모두 수용하며, 운영 서버의 자동 처리 배포 여부는 서버 배포 기록에서 확인한다.

- `region` 카탈로그 좌표가 있으면 지도 기사 안내에 [지역 좌표: 기상청](https://www.data.go.kr/data/15084084/openapi.do) 출처를 표시한다. 구체적인 원본/라이선스/변환 기록은 서버 카탈로그 문서를 따른다.
- `region`: 행정구역 등의 **지역 대표 위치**. 실제 발생 지점과 다를 수 있음을 카드에 표시한다. 도시/구/동의 대표점을 정확한 현장 주소나 동네로 재분류하지 않는다.
- `neighborhood`: 마찬가지로 대략적 위치 안내를 표시한다.
- `address`: 기사에 언급된 주소 기준 위치라고 표시한다. 현장 GPS 실측값을 뜻하지 않는다.
- `unprocessed`: null 또는 stale_source. `unresolved`: not_incident / insufficient_evidence / multiple_locations / ambiguous_geocode. `failed`: invalid_metadata / provider_failed. 이들 상태의 location은 반드시 null이다.
- `resolved`의 reason은 null이다. 잘못된 좌표·상태·근거는 정상 마커로 숨겨 표시하지 않는다. HTML 강조 구절은 텍스트로 처리한다.

## 배포와 후속 범위

[운영 Swagger](https://poem-news.168.107.37.12.sslip.io/docs)와 [OpenAPI](https://poem-news.168.107.37.12.sslip.io/openapi.json)가 서버의 현재 배포 계약이다. 뉴스 수집·사건 여부/지역 근거 추출·카탈로그 좌표 저장·아침 수집 스케줄은 서버 작업이다. 공개 GET 요청은 수집이나 좌표 생성을 시작하지 않는다.

사용자의 2026-10-14 요청에 따라 amazon이 이번 API 소비·기사 마커·선택 카드 연결을 맡았다. 기존 easter721의 지도 SDK·내 위치·뷰포트 구현을 재사용한다. 분류·상태·실제 사건 식별·발생 시각·필터·줌 클러스터는 별도 후속 계약이 필요하며 현재 기사에서 추측하지 않는다.

SDK 근거: [Marker](https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Marker.html), [Map.fitBounds](https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html#fitBounds). 2026-10-14 확인.
