# 개발 기반

Node.js 24, pnpm 10.34.6, Next.js App Router, React, TypeScript strict 모드와 Tailwind CSS 4를 사용한다. Figma 예시를 그대로 복사하지 않고 기존 디자인 토큰과 컴포넌트 책임에 맞게 구현한다.

## 실행

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

환경변수 없이 개발 준비 화면을 실행할 수 있다. `.env.example`을 참고하며 비밀키는 커밋하지 않는다. `pnpm run build` 후 `pnpm start`로 프로덕션 서버를 실행한다.

코드의 import·공백·이름·JSX 구획 기준은 [코드 작성 컨벤션](code-conventions.md)을 따른다.

## 구조

- `src/app`: 라우트 조합, Next 오류·로딩 진입점, 메타데이터와 전역 디자인 토큰.
- `src/components/layout/<컴포넌트>/`: AppShell·FoundationPanel 등 화면 간 공유 레이아웃.
- `src/components/errors/model/`: 클라이언트 지시문에 묶이지 않는 FeatureError와 사용자 문구.
- `src/components/errors/feature-error-boundary/`: Suspensive 경계와 경계 통합 테스트. 기존 테스트 계약을 위해 FeatureError를 재수출한다. 새 호출부는 model에서 직접 가져온다.
- `src/features/article-list/api/`: 서버 페이지의 뉴스 조회와 응답 검증. 환경변수는 요청마다 읽으며 클라이언트에서 이 모듈을 가져오지 않는다.
- `src/features/article-list/model/`: 기사 응답 타입과 발행 시각·본문·원문 링크 표시 규칙.
- `src/features/article-list/ui/<컴포넌트>/`: 목록, 카드, 이미지. 이미지의 다운로드·실패 상태만 클라이언트 컴포넌트가 소유한다.
- `src/features/incident-list/ui/incident-list/`: 기존 사건 목록과 테스트. 현재 라우트의 로딩 표시에 사용하며 ready 화면은 기사 API와 통합하지 않았다.
- `src/features/map/model/`: 지도 기사 타입, 고정 대표점별 집계, 발행일 기간·카드 정렬, 뷰포트 보존.
- `src/features/map/ui/<컴포넌트>/`: 지도 홈, 숫자 원 선택 시트, carousel·카드·이미지, 기간·미제공·전체 필터. SDK 수명주기는 MapHome이 소유하고 필터는 마커 데이터만 갱신한다.
- `src/features/incidents/model/`: 사건 모델, 라벨, 순수 필터 함수와 기존 단위 테스트.

의존성은 페이지 → 기능의 api/ui, api/ui → model 방향으로 둔다. API 타입을 UI 파일에서 가져오지 않는다. 재사용 근거가 없는 공통 API 클라이언트·저장소 계층·상태관리·일괄 barrel 파일은 만들지 않는다.

컴포넌트의 테스트는 해당 컴포넌트 폴더에 함께 두며, 모든 컴포넌트에 테스트 파일을 의무적으로 만들지 않는다. 화면 스타일은 아래 Tailwind 기준을 따르고 새 CSS Module은 만들지 않는다. 이미지 오류 테스트는 목록 유지·새 URL 복구까지 검증하므로 article-list 폴더에 둔다. API 테스트는 실제 라우트의 통합 테스트이므로 app/incidents에 유지한다. 테스트 확장자는 현재 수집 규칙에 맞춰 `.test.ts`를 유지한다.

기사의 pubDate는 발행 시각이며 사건의 occurredAt과 다르다. 기존 사건 모델의 분류·상태·위치를 기사 API 데이터로 추정하지 않는다. [뉴스 API 소비 계약과 규약 확인 요청](news-api-contract.md)에 현행 동작, 기존 협업 정보와 서버 명세 확인 항목을 구분해 기록한다.

## 기사 상세 프레임과 URL

지도·목록·검색은 `app/(browse)/@background`에서 실제 화면을 렌더링한다. 같은 그룹의 일반 `children` 페이지는 메타데이터만 소유하고, `(.)incidents/[id]`가 기사 본문과 메타데이터로 교체된다. Next가 head를 찾을 때 children을 먼저 선택하므로 상세를 별도 이름의 슬롯에 두면 배경 검색의 noindex·canonical이 남을 수 있다. 배경 슬롯에는 metadata나 catch-all을 추가하지 않는다.

`ArticleRouteHost`는 배경 상태와 기사 링크 포커스를 보존한다. 목록(`/incidents`)에서 연 상세는 검색 헤더·하단 메뉴를 유지하고 main 본문에서 `DetailInline`으로 렌더링한다. 기존 목록은 숨긴 채 마운트를 유지하며 복귀할 때 추가 페이지·스크롤·포커스를 복원한다. 이 표시에는 dialog·body lock·focus trap·시트 핸들을 적용하지 않는다. 지도·검색·보관함은 기존 시트를 유지한다. 직접 공유 주소 `/incidents/{id}`도 기존 시트를 사용하며 JS 없이 제목·요약·발행일·출처를 읽을 수 있다. 조회·본문·메타데이터와 공유 주소는 동일하다.

