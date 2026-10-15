# 검토용 — 설명 주석은 실행 코드에 포함되지 않음

[명세 제안](spec.proposal.md)의 기사 1개 = 사건 1개 및 기존 기사 API 목록 연결을 검토합니다. 아래는 공통 헤더 1개, 테스트 본문 8개, 전체 지원 설정 1개를 생략 없이 실은 전체 검토본입니다. 각 테스트는 공통 헤더를 공유합니다. `// 검토:` 줄만 추가했으며 실행 코드·기존 주석·공백·순서를 그대로 보존했습니다.

승인 대상은 명세 제안을 반영할 `spec.md`, 아래 공통 헤더와 8개 본문을 담을 새 `failed-test.md`, `vitest.config.ts`의 `@` 별칭 지원 설정, 이 정확한 입력을 기록할 새 harness 승인 기준선입니다. 설명 주석을 넣은 이 문서 자체는 실행하지 않습니다. 기존 13개 테스트 본문·지원 코드는 보존하며 전체 실행 대상에 포함합니다. 이 검토본 작성은 명세·실행 소스·현재 기준선을 변경하지 않습니다. 선택적으로 [디자인 점검](design-check.md)을 함께 참고할 수 있습니다.

첫 조회는 원본 20행 한 번입니다. 중복 제거 후 카드 20개를 채우는 추가 조회, 페이지네이션, 전체 사건 수 표시, 검색·필터, 내부 상세 연결은 이 검토 범위에 없습니다. API에 없는 분류·진행상태·위치·발생 시각을 만들지 않고 기사 발행 시각을 별도 표시합니다. 잘못된 숫자 entity는 원래 문자열로 보존하는 기대입니다.

fixture는 합성 데이터이고 fetch·서버 환경변수는 mock입니다. 정적 HTML 검사이므로 실제 API·운영 환경·브라우저 상호작용·Next 스트리밍·CSS·393px 화면의 완성도를 증명하지 않습니다. 이미지 80×80도 HTML 속성만 검사합니다. 로딩 파일은 glob 탐색 후 존재를 먼저 단언하고 import하며, 가짜 제품용 stub을 추가하지 않습니다. beforeEach는 환경·전역 fetch를 설정하고 renderPage는 시나리오마다 모듈을 다시 읽어 설정 변경을 반영합니다.

검증 기록: 작업 담당 에이전트가 최종 후보 8개를 기존 placeholder에 probe하여 모두 행동 단언 RED임을 확인했습니다. 카드 부재는 singleCard의 개수 단언으로 드러납니다. pinned plan parser의 8개 entry·대상·헤더·본문 일치, 합친 테스트의 타입 검사·포맷·lint 통과, 별칭 적용 후 기존 13개 테스트 통과도 보고했습니다. 이는 테스트 실행 가능성과 현재 기대 행동의 부재에 관한 근거이며 신규 구현 완료를 의미하지 않습니다. 이 검토본 작성 중 테스트·probe는 재실행하지 않았습니다.

## 공통 헤더

대상: `src/app/incidents/article-list-api.test.ts`. 아래 8개 entry가 그대로 공유합니다.

