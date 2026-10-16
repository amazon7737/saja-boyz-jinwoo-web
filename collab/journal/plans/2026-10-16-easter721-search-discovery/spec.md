# 검색·공유·AI 검색 기반 최적화 — 승인 요청 명세

## 목적과 기준
- 흉흉 브랜드를 유지한다. 사이트 기본 제목은 **흉흉 · 내 주변의 사건 사고**, 개별 페이지 제목 틀은 **%s · 흉흉 · 내 주변의 사건 사고**.
- 운영 origin은 **https://hyunghyung.vercel.app** 한 곳. 클라이언트 입력/Host/프리뷰 도메인으로 대표 URL을 만들지 않는다.
- 최신 origin/dev 24c0662(PR33 포함) 기반 codex/search-discovery. 열린 PR34는 별도 dev→main 릴리스이므로 수정하지 않는다.
- SEO는 검색 수집/표현, AEO·GEO는 사람이 확인할 수 있는 명료한 설명·출처와 AI 검색의 수집 기반에 집중한다. 순위·답변 인용을 보장하지 않는다.

## 현재 운영 확인
2026-10-16 KST 읽기 전용 GET 확인.
- /, /incidents, /search, /report, 실제 기사 상세: HTTP200이나 공통 title·description만 있음.
- /robots.txt, /sitemap.xml: HTTP404.
- 기사별 generateMetadata·canonical·Open Graph·Twitter·JSON-LD 없음.
- 목록 초기 기사의 상세 링크는 서버 HTML에 존재. 이후 기사는 무한 스크롤 서버 액션에만 의존한다.
- description의 진행 상황 확인은 실제 기사 API에서 제공하지 않는 정보이므로 제거한다.

## 제목·공유 정보
- 작은 공통 SEO 모듈에서 브랜드/설명/origin/공유 이미지 경로를 관리한다. 새 의존성이나 범용 SEO 프레임워크를 추가하지 않는다.
- root metadataBase, 한국어 설명, ko_KR/siteName, Open Graph website, Twitter summary_large_image를 설정한다. root에 canonical /를 일괄 상속시켜 상세를 홈으로 가리키게 하지 않는다.
- 홈 canonical /, 목록 /incidents, 소개 /about, 아카이브 /archive. 추적 파라미터·해시는 대표 URL에서 제거.
- 검색과 제보는 각각 적절한 제목/설명을 제공하되 noindex,follow. 제보는 client page를 유지하고 server layout에서 metadata만 정의한다. robots.txt에서 이 화면을 막아 noindex 수집을 방해하지 않는다.
- 상세는 서버가 검증한 동일 기사 결과로 제목·요약·canonical·OG/Twitter를 구성한다. 제목은 articleText와 공백 정리, 설명은 실제 요약에서 약160자 이내 자연스럽게 자른다. HTML 속성/JSON-LD에 비밀·raw API 오류를 노출하지 않는다.
- 메타데이터와 본문의 상세 조회는 request-scoped로 공유한다. 5초 timeout/no-store/ID·응답 검증 유지. 정상 직접 진입 한 번에 API /news/:id 1회, 요청 간 stale 결과나 타 기사/오류 캐시 재사용 금지.
- 잘못된 ID와 실제404는 기존 notFound 유지. 일시 실패·계약 오류는 noindex와 복구 안내, 가짜 기사 메타데이터/구조화 정보 없음. 기존 복귀·재시도·로딩 유지.
- 공유 기능의 취소·복사·수동 복사와 현재 origin 기반 링크 동작은 유지. 운영에서는 위 production canonical과 같은 깨끗한 상세 URL로 공유된다.
- OG 이미지는 실제 사진으로 오해할 수 없는 **공통 브랜드 카드 PNG 1200×630**. 기존 로고·로컬 폰트로 렌더한 proposed-assets/share-card.png를 public/og/site.png로 사용. 생성 HTML도 근거로 보관한다. 기사 AI 생성 이미지를 실제 현장 사진처럼 OG/구조화 데이터에 넣지 않는다.
- favicon 등 브라우저 브랜드 표식은 기존 SVG를 재사용할 수 있다. 사용자 지정 검색콘솔 인증코드나 확인되지 않은 SNS 계정은 만들지 않는다.