Next16.3.8에는 page의 notFound 예외가 실제404를 반환하면서도 JS 없는 문서를 비워 두는 문제가 재현된다([공식 이슈](https://github.com/vercel/next.js/issues/62228)). `src/proxy.ts`는 직접 GET/HEAD에서만 기사 존재 여부를 확인하고, 잘못된 ID 또는 실제 upstream404를 미매칭 `/__missing-article`로 rewrite한다. 주소와 쿼리는 브라우저에 유지하고 정적 root404의 안내·지도/목록/검색 링크와 noindex를 서버 HTML로 제공한다. 공개된 200 오류 페이지나 추가 캐시 계층을 만들지 않는다.

이 우회는 정상 직접 접속에 API GET1회를 추가한다. 존재 확인과 원래 본문 조회는 각각5초 제한이라 장애 시 최대 약10초가 걸릴 수 있다. `next.config.ts`의 `skipProxyUrlNormalize: true`로 Next16.3.8이 Proxy 진입 전에 RSC 헤더를 지우지 않게 한다. 실제 NextLink 프로덕션 회귀가 단일 조회·5초 제한을 확인한다. RSC 내부 이동은 이 확인을 생략하고 공통 시트의 not-found/재시도를 사용한다. 네트워크·설정·503 오류를 없는 기사로 변환하지 않는다. Next 결함이 수정되면 JS 없는 실제404 회귀를 먼저 통과시킨 뒤 Proxy를 제거할 수 있다. root not-found에서 headers()를 읽는 방법은 다른 정적 화면까지 동적으로 바꿔 사용하지 않는다. 대신 RouteShell이 안정적인 _not-found 세그먼트를 기준으로 shell 경로를 고정해 rewrite의 서버/브라우저 pathname 차이로 생기는 hydration 오류를 막는다.

지도 위치는 검증된 주소/동네/지역 대표 좌표의 정확도를 구분한다. 같은 지역 보도는 해당 좌표 그룹의 실제 기사만 최대3개 연결하고, 상세 API에 위치가 없거나 지도 문맥이 없는 직접 유입에서는 이 영역을 만들지 않는다.

타입 검사에서 `collab/`은 불변 과거 제안·검증 산출물이므로 제외한다. 실제 제품과 모든 `src/**/*.test.ts`는 계속 타입 검사와 전체 테스트 대상이다.

## 지도 공급자 변경 준비

현재 실행 공급자는 네이버다. `naver-map-sdk.ts`가 실제 네이버 타입과 스크립트 주소를 소유하고, MapHome은 SDK 로드·인증 실패·재시도·수명주기를 연결한다. Google SDK나 미구현 공급자 선택지는 추가하지 않는다.

기사 위치 계약(`latitude`, `longitude`, `precision`)·지역 집계·기간 필터·카드·숫자 원 DOM은 공급자와 독립적이다. 화면의 원 겹침 계산은 `{x,y}` CSS 픽셀 투영 함수만 받는다. 공급자를 바꿀 때 이 데이터·상세/공유 경로를 바꾸지 않는다.

Google 키를 받은 뒤에는 지도 생성, HTML 마커 mount, 픽셀 투영, 이벤트 해제, 출처/컨트롤 여백을 실제 Maps JavaScript API로 연결한다. 네이버의 `destroy`, `setSize`, `fromCoordToOffset`이나 control DOM을 Google에 캐스팅하지 않는다. 뷰포트 저장 키도 공급자와 설정을 구분하고 서로 다른 줌을 무조건 이어 쓰지 않는다.

숫자 원은 Advanced Markers의 HTML/CSS로 재사용할 수 있다. 이 방식에는 Map ID가 필요하므로 브라우저 API 키와 JavaScript용 Map ID를 함께 확인한다([공식 Advanced Markers 안내](https://developers.google.com/maps/documentation/javascript/advanced-markers/overview), [Map ID 안내](https://developers.google.com/maps/documentation/javascript/map-ids/mapid-over)). 키 제한에는 로컬·배포 도메인을 포함하고 Maps JavaScript API 활성화를 확인한다. 실제 전환 전까지 Google 동작을 구현·검증했다고 표현하지 않는다.

전환 검증은 SDK 성공/오류/제한시간/재시도/StrictMode 정리, 초기 위치·권한 거부·늦게 도착한 위치, 지도 중심·줌 복귀, 겹친 원의 집계·분리, 단건·다건 상세와 키보드 복귀, 시트/캐러셀 아래 출처 표시를 포함한다.

## 스타일

Tailwind theme/utilities와 PostCSS 플러그인을 사용한다. 기존 화면의 브라우저 기본 여백·폰트 동작을 보존하기 위해 Preflight는 이번 전환에서 활성화하지 않는다. 새 UI는 필요한 여백·테두리·줄높이를 명시한다. Preflight를 켜는 변경은 전체 화면 비교가 필요한 별도 작업이다.

색상·반경·그림자 토큰은 globals.css의 `@theme static`에 유지한다. 전역 기본 스타일은 `@layer base`에 두어 컴포넌트 유틸리티를 덮어쓰지 않게 한다. 헤더·탐색·카드·제목·문단 스타일은 해당 컴포넌트가 소유하며 전역 h1/p 선택자에 의존하지 않는다.

새 화면과 기존 화면의 스타일 수정은 Tailwind 유틸리티를 사용한다. 사건 배지의 data 속성별 색상과 color-mix 규칙만 `src/features/incident-list/ui/incident-list/incident-list.module.css`에 남긴다. 이 파일 외 새 CSS Module은 추가하지 않는다. 클래스 문자열을 동적으로 조립하거나 모든 CSS를 없애기 위한 별도 추상화는 도입하지 않는다.

`sh scripts/check-styles.sh`는 전체 `src`에서 위 예외 외 `.module.css`·`.module.scss`·`.module.sass`·`.module.less` 파일이 있으면 실패한다. PR의 코드 컨벤션 CI도 같은 검사를 실행한다. 전역 토큰·기본 스타일을 제공하는 `globals.css`는 CSS Module이 아니며 그대로 유지한다.

## 검증

```sh
sh scripts/check-styles.sh
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run format:check
```

`pnpm test`는 사건 단위 테스트와 기존 협업 하네스 세 스위트를 모두 실행한다. `pnpm run check`는 lint, 타입, 전체 테스트, 빌드를 순서대로 실행한다. CI는 앱 검사와 기존 하네스 검사를 실행한다.

Figma 이미지와 SVG는 실제 화면 구현 시 해당 노드에서 받아 로컬 자산으로 보관한다. 참조 스크린샷을 화면 이미지로 사용하지 않는다. 현재 준비 화면은 디자인 완성본이 아니다.

## 환경 참고

패키지 매니저는 `package.json`의 `packageManager`로 pnpm 10.34.6에 고정한다. Corepack을 사용하는 환경에서는 `corepack enable` 후 실행한다. 이 Mac의 Corepack 0.33은 pnpm 12 실행 형식과 호환되지 않아 pnpm 10 계열을 사용한다.

`pnpm-lock.yaml`을 유일한 잠금 파일로 유지하고 CI에서는 `pnpm install --frozen-lockfile`로 재현성을 검사한다. 다른 패키지 매니저의 잠금 파일을 추가하지 않는다.

Next.js의 React lint 플러그인이 ESLint 10에서 실패하므로 현재 호환되는 ESLint 9.39.5를 사용한다. 플러그인 호환성이 확보되면 함께 갱신한다.

검색 결과는features/search/ui/search-result-card의텍스트카드가소유하며, 목록의ArticleCard와표시구성을분리한다. 공통CSS의ui-모션클래스는요청된컨트롤/드롭다운/시트/검색결과에서만명시적으로사용하고,SDK/데이터수명주기와분리한다.

## 요청 대기와 서버 본문

홈의 서버 기사 조회는 `app/(browse)/@background/(map)/loading.tsx`에서 `MapHomeLoading`을 렌더링한다. 데이터가 준비되기 전 MapHome을 미리 마운트하지 않으며 실제 SDK와 위치 요청은 MapHome이 한 번 소유한다. 홈 전용 route group은 URL을 바꾸지 않고 검색의 상위 loading 경계가 되는 것을 막는다.

수동 검색은 서버 GET form을 유지한 `SearchForm`이 transition·중복 제출 방지·SearchLoading을 소유한다. 결과를 기다리는 동안 기존 내용은 hidden/inert로 유지한다. 명시적 제출 때만 revision key를 바꾸어 같은 검색어도 카드·offset·hasMore를 새로 시작한다. 상세 열기/닫기나 일반 refresh는 revision을 바꾸지 않는다. 검색 route의 자동 loading 경계를 두지 않아 JS 없는 GET 결과가 숨겨진 Suspense 세그먼트에만 남지 않게 한다.

`components/feedback/image-loading.tsx`는 URL별 이미지 다운로드 상태와 캐시 완료를 처리한다. 예약한 영역의 장식 스켈레톤을 이미지 뒤에 두어 JS 없는 이미지와 기존 AI 캡션도 보이게 한다. 목록80px·지도 카드80px·상세140px 치수는 유지한다.

상세 재시도는 기존 링크 주소·오류 안내를 유지하고 transition 동안 스피너·busy·중복 방지를 제공한다. 직접 공유 주소에는 loading 파일이나 전역 metadata 대기 정책을 추가하지 않는다. Proxy의 존재 확인과 metadata는 첫 HTML 이전에 대기할 수 있으므로 앱 로더로 이 구간을 가릴 수 없다. 느린 응답의 실제 서버 본문·NoJS·canonical/OG/JSON-LD·GET/HEAD404를 함께 검증한다.