```ts
// 검토: 공통 헤더와 아래 8개 본문을 넣을 승인 대상 실행 테스트 파일입니다.
// file: src/app/incidents/article-list-api.test.ts
// 검토: 테스트 수명주기·행동 단언·mock을 사용하며 실제 API 요청을 하지 않습니다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 로딩 컴포넌트 자체를 생성합니다. 실제 Next 라우팅이나 브라우저 전환을 실행하지 않습니다.
import { createElement, type ComponentType } from 'react';
// 검토: 정적 HTML을 검사합니다. CSS·hydration·클릭 동작은 이 검사로 증명하지 않습니다.
import { renderToStaticMarkup } from 'react-dom/server';

// 검토: loading.tsx가 없어도 glob 탐색 자체는 성공합니다. 로딩 테스트는 로더 존재를 먼저 단언한 뒤 import하며 가짜 제품용 stub을 추가하지 않습니다.
const loadingRoutes = import.meta.glob('./loading.tsx');
// 검토: 운영 주소가 아닌 합성 API origin으로 요청과 상대 이미지 경로를 검증합니다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 합성 URL https://example.invalid/news/a의 SHA256이며 기사 A의 안정적인 식별자입니다.
const idA = 'e77553113fe8862b91aec1fd09a25af83e256ac12cb4a8ff7d8d78ea3050c909';
// 검토: 합성 URL https://example.invalid/news/b의 SHA256이며 같은 제목의 별도 기사 B를 구별합니다.
const idB = '6dd70b87676f579839c940ae6048bc6bf65d2005e1552c515b9a0151500b621a';
// 검토: API 형식을 본뜬 합성 fixture입니다. 실제 수집 기사나 운영 데이터 표본이 아닙니다.
const item = {
  // 검토: 수집 이력 ID와 기사 ID는 별개입니다. 서버 ID 생성 동작은 검증하지 않습니다.
  collection_id: '20261004T030000000000Z_00000000000000000000000000000000',
  // 검토: 중복은 이 기사 ID로 판단해야 하며 제목·수집 이력 ID로 대신하지 않습니다.
  article_id: idA,
  // 검토: 원문 메타데이터만 입력하고 사건 분류·좌표·상태는 만들지 않습니다.
  article: {
    // 검토: 실제 태그와 entity를 함께 넣어 일반 텍스트 복원을 확인합니다.
    title: '샘플: <b>교통</b> 안내 &amp; 점검',
    // 검토: 안전한 원문 URL이 있으면 포털 주소보다 우선해야 합니다.
    originallink: 'https://example.invalid/news/a',
    // 검토: 원문 주소가 불가할 때 대체 가능한 별도 포털 URL입니다.
    link: 'https://portal.example.invalid/news/a',
    // 검토: 이름·10진수·16진수 entity를 복원할 합성 요약입니다.
    description: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;',
    // 검토: 시간대가 있는 기사 발행 시각이며 사건 발생 시각이 아닙니다.
    pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900',
  },
  // 검토: 기본 기사는 이미지 생성 비활성화 상태입니다.
  image_status: 'disabled',
  // 검토: 이미지 없음의 API null 값을 사용합니다.
  image_url: null,
};
// 검토: 페이지 fetch를 가로챕니다. 실제 연결·인증·운영 응답을 검증하지 않습니다.
const fetchMock = vi.fn<typeof fetch>();

// 검토: 각 테스트 전에 환경과 전역 fetch를 다시 지정합니다.
beforeEach(() => {
  // 검토: 서버 전용 API 주소를 합성 값으로 설정합니다. 실제 .env·비밀값을 읽지 않습니다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 전역 fetch를 mock으로 교체해 네트워크 접근을 우회합니다.
  vi.stubGlobal('fetch', fetchMock);
});

// 검토: 테스트 후 요청 기록과 전역·환경변수 변경을 복구합니다.
afterEach(() => {
  // 검토: 요청 기록과 대기 응답을 지워 다음 테스트와 격리합니다.
  fetchMock.mockReset();
  // 검토: 전역 fetch 등 stub을 원상복구합니다.
  vi.unstubAllGlobals();
  // 검토: 변경한 환경변수를 복구합니다.
  vi.unstubAllEnvs();
});

// 검토: 다음 응답의 기사 배열과 원본 행 수 total을 만듭니다. 생략한 total은 입력 행 수이며 고유 사건 수 계산이 아닙니다.
function respond(items: unknown[], total = items.length) {
  // 검토: 다음 한 번의 fetch에 JSON을 공급합니다. 실제 서버 검증·지연을 재현하지 않습니다.
  fetchMock.mockResolvedValueOnce(Response.json({ total, items }));
}

// 검토: 현재 환경으로 실제 페이지를 새로 가져와 정적 HTML을 얻습니다.
async function renderPage() {
  // 검토: 시나리오마다 바뀐 API 설정을 읽도록 모듈 캐시를 비웁니다.
  vi.resetModules();
  // 검토: 실제 page를 가져오며 테스트용 대체 페이지를 만들지 않습니다.
  const { default: IncidentsPage } = await import('./page');
  // 검토: 비동기 페이지를 기다려 HTML로 직렬화합니다. layout·브라우저는 포함하지 않습니다.
  return renderToStaticMarkup(await IncidentsPage());
}

// 검토: 카드 단위인 article 요소를 추출합니다.
function cards(html: string): string[] {
  // 검토: 카드가 없으면 빈 배열입니다. 단순 HTML 패턴이며 전체 DOM·접근성 트리 검사는 아닙니다.
  return html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
}

// 검토: 한 카드 시나리오는 내용보다 카드 존재를 먼저 확인합니다.
function singleCard(html: string) {
  // 검토: 실제 HTML에서 카드 요소를 추출하며 제품 stub을 만들지 않습니다.
  const rows = cards(html);
  // 검토: 정확히 한 카드여야 합니다. 기존 placeholder의 카드 부재는 이 행동 단언에서 실패합니다.
  expect(rows).toHaveLength(1);
  // 검토: 존재를 단언한 첫 카드 내용을 후속 검사에 제공합니다.
  return rows[0];
}

// 검토: status·alert 요소의 속성과 내용을 추출하는 helper입니다.
function readRole(html: string, role: 'status' | 'alert') {
  // 검토: 역할 요소가 없으면 null이므로 존재 여부를 별도로 단언할 수 있습니다.
  return html.match(
    // 검토: 요청한 역할에 맞는 HTML 패턴을 만듭니다.
    new RegExp(
      // 검토: 첫 일치 요소의 태그명·속성·내용을 분리합니다. 복잡한 중첩 DOM이나 실제 스크린리더 발표는 검사하지 않습니다.
      `<([a-z][a-z0-9]*)\\b([^>]*\\brole="${role}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    ),
  );
}

