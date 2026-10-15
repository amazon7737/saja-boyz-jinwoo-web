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
- `src/features/article-list/ui/<컴포넌트>/`: 목록, 카드, 이미지. 이미지의 실패 상태만 클라이언트 컴포넌트가 소유한다.
- `src/features/incident-list/ui/incident-list/`: 기존 사건 목록과 테스트. 현재 라우트의 로딩 표시에 사용하며 ready 화면은 기사 API와 통합하지 않았다.
- `src/features/map/model/`: 지도 기사 타입, 고정 대표점별 집계, 발행일 기간·카드 정렬, 뷰포트 보존.
- `src/features/map/ui/<컴포넌트>/`: 지도 홈, 숫자 원 선택 시트, carousel·카드·이미지, 기간·미제공·전체 필터. SDK 수명주기는 MapHome이 소유하고 필터는 마커 데이터만 갱신한다.
- `src/features/incidents/model/`: 사건 모델, 라벨, 순수 필터 함수와 기존 단위 테스트.

의존성은 페이지 → 기능의 api/ui, api/ui → model 방향으로 둔다. API 타입을 UI 파일에서 가져오지 않는다. 재사용 근거가 없는 공통 API 클라이언트·저장소 계층·상태관리·일괄 barrel 파일은 만들지 않는다.

컴포넌트의 테스트는 해당 컴포넌트 폴더에 함께 두며, 모든 컴포넌트에 테스트 파일을 의무적으로 만들지 않는다. 화면 스타일은 아래 Tailwind 기준을 따르고 새 CSS Module은 만들지 않는다. 이미지 오류 테스트는 목록 유지·새 URL 복구까지 검증하므로 article-list 폴더에 둔다. API 테스트는 실제 라우트의 통합 테스트이므로 app/incidents에 유지한다. 테스트 확장자는 현재 수집 규칙에 맞춰 `.test.ts`를 유지한다.

기사의 pubDate는 발행 시각이며 사건의 occurredAt과 다르다. 기존 사건 모델의 분류·상태·위치를 기사 API 데이터로 추정하지 않는다. [뉴스 API 소비 계약과 규약 확인 요청](news-api-contract.md)에 현행 동작, 기존 협업 정보와 서버 명세 확인 항목을 구분해 기록한다.

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
