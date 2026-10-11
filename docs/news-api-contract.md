# 뉴스 API 연동 현황과 규약 확인 요청

이 문서는 프런트엔드가 dev의 PR #3~#5 코드에서 현재 소비하는 계약이다. 서버 명세를 확인해 확정한 문서가 아니다. 미확인 항목은 amazon의 확인과 서버 명세 링크가 필요하다. 사용자에게 API 규약이 별도로 공유되지 않아 연동 기준을 함께 관리하기 위해 작성했다.

## 현재 프런트엔드 요청

- 서버에서 환경변수 `NEWS_API_BASE_URL`을 읽는다. 인증정보 없는 HTTP/HTTPS URL만 허용한다.
- `GET /news?offset=0&limit=20`. 검색은 선택적 `keyword`를 trim해 URLSearchParams로 전달한다. 빈 keyword와 기본 목록 호출은 기존 요청을 유지한다. 기준 URL의 하위 경로는 `/news`로 교체한다.
- `cache: no-store`, 요청 제한 시간 5초. 인증 헤더·쿠키는 별도로 전달하지 않는다.
- 현재 페이지네이션 UI는 없으며 첫 20개 요청만 한다.

## 현재 프런트엔드가 허용하는 응답

```ts
type NewsResponse = {
  total: number; // 0 이상의 정수. amazon의 기존 저널에 따르면 중복 포함 수집 행 수.
  items: {
    article_id: string; // 소문자 16진수 64자리
    image_status: string;
    image_url: string | null;
    article: {
      title: string;
      description: string;
      pubDate: string;
      originallink: string;
      link: string;
    };
  }[];
};
```

필수 필드가 없거나 타입이 잘못된 항목이 하나라도 있으면 목록 전체를 실패로 처리한다. 추가 필드는 무시한다. 프런트에서 허용한다는 뜻이며 서버가 이 형태를 항상 보장한다는 뜻은 아니다.

## 현재 표시·실패 정책

- `article_id` 중복은 첫 항목을 남기고 표시 순서를 유지한다.
- 제목·설명의 HTML 태그를 제거하고 일부 HTML 엔티티를 텍스트로 해석한다.
- `pubDate`는 기사 발행 시각이다. 유효한 ISO/RFC 형식을 검사해 KST로 표시하며 잘못된 값은 ‘발행 시각 미확인’으로 표시한다. 사건 발생 시각과 동일시하지 않는다.
- 원문은 `originallink`를 우선하고 유효하지 않으면 `link`를 사용한다. 인증정보 없는 절대 HTTP/HTTPS URL만 허용한다.
- 이미지는 `image_status === "ready"`이고 `image_url === "/images/{article_id}.jpg"`일 때만 API와 같은 origin에서 표시한다. 이외에는 ‘이미지 없음’을 표시한다.
- 이미지 요청 실패 시 해당 이미지만 대체하고 다른 기사 내용은 유지한다. 성공 이미지에는 ‘AI 생성 이미지’를 표시한다.
- 설정 누락, HTTP 실패, 시간 초과, JSON/응답 검증 실패는 같은 목록 오류 화면과 `/incidents` 재진입 링크로 처리한다. 오류 경계로 throw하는 정책은 아니다.

## 검색 연결에서 확인한 명세

[서버 Swagger](https://poem-news.168.107.37.12.sslip.io/docs)와 [OpenAPI](https://poem-news.168.107.37.12.sslip.io/openapi.json)에서 `/news`의 선택적 keyword 검색 지원을 확인했다. `/search?q=...`는 배열의 첫 검색어를 trim해 이 keyword로 전달하며 검색어가 없으면 API를 호출하지 않는다. 제목·설명 키워드 검색 외 주소·좌표·사건 분류와 상세 API는 이번 화면 계약에 포함하지 않는다. offset/limit 경계·정렬·필수/nullable 필드·인증·오류 응답의 미확인 계약은 아래 항목대로 서버 담당자가 확정해야 한다.

## 기존에 공유된 정보

[amazon의 API 연결 완료 저널](../collab/journal/2026-10-04-amazon-article-list-api-2.md)에서는 total이 중복 포함 수집 행 수이며 발행 시각과 사건 발생 시각이 다름을 명시했다. 이 정보는 유지하며 정식 서버 명세와 예시로 연결해 달라고 요청한다.

## amazon에게 확인·문서화를 요청하는 항목

1. **정식 명세 위치와 소유자**: OpenAPI/Swagger 또는 저장소 문서 링크, 변경 시 공유 방식.
2. **요청과 페이지네이션**: offset/limit 기본값·최댓값, 정렬 기준·안정성, 마지막 페이지, total/offset의 수집 행 기준을 명세에 명시할 것.
3. **기사 식별·스키마**: article_id 생성과 안정성, 중복 수집 정책, 필수/nullable 필드, 문자열 인코딩과 HTML 포함 여부.
4. **시각**: pubDate 허용 형식·시간대·누락 정책. 사건 발생 시각을 제공할 계획과 별도 필드 여부.
5. **이미지**: image_status 전체 enum과 상태 전이, URL/확장자·외부 호스트 가능성, 재생성·캐시 정책, AI 생성 이미지 보장 여부.
6. **운영·오류**: 개발/운영 URL, 인증 필요 여부, 에러 코드·응답 스키마·재시도 가능 여부, 호출 제한, 이미지 공개 접근 방식.
7. **샘플**: 정상·빈 목록·중복·이미지 준비 중/실패·잘못된 요청 응답 예시. 비밀키·실제 자격 증명은 문서에 포함하지 않는다.

확인 전에는 현재 소비 계약을 유지한다. 서버 규약과 차이가 발견되면 별도 동작 변경으로 협의한다. 기사 데이터에 없는 사건 분류·상태·위치를 프런트에서 추정하지 않는다.

지도 후속에 필요한 사건 식별·WGS84 좌표·정확도/출처·누락 정책·분류/발생 시각 및 조회 계약은 [지도용 사건 API 확인 요청](map-api-contract.md)에 따로 정리했다. 현재 기사 API를 지도용 사건 API로 확정한 문서는 아니다.