// 검토: 가져온 로딩 모듈이 함수형 default 컴포넌트를 제공하는지 검사합니다.
function isLoadingModule(value: unknown): value is { default: ComponentType } {
  // 검토: 아래 조건을 모두 만족해야 로딩 컴포넌트로 렌더링합니다.
  return (
    // 검토: null은 유효한 로딩 모듈이 아닙니다.
    value !== null &&
    // 검토: 가져온 값은 모듈 객체여야 합니다.
    typeof value === 'object' &&
    // 검토: default export가 있어야 합니다.
    'default' in value &&
    // 검토: default가 함수형 컴포넌트여야 합니다.
    typeof value.default === 'function'
  );
}

// 검토: 오류 안내와 정상 빈 목록의 구별을 공통 검사합니다.
function expectError(html: string) {
  // 검토: 오류 안내를 alert 역할에서 찾습니다.
  const alert = readRole(html, 'alert');
  // 검토: alert 요소가 실제 HTML에 있어야 합니다.
  expect(alert).not.toBeNull();
  // 검토: alert 안에 사용자용 기사 조회 실패 안내가 있어야 합니다.
  expect(alert?.[3]).toContain('기사를 불러오지 못했어요');
  // 검토: 다시 시도 안내가 있어야 합니다. 클릭 성공을 검증하지 않습니다.
  expect(alert?.[3]).toContain('다시 시도');
  // 검토: 같은 목록으로 다시 접근할 href가 alert 안에 있어야 합니다. 실제 탐색은 하지 않습니다.
  expect(alert?.[3]).toContain('href="/incidents"');
  // 검토: 오류를 정상적인 기사 없음으로 표시하지 않아야 합니다.
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  // 검토: 오류 상태에 기사 카드가 없어야 합니다.
  expect(cards(html)).toHaveLength(0);
}
```

## 1. articleApiRequest

Entry: `articleApiRequest` — 첫 원본 20행의 GET·주소·캐시·취소 신호. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 첫 조회의 주소·메서드·범위·캐시·취소 신호를 검사합니다.
test('articleApiRequest', async () => {
  // 검토: 성공한 빈 응답으로 요청 구성만 확인합니다.
  respond([]);
  // 검토: 실제 페이지를 렌더링하여 서버 fetch를 유발합니다.
  await renderPage();
  // 검토: 첫 목록은 한 번만 요청하며 추가 페이지를 자동 수집하지 않습니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 첫 요청의 주소와 옵션을 관찰합니다.
  const [input, init] = fetchMock.mock.calls[0];
  // 검토: 문자열 또는 Request에서 실제 URL을 추출합니다.
  const url = new URL(input instanceof Request ? input.url : String(input));
  // 검토: 환경설정의 API origin을 사용해야 합니다.
  expect(url.origin).toBe(apiOrigin);
  // 검토: 기존 /news 조회 경로를 사용해야 합니다.
  expect(url.pathname).toBe('/news');
  // 검토: 쿼리 순서와 무관하게 아래 두 항목만 요청해야 합니다.
  expect([...url.searchParams.entries()].sort()).toEqual([
    // 검토: 첫 원본 20행입니다. 중복 제거 후 20개 보장·총 사건 수 계산은 요구하지 않습니다.
    ['limit', '20'],
    // 검토: 원본 offset 0에서 시작합니다. 다음 페이지는 이 검사 범위 밖입니다.
    ['offset', '0'],
  ]);
  // 검토: 읽기 전용 GET을 명시해야 합니다.
  expect(init?.method).toBe('GET');
  // 검토: 매번 최신 조회를 하도록 no-store를 명시해야 합니다.
  expect(init?.cache).toBe('no-store');
  // 검토: 조회 요청에 body를 붙이지 않아야 합니다.
  expect(init?.body).toBeUndefined();
  // 검토: AbortSignal을 연결해야 합니다. 실제 취소는 timeout 테스트가 검사합니다.
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});
```

## 2. articleCardsIdentityAndPublication