## 기사 구조와 출처
- 상세의 실제 h1·요약·발행 time·원문 링크를 유지한다. 필요 시 원문 호스트를 사람이 읽는 출처 표기로 함께 표시한다.
- JSON-LD의 기본 단위는 **WebPage**: 실제 상세 URL, 제목, 요약, 한국어. citation CreativeWork는 안전한 실제 원문 URL·제목, 유효한 경우 원문 기사 datePublished. 원문이 없으면 citation 생략, 발행일이 잘못됐으면 datePublished 생략.
- 흉흉을 원문 기사의 기자/언론사로 주장하지 않는다. 임의 author/publisher, NewsArticle 자체 발행자, Event/LocalBusiness/정확 geo/발생일/수정일·인기·사건수 조작 금지.
- JSON-LD 직렬화에서 <를 유니코드 이스케이프해 </script> 탈출을 차단한다. 실제 정보에 대한 선택적 필드 생략은 허용한다.
- 홈 WebSite 식별자는 정확한 사이트명·URL만. 소개의 문답은 실제 visible HTML로 제공하며 FAQ 리치 결과나 특수 AI 스키마를 약속하지 않는다.

## 검색 발견 경로
- robots.ts로 공용 페이지·정적 자원을 수집 허용, sitemap 절대 URL 제공. 검색용 크롤러는 허용하되 훈련 봇 정책을 이번 요청에서 새로 제한하거나 확장하지 않는다. 모든 페이지를 명시 allow한 보편 규칙이면 별도 AI 봇 그룹 불필요.
- sitemap.ts는 /, /incidents, /about, /archive + 기존 검증된 /news 첫20개에서 중복 ID를 제거한 최근 상세 URL만 제공한다.
- sitemap 요청 한 번에 API GET 최대1회/5초. total이 커도 전수 순회하지 않는다. 장애 시 정적 경로만 제공하고 가짜 상세 경로를 만들지 않는다.
- 수정 시각 근거가 없으므로 lastModified에 생성 시각이나 기사 발행일을 넣지 않는다. sitemap이 모든 과거 기사의 전수 목록이라고 설명하지 않는다.
- 과거 기사는 **/archive?page=N** 서버 HTML 페이지 목록으로 발견 가능하게 한다. 각20개, raw offset=(page-1)*20, 기존 ArticleList 카드/안전한 링크/ID 중복 제거 재사용. 응답 total은 이동 종료 판단에만 쓰고 고유 사건 총수로 표시하지 않는다.
- 첫 페이지는 /archive canonical, 이후 /archive?page=N self-canonical. 첫페이지로의 링크는 /archive. 이전/다음은 실제 a href, 빈 페이지·마지막 페이지에서 다음 링크 없음.
- page는 첫 배열값 기준 양의 정수만, safe integer offset까지 검증. invalid는 notFound/API 호출0. API 장애는 오류·현재 페이지 다시 시도, noindex. 빈 먼 페이지는 noindex이며 다음 이동을 만들지 않는다.
- /incidents에는 작은 아카이브·서비스 안내 링크를 추가하되 기존 무한 스크롤/추가 skeleton/중복·오류 재시도 기준 유지. 더 보기 버튼을 되살리지 않는다.
- offset 기반 수집은 원자 스냅샷이 아니므로 새 수집 중 페이지가 이동할 수 있다. 안정 커서/지역·분류 landing page·전체 sitemap API는 서버 후속으로 기록하며 임의 API를 추가하지 않는다.