Entry: `articleCardsIdentityAndPublication` — 기사 ID 중복 제거·응답 순서·원문·발행 시각. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 동일 제목의 별도 기사와 같은 ID의 중복을 구분하고 발행 시각을 표시하는지 검사합니다.
test('articleCardsIdentityAndPublication', async () => {
  // 검토: A·B·오래된 A 이력을 한 응답으로 공급합니다.
  respond(
    // 검토: 응답 순서는 A 다음 B이며 발행일 재정렬을 기대하지 않습니다.
    [
      // 검토: 첫 A는 공통 fixture를 사용합니다.
      item,
      {
        // 검토: 명시한 차이 외에는 B도 공통 fixture를 사용합니다.
        ...item,
        // 검토: 제목이 같아도 ID가 달라 별도 카드로 남아야 합니다.
        article_id: idB,
        // 검토: B의 원문 주소와 발행일을 바꿉니다.
        article: {
          // 검토: B의 제목·요약 등은 A와 같습니다.
          ...item.article,
          // 검토: B에는 자신의 원문 링크가 있어야 합니다.
          originallink: 'https://example.invalid/news/b',
          // 검토: 미래 발행일도 숨기거나 현재 시각으로 바꾸지 않아야 합니다. 실제 미래 기사 존재를 주장하지 않습니다.
          pubDate: 'Fri, 18 Sep 2099 12:00:00 +0900',
        },
      },
      {
        // 검토: 기사 ID를 유지하여 앞의 A와 중복을 만듭니다.
        ...item,
        // 검토: 수집 이력 ID가 달라도 같은 기사를 중복 카드로 만들지 않습니다.
        collection_id: 'older-collection',
        // 검토: 뒤의 중복 제목으로 앞 기사를 덮어쓰지 않아야 합니다.
        article: { ...item.article, title: '오래된 중복 제목' },
      },
    ],
    // 검토: 큰 원본 행 수를 고유 사건 수처럼 출력하지 않는지 확인합니다.
    987654,
  );
  // 검토: 세 원본 행을 처리한 페이지 HTML을 얻습니다.
  const html = await renderPage();
  // 검토: 카드별 내용과 순서를 확인할 요소들을 추출합니다.
  const rows = cards(html);
  // 검토: 사건 목록 제목을 유지해야 합니다.
  expect(html).toContain('사건 목록');
  // 검토: A를 중복 제거해 A·B 두 카드가 남아야 합니다.
  expect(rows).toHaveLength(2);
  // 검토: 첫 A의 b 태그를 제거하고 ampersand를 안전하게 직렬화해야 합니다.
  expect(rows[0]).toContain('샘플: 교통 안내 &amp; 점검');
  // 검토: 같은 제목의 B도 별도 카드로 남아야 합니다.
  expect(rows[1]).toContain('샘플: 교통 안내 &amp; 점검');
  // 검토: entity를 문자로 복원한 뒤 React의 안전한 HTML 직렬화 결과를 기대합니다.
  expect(rows[0]).toContain('가상 &quot;안내&quot; &#x27;검증&#x27; 가');
  // 검토: 첫 카드에는 A의 원문 링크가 있어야 합니다.
  expect(rows[0]).toContain('href="https://example.invalid/news/a"');
  // 검토: 둘째 카드에는 B의 원문 링크가 있어야 합니다.
  expect(rows[1]).toContain('href="https://example.invalid/news/b"');
  // 검토: 기사 발행이라고 명시해 사건 발생 시각과 구별합니다.
  expect(rows[0]).toContain('기사 발행');
  // 검토: A 발행일을 UTC 표준 dateTime 속성으로 제공해야 합니다.
  expect(rows[0]).toContain('dateTime="2026-09-17T00:00:00.000Z"');
  // 검토: A 표시 시간은 KST 날짜·시간이어야 합니다.
  expect(rows[0]).toContain('2026-09-17 09:00 KST');
  // 검토: B의 미래 발행일도 KST로 표시해야 합니다.
  expect(rows[1]).toContain('2099-09-18 12:00 KST');
  // 검토: API total 원시 숫자를 사건 수처럼 출력하지 않아야 합니다.
  expect(html).not.toContain('987654');
  // 검토: 쉼표를 붙인 원본 행 수도 출력하지 않아야 합니다.
  expect(html).not.toContain('987,654');
  // 검토: 뒤의 중복 제목 대신 첫 이력 내용을 선택해야 합니다.
  expect(html).not.toContain('오래된 중복 제목');
  // 검토: API에 없는 사건 속성을 만들어 표시하지 않는지 검사합니다.
  expect(html).not.toMatch(
    // 검토: 분류·상태 속성, 위치, 진행 중, 발생 시각, 전체 사건이라는 특정 표시를 금지합니다. 모든 가공 정보의 부재를 증명하는 정규식은 아닙니다.
    /data-category|data-status|📍|진행 중|발생 시각|전체 사건/,
  );
  // 검토: 이번 범위에 없는 내부 사건 상세 링크를 만들지 않아야 합니다.
  expect(html).not.toContain('href="/incidents/');
  // 검토: page가 header·nav를 중복 출력하지 않아야 합니다. layout 전체 화면 검사는 아닙니다.
  expect(html).not.toMatch(/<header\b|<nav\b/);
});
```

## 3. articleTextAndSourceSafety

Entry: `articleTextAndSourceSafety` — 안전한 텍스트·대체 원문·잘못된 날짜와 숫자 entity. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 텍스트·링크·날짜의 안전 처리와 대체 원문 링크를 검사합니다.
test('articleTextAndSourceSafety', async () => {
  // 검토: 각 주소에 대해 대체 링크가 있는 경우와 두 링크 모두 불가인 경우를 반복합니다.
  for (const unsafe of [
    // 검토: JavaScript 실행 주소는 원문 링크로 인정하지 않습니다.
    'javascript:alert(1)',
    // 검토: HTML data URL은 원문 링크로 인정하지 않습니다.
    'data:text/html,test',
    // 검토: 상대 원문 경로를 앱 주소 기준 링크로 만들지 않습니다.
    '/relative',
    // 검토: 프로토콜 생략 주소를 절대 http(s) 원문 링크로 인정하지 않습니다.
    '//other.invalid/a',
    // 검토: 사용자명·비밀번호가 든 주소를 노출하지 않습니다.
    'https://user:password@example.invalid/a',
  ]) {
    // 검토: 문제 원문 주소와 안전한 포털 대체 링크를 공급합니다.
    respond([
      {
        // 검토: 나머지 기사 ID·이미지 없음 조건은 유지합니다.
        ...item,
        // 검토: 원문 텍스트·주소·날짜에 경계 입력을 넣습니다.
        article: {
          // 검토: 바꾸지 않은 필드는 공통 fixture와 같습니다.
          ...item.article,
          // 검토: 실제 b 태그는 제거하고 entity로 적힌 img 문장은 텍스트로 남겨야 합니다.
          title: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;',
          // 검토: 이름·숫자 entity와 범위 초과·서로게이트 입력입니다. 모든 공백 처리 방식을 단언하지는 않습니다.
          description: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;',
          // 검토: 이번 반복의 불가 URL을 원문 주소에 넣습니다.
          originallink: unsafe,
          // 검토: 원문이 불가하면 사용할 안전한 포털 절대 URL입니다.
          link: 'https://portal.example.invalid/fallback',
          // 검토: 해석 불가 날짜 문자열은 발행 시각 미확인으로 표시해야 합니다.
          pubDate: 'invalid-date',
        },
      },
    ]);
    // 검토: singleCard로 한 카드 존재를 먼저 단언합니다. 카드 부재를 undefined 내용 검사 오류로 숨기지 않습니다.
    const row = singleCard(await renderPage());
    // 검토: 실제 강조 태그는 제거하고 인코딩된 img 문장은 실행되지 않는 텍스트로 남겨야 합니다.
    expect(row).toContain('태그 강조 &lt;img src=x onerror=alert(1)&gt;');
    // 검토: apostrophe를 작은따옴표로 복원한 뒤 안전하게 직렬화해야 합니다.
    expect(row).toContain('&#x27;인용&#x27;');
    // 검토: 유효한 숫자 entity를 신문 문자로 복원해야 합니다.
    expect(row).toContain('📰');
    // 검토: Unicode 범위 초과 entity는 원래 문자열로 보존하고 ampersand를 안전하게 출력해야 합니다.
    expect(row).toContain('&amp;#x110000;');
    // 검토: 서로게이트 entity도 원래 문자열로 보존하고 잘못된 Unicode 문자를 만들지 않아야 합니다.
    expect(row).toContain('&amp;#xD800;');
    // 검토: 불가한 원문 대신 안전한 포털 링크를 써야 합니다.
    expect(row).toContain('href="https://portal.example.invalid/fallback"');
    // 검토: 언론사명을 만들지 않고 기사 원문으로 안내합니다.
    expect(row).toContain('기사 원문');
    // 검토: 해석 불가 날짜는 발행 시각 미확인으로 표시합니다.
    expect(row).toContain('발행 시각 미확인');
    // 검토: img·b·script HTML 태그나 잘못된 날짜의 time 요소가 없어야 합니다.
    expect(row).not.toMatch(/<img\b|<b\b|<script\b|<time\b/);
    // 검토: 원문·포털 모두 불가한 응답을 공급합니다.
    respond([
      {
        // 검토: 링크 이외 정상 기사 내용은 유지합니다.
        ...item,
        // 검토: 두 링크 모두 같은 불가 URL로 지정합니다.
        article: { ...item.article, originallink: unsafe, link: unsafe },
      },
    ]);
    // 검토: 링크가 없어도 카드 한 개 존재를 먼저 확인합니다.
    const unlinked = singleCard(await renderPage());
    // 검토: 링크가 없어도 정상 제목을 표시해야 합니다.
    expect(unlinked).toContain('샘플: 교통 안내');
    // 검토: 원문 링크 없음 안내가 있어야 합니다.
    expect(unlinked).toContain('원문 링크 없음');
    // 검토: 안전한 주소가 없으면 앵커 링크를 만들지 않습니다.
    expect(unlinked).not.toMatch(/<a\b/);
  }
});
```

## 4. articleImageStates

Entry: `articleImageStates` — AI 이미지 상태·API 상대 경로·이미지 없음. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 이미지 상태와 기사 ID에 맞는 경로를 함께 검사합니다.
test('articleImageStates', async () => {
  // 검토: A의 백엔드 JPEG 상대 경로를 만듭니다.
  const imagePath = `/images/${idA}.jpg`;
  // 검토: ready 상태와 기사 ID에 맞는 경로를 공급합니다.
  respond([{ ...item, image_status: 'ready', image_url: imagePath }]);
  // 검토: 준비된 이미지의 카드 한 개를 먼저 확인합니다.
  const ready = singleCard(await renderPage());
  // 검토: 이미지 경로는 앱이 아닌 API origin 기준이어야 합니다.
  expect(ready).toContain(`src="${apiOrigin}${imagePath}"`);
  // 검토: 보도 사진과 구별할 AI 생성 이미지 안내가 있어야 합니다.
  expect(ready).toContain('AI 생성 이미지');
  // 검토: HTML width는 80이어야 합니다. 실제 CSS 80px 배치를 검사하지 않습니다.
  expect(ready).toMatch(/width="80"/);
  // 검토: HTML height는 80이어야 합니다. 브라우저 크기 측정은 아닙니다.
  expect(ready).toMatch(/height="80"/);
  // 검토: ready가 아닌 네 상태는 URL이 있어도 표시하지 않습니다.
  for (const imageStatus of ['disabled', 'pending', 'generating', 'failed']) {
    // 검토: 미완료 상태에 경로가 함께 온 경우로 상태 우선 처리를 검사합니다.
    respond([{ ...item, image_status: imageStatus, image_url: imagePath }]);
    // 검토: 해당 상태에도 카드 한 개가 있어야 합니다.
    const row = singleCard(await renderPage());
    // 검토: 준비되지 않은 이미지는 이미지 없음으로 표시합니다.
    expect(row).toContain('이미지 없음');
    // 검토: 준비되지 않은 img를 만들지 않습니다.
    expect(row).not.toMatch(/<img\b/);
    // 검토: 없는 이미지를 AI 생성 이미지로 안내하지 않습니다.
    expect(row).not.toContain('AI 생성 이미지');
  }
  // 검토: ready여도 아래 없거나 불가한 URL이면 표시하지 않습니다.
  for (const imageUrl of [
    // 검토: ready지만 URL이 없는 경우입니다.
    null,
    // 검토: 이미지 JavaScript URL을 허용하지 않습니다.
    'javascript:alert(1)',
    // 검토: 외부 프로토콜 생략 이미지 주소를 허용하지 않습니다.
    '//other.invalid/image.jpg',
    // 검토: 임의 외부 HTTPS 이미지도 승인된 경로가 아닙니다.
    'https://other.invalid/image.jpg',
    // 검토: 형태가 맞아도 다른 기사 B 이미지를 A에 연결하지 않습니다.
    `/images/${idB}.jpg`,
  ]) {
    // 검토: ready 상태에 각 불가 URL을 조합합니다.
    respond([{ ...item, image_status: 'ready', image_url: imageUrl }]);
    // 검토: 잘못된 이미지 URL에도 카드 한 개는 유지되어야 합니다.
    const row = singleCard(await renderPage());
    // 검토: 불가한 이미지는 이미지 없음으로 대체합니다.
    expect(row).toContain('이미지 없음');
    // 검토: 잘못된 URL의 img를 만들지 않습니다.
    expect(row).not.toMatch(/<img\b/);
    // 검토: 불가한 이미지에 AI 생성 안내를 붙이지 않습니다.
    expect(row).not.toContain('AI 생성 이미지');
  }
});
```

## 5. articleEmpty

Entry: `articleEmpty` — 정상 빈 목록. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 정상 빈 목록을 오류·로딩·필터 결과와 구별합니다.
test('articleEmpty', async () => {
  // 검토: 빈 배열과 total 0인 성공 응답입니다.
  respond([]);
  // 검토: 정상 빈 응답의 페이지 HTML을 얻습니다.
  const html = await renderPage();
  // 검토: 빈 목록 안내를 status에서 찾습니다.
  const status = readRole(html, 'status');
  // 검토: 빈 목록의 status 요소가 있어야 합니다.
  expect(status).not.toBeNull();
  // 검토: 아직 수집된 기사가 없다는 안내가 status 안에 있어야 합니다.
  expect(status?.[3]).toContain('아직 수집된 기사가 없어요');
  // 검토: 정상 빈 응답을 alert 오류로 표시하지 않습니다.
  expect(html).not.toContain('role="alert"');
  // 검토: 정상 빈 응답에 실패 문구가 없어야 합니다.
  expect(html).not.toContain('기사를 불러오지 못했어요');
  // 검토: 완료된 빈 응답을 로딩 중으로 표시하지 않습니다.
  expect(html).not.toContain('사건을 불러오는 중');
  // 검토: 이번 범위 밖 검색·필터 변경을 안내하지 않습니다.
  expect(html).not.toContain('검색어나 필터를 바꿔보세요');
  // 검토: 빈 목록에는 카드가 없어야 합니다.
  expect(cards(html)).toHaveLength(0);
});
```