## 사람이 읽는 서비스 설명
- /about에 흉흉 · 내 주변의 사건 사고 소개와 짧은 문답을 서버 렌더한다. 무엇을 검색하는가, 숫자 원이 뜻하는 기사 묶음, 지역 대표 좌표와 정확한 현장 위치의 차이, 기사 발행일과 발생 시각 차이, 원문 확인, AI 생성 이미지 표기와 미제공 분류/상태 범위를 정확하게 설명한다.
- 홈 지도 높이/헤더·필터·카드·하단 메뉴를 유지한다. 지도 아래의 작은 실제 읽을 수 있는 서비스 안내와 목록/소개 링크로 텍스트 진입로를 둔다. SDK 미설정에서도 안내/목록 링크 접근 가능. 키워드만 숨긴 SEO 텍스트 금지.
- 지도 canvas나 지역 숫자 원·기간 필터·무한 스크롤·서스펜시브 경계·제보 동작은 바꾸지 않는다. 기존 모바일 간격/안전영역/줄바꿈 유지.

## 테스트 승인 대상
- 신규6개: 공통/라우트 metadata+PNG, 상세 내용/JSON-LD/주입 방지, 상세 오류 metadata, robots/sitemap 상한·fallback, 서버 아카이브 이동·검증, 서비스 문답·서버 링크.
- 기존 articleDetailSafePresentation 1개: 실행 스크립트 금지 검사를 유지하면서 application/ld+json만 허용하도록 selector 한 곳 수정. 다른 검증은 그대로. 기존 테스트의 전체 정확 변경안은 existing-test-changes-proposal.md와 proposed-tests/article-detail.test.ts.txt.
- 등록 시 해당 기존1개만 승인 baseline에서 분리하고 runner가 정확 새 본문으로 복원한다. 빈 테스트/가짜 통과/skip 없음. 최종 **121개 = 기존115개 + 신규6개**. 전체 명령은 AGENTS.md 그대로.
- proposed-tests는 승인 전 실행 가능한 전체 초안. RED probe로 문법/타입/인프라 문제를 미리 점검한다.

## 완료 기준
소바야 exact approval → RED/구현/full-suite checkpoint → gate → 별도 신선한 read-only review. format/lint/typecheck/default Next build 통과.
실제 로컬 production Next 서버에서 일반브라우저·Googlebot·facebookexternalhit·Twitterbot·카카오 공유 UA의 raw HTML과 head title/canonical/OG/Twitter/robots를 확인하고 기사 요청1회·404·장애·타 기사 격리를 검증한다. 개발서버 결과만으로 SSR preview 완료라고 하지 않는다.
robots/sitemap/content type·절대URL·archive2·추적값 제거·JSON-LD JSON parse·주입방지·공유 취소/복사 회귀·모바일320/393px 소개/아카이브와 기존 홈 공간/오버플로를 확인한다.
운영 도메인은 읽기 전용 감사만, 실제 반영은 dev→main 배포 후 재확인이 필요하다. Google Search Console 등록은 사용자가 담당하며 docs/search-discovery.md에 URL-prefix 속성, sitemap.xml 제출, 대표URL 검사, 기사 샘플 검사, 데이터 확인 순서를 정리한다. 인증코드·Analytics·외부 POST 추가 없음.
검증·저널·push·dev 대상 PR까지. GitHub 코멘트/멘션/승인/머지는 별도 사용자 지시 없이 하지 않는다.

## 공식 근거
- https://developers.google.com/search/docs/appearance/ai-features — AI 검색도 기존 SEO 기반, 특수 AI 파일/스키마 필수 아님
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies — 보이는 실제 정보와 구조화 데이터 일치
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap — 정규 절대 URL, 실제 수정일만
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading — 무한 스크롤 외 실제 링크로 페이지 발견
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata — 서버 metadata/request memoization, HTML 제한 봇 head 전달
- https://developers.openai.com/api/docs/bots — OAI-SearchBot은 검색, 훈련 봇과 별개