## 6. articleErrors

Entry: `articleErrors` — 설정·전송·JSON·구조 오류와 내부 내용 비노출. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 설정·전송·JSON·구조 오류의 공통 처리를 검사합니다.
test('articleErrors', async () => {
  // 검토: 아래 API 주소는 요청 전 설정 오류로 처리합니다.
  for (const baseUrl of [
    // 검토: 빈 주소를 임의 API 주소로 대체하지 않습니다.
    '',
    // 검토: URL이 아닌 문자열을 요청하지 않습니다.
    'not-a-url',
    // 검토: 파일 URL을 API로 사용하지 않습니다.
    'file:///tmp/news',
    // 검토: 자격증명 포함 API URL을 사용하거나 노출하지 않습니다.
    'https://user:password@news.example.invalid',
  ]) {
    // 검토: 이번 주소를 환경에 넣습니다. renderPage의 모듈 초기화로 설정을 다시 읽어야 합니다.
    vi.stubEnv('NEWS_API_BASE_URL', baseUrl);
    // 검토: 설정 오류마다 alert·재시도·카드 없음 계약을 적용합니다.
    expectError(await renderPage());
  }
  // 검토: 위 네 설정 오류는 fetch 자체를 시도하지 않습니다.
  expect(fetchMock).not.toHaveBeenCalled();
  // 검토: 이후 응답·전송 오류는 정상 API 주소 아래에서 검사합니다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 다음 요청에 HTTP 실패를 공급합니다.
  fetchMock.mockResolvedValueOnce(
    // 검토: 503 body에 내부 문자열을 넣어 유출을 확인합니다.
    new Response('upstream-secret', { status: 503 }),
  );
  // 검토: HTTP 오류를 처리한 HTML을 얻습니다.
  const unavailable = await renderPage();
  // 검토: 503은 정상 빈 목록 대신 공통 오류여야 합니다.
  expectError(unavailable);
  // 검토: 서버 오류 body 내부 문자열을 노출하지 않습니다.
  expect(unavailable).not.toContain('upstream-secret');
  // 검토: fetch 거절로 연결 실패를 모의하며 실제 장애를 만들지 않습니다.
  fetchMock.mockRejectedValueOnce(new Error('private-network-detail'));
  // 검토: 요청 거절 처리 HTML을 얻습니다.
  const disconnected = await renderPage();
  // 검토: 연결 실패도 공통 오류여야 합니다.
  expectError(disconnected);
  // 검토: 내부 예외 메시지를 HTML에 노출하지 않습니다.
  expect(disconnected).not.toContain('private-network-detail');
  // 검토: HTTP 성공이지만 JSON 파싱 불가한 body를 공급합니다.
  fetchMock.mockResolvedValueOnce(new Response('invalid-json'));
  // 검토: 잘못된 JSON을 빈 목록으로 숨기지 않습니다.
  expectError(await renderPage());
  // 검토: JSON 문법은 맞아도 아래 구조는 전체 조회 오류입니다.
  for (const payload of [
    // 검토: null은 정상 응답 객체가 아닙니다.
    null,
    // 검토: 음수 total을 거절합니다. 모든 숫자 경계를 검증하는 사례는 아닙니다.
    { total: -1, items: [] },
    // 검토: items는 null이 아닌 배열이어야 합니다.
    { total: 1, items: null },
    // 검토: 빈 기사 ID를 허용하지 않습니다.
    { total: 1, items: [{ ...item, article_id: '' }] },
    // 검토: SHA256 형태가 아닌 기사 ID를 허용하지 않습니다.
    { total: 1, items: [{ ...item, article_id: 'not-an-article-id' }] },
    // 검토: 숫자 제목을 정상 문자열로 처리하지 않습니다.
    { total: 1, items: [{ ...item, article: { ...item.article, title: 42 } }] },
    {
      // 검토: total을 정상으로 두어 요약 필드 오류를 검사합니다.
      total: 1,
      // 검토: null 요약을 정상 문자열로 처리하지 않습니다.
      items: [{ ...item, article: { ...item.article, description: null } }],
    },
    {
      // 검토: total을 정상으로 두어 발행일 타입 오류를 검사합니다.
      total: 1,
      // 검토: 숫자 발행일은 구조 오류입니다. 해석 불가 문자열의 미확인 처리와 다릅니다.
      items: [{ ...item, article: { ...item.article, pubDate: 42 } }],
    },
  ]) {
    // 검토: JSON 직렬화는 성공시켜 앱의 구조 검증을 검사합니다.
    fetchMock.mockResolvedValueOnce(Response.json(payload));
    // 검토: 잘못된 응답을 조용히 일부 표시하거나 빈 목록으로 숨기지 않고 공통 오류로 처리합니다.
    expectError(await renderPage());
  }
});
```

## 7. articleRequestTimeout

Entry: `articleRequestTimeout` — 미응답 요청 취소와 오류 안내. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 미응답 요청이 취소되고 한도 안에 오류 화면으로 끝나는지 검사합니다.
test('articleRequestTimeout', async () => {
  // 검토: 실제 요청의 취소 신호를 기록합니다.
  let requestSignal: AbortSignal | null | undefined;
  // 검토: 정상 응답을 주지 않는 모의 fetch입니다.
  fetchMock.mockImplementationOnce((_input, init) => {
    // 검토: 페이지가 옵션으로 준 취소 신호를 관찰합니다.
    requestSignal = init?.signal;
    // 검토: abort 때만 거절하는 mock이며 실제 네트워크 지연·timeout을 대신합니다.
    return new Promise<Response>((_resolve, reject) => {
      // 검토: 페이지 취소 신호와 모의 요청을 연결합니다.
      requestSignal?.addEventListener(
        // 검토: abort 이벤트가 있어야 모의 요청이 끝납니다.
        'abort',
        // 검토: 취소되면 AbortError로 거절해 페이지 오류 처리를 유발합니다.
        () => reject(new DOMException('timeout', 'AbortError')),
        // 검토: 취소 처리는 한 번만 실행합니다.
        { once: true },
      );
    });
  });
  // 검토: 관찰용 타이머를 나중에 정리할 수 있도록 보관합니다.
  let deadline: ReturnType<typeof setTimeout> | undefined;
  // 검토: 결과와 무관하게 관찰용 타이머를 정리합니다.
  try {
    // 검토: 페이지 완료와 7초 관찰 한도 중 먼저 끝난 결과를 확인합니다.
    const result = await Promise.race([
      // 검토: 페이지의 요청·취소·오류 처리를 기다립니다.
      renderPage(),
      // 검토: 미완료 구현을 성공으로 오인하지 않을 표식을 준비합니다.
      new Promise<string>((resolve) => {
        // 검토: 7초가 지나면 오류 화면 검사를 통과할 수 없는 표식을 반환합니다. 서비스 timeout의 정확한 초값은 단언하지 않습니다.
        deadline = setTimeout(() => resolve('REQUEST_DID_NOT_FINISH'), 7000);
      }),
    ]);
    // 검토: 관찰 한도 전에 공통 오류 화면으로 끝나야 합니다.
    expectError(result);
    // 검토: 빠른 반환뿐 아니라 실제 요청 신호가 abort되어야 합니다.
    expect(requestSignal?.aborted).toBe(true);
  // 검토: 검사 결과와 무관하게 관찰 타이머를 정리합니다.
  } finally {
    // 검토: 남은 타이머가 다음 검사에 영향을 주지 않게 제거합니다.
    clearTimeout(deadline);
  }
// 검토: Vitest 검사 한도는 10초입니다. 서비스 요청 timeout을 10초로 요구하는 뜻이 아닙니다.
}, 10000);
```

## 8. articleLoading

Entry: `articleLoading` — 실제 loading.tsx·처리 중 안내·요청 없음. 대상: `src/app/incidents/article-list-api.test.ts`. 위 공통 헤더를 사용합니다.

```ts
// 검토: 실제 loading.tsx의 상태 안내와 요청 없음을 검사합니다.
test('articleLoading', async () => {
  // 검토: glob에서 실제 모듈의 로더를 찾습니다.
  const load = loadingRoutes['./loading.tsx'];
  // 검토: 로더 존재를 먼저 단언해 기능 부재를 드러냅니다. 없는 파일의 정적 import 오류나 가짜 stub으로 대신하지 않습니다.
  expect(load).toBeTypeOf('function');
  // 검토: 존재 확인 뒤 실제 모듈을 가져옵니다.
  const loadingModule = await load();
  // 검토: 함수형 default 컴포넌트라는 공통 검사를 통과해야 합니다.
  assert(isLoadingModule(loadingModule));
  // 검토: 로딩의 정적 HTML을 검사합니다. 실제 Next 스트리밍 전환은 재현하지 않습니다.
  const html = renderToStaticMarkup(createElement(loadingModule.default));
  // 검토: 로딩 안내를 status에서 찾습니다.
  const status = readRole(html, 'status');
  // 검토: 로딩 status 요소가 있어야 합니다.
  expect(status).not.toBeNull();
  // 검토: 처리 중을 뜻하는 aria-busy 속성이 있어야 합니다.
  expect(status?.[2]).toContain('aria-busy="true"');
  // 검토: 사건을 불러오는 중 안내가 status 안에 있어야 합니다.
  expect(status?.[3]).toContain('사건을 불러오는 중');
  // 검토: 로딩을 정상 빈 목록으로 표시하지 않습니다.
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  // 검토: 로딩을 조회 실패로 표시하지 않습니다.
  expect(html).not.toContain('기사를 불러오지 못했어요');
  // 검토: 로딩에는 기사 카드가 없어야 합니다.
  expect(cards(html)).toHaveLength(0);
  // 검토: 로딩 컴포넌트 자체는 fetch를 하지 않아야 합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 필수 지원 설정 전체

대상: `vitest.config.ts`. 지원 변경은 `@`를 `./src`로 해석하는 별칭입니다. 기존 node 환경과 전체 `src/**/*.test.ts` 범위를 유지하여 기존 13개 테스트를 제외하지 않습니다.

```ts
// 검토: 앱 src 파일 URL을 별칭 해석용 로컬 경로로 바꿉니다.
import { fileURLToPath } from 'node:url';
// 검토: 기존 Vitest 형식으로 지원 설정을 선언합니다.
import { defineConfig } from 'vitest/config';
// 검토: 아래는 전체 지원 설정입니다. 제품 모듈을 가짜 구현으로 대체하지 않습니다.
export default defineConfig({
  // 검토: 지원 변경은 @를 ./src로 연결하는 별칭뿐입니다. 실제 페이지와 공통 모듈을 해석합니다.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // 검토: 기존 node 환경과 src/**/*.test.ts를 유지해 기존 13개 테스트와 신규 테스트를 포함합니다. 테스트 제외·timeout 완화는 없습니다.
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```
