# 기사 목록 더 보기 — 승인 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

2026-10-11 · 새 기사 목록 페이지네이션 테스트 3개. 기존 58개 테스트는 변경하지 않는다. 제품 구현 전 초안이다.

[동작 명세](spec-proposal.md) · [실행할 원본 계획](failed-test-proposal.md) · [실패 확인 및 검증 결과](probe-results.md)

## 검토할 동작

1. 원본 행 수 기준 조회, 페이지 안·사이 중복 제거, 짧은 페이지 지속, 최신 total 종료, 추가 카드의 상세·이미지·원문 연결.
2. 연속 클릭 1회 처리, 접근 가능한 로딩, HTTP/JSON/스키마/네트워크 실패에도 기존 기사 유지, 같은 offset 재시도.
3. 빈 다음 페이지 종료, 빈 첫 페이지와 처음부터 완료된 목록에서는 더 보기 숨김.

## 테스트의 가정과 한계

- fixture는 기사 0~20의 가상 데이터다. fetch 전체를 대체하므로 네이버·OCI·Cloudflare 호출과 과금이 없다. 실제 네트워크나 이미지 바이너리는 검증하지 않는다.
- jsdom에서 실제 React 화면과 /incidents 함수를 실행한다. Next 서버 액션의 네트워크 직렬화와 라우팅은 승인 후 실제 Chrome으로 별도 검증한다. 이미지 src와 AI 표시가 있어도 다운로드 성공을 뜻하지 않는다.
- 20행보다 짧은 응답도 total이 남으면 계속한다. total 감소와 빈 페이지에서 종료한다. 데이터 삽입에 따른 offset 방식의 전체 스냅샷 일관성은 기존 서버가 보장하지 않으며 이 작업에서 바꾸지 않는다.
- 실패는 화면 동작 검증이다. 테스트가 현재 RED라는 사실만으로 앞으로 모든 분기가 통과할 것이라고 주장하지 않는다.
- 기존 승인 테스트·helpers·fixture·의존성 변경은 없다. 아래 공유 헤더와 테스트가 승인 대상이며 설명 주석은 제외된다.

## 공유 헤더 — 공유 헤더

대상 파일: `src/app/incidents/article-list-pagination.test.ts`

```ts
// file: src/app/incidents/article-list-pagination.test.ts
// @vitest-environment jsdom
// 검토: 실제 React 업데이트 완료를 기다려 화면 상태를 검증한다.
import { act } from 'react';
// 검토: 가상 DOM에도 실제 React root를 만들어 이벤트와 상태 변경을 실행한다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 테스트 전후 격리, 행동 검증과 외부 요청 대체에 Vitest를 사용한다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 별도 가짜 화면이 아니라 현재 /incidents 페이지를 직접 실행한다.
import IncidentsPage from '@/app/incidents/page';
// 검토: 실제 기사 응답 타입과 동일한 fixture를 만들도록 타입을 가져온다.
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

// 검토: 네이버나 운영 서버를 호출하지 않도록 fetch를 대체하고 요청 순서를 기록한다.
const request = vi.fn<typeof fetch>();
// 검토: 실제 주소가 아닌 예약 도메인을 API 설정으로 사용한다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 각 테스트가 사용할 화면 컨테이너를 별도로 보관한다.
let container: HTMLDivElement;
// 검토: 테스트 종료 시 해제할 React root를 보관한다.
let root: Root;

// 검토: 번호로 안정적인 ID와 제목을 갖는 가상 기사를 만든다.
function article(index: number): ArticleCollectionItem {
  // 검토: 실제 목록 API가 소비하는 기사와 이미지 필드를 반환한다.
  return {
    // 검토: 실제 계약에 맞는 64자리 소문자 16진수 ID를 만든다.
    article_id: index.toString(16).padStart(64, '0'),
    // 검토: 기본 fixture는 이미지 생성이 꺼진 상태이다.
    image_status: 'disabled',
    // 검토: 이미지 비활성 상태이므로 URL도 없다.
    image_url: null,
    // 검토: 기사 본문 대신 현재 API가 제공하는 요약 필드를 사용한다.
    article: {
      // 검토: 번호가 드러나는 제목으로 화면 순서와 중복을 구별한다.
      title: '기사 ' + index,
      // 검토: 동일한 번호의 요약을 함께 제공한다.
      description: '기사 요약 ' + index,
      // 검토: 변하지 않는 ISO 발행 시각으로 날짜 표시를 안정화한다.
      pubDate: '2026-10-11T00:00:00Z',
      // 검토: 기사마다 다른 안전한 HTTP 원문 링크를 제공한다.
      originallink: 'https://publisher.example.invalid/' + index,
      // 검토: 원문 링크가 우선 사용되므로 대체 링크는 빈 값으로 둔다.
      link: '',
    },
  };
}

// 검토: 기존 API의 페이지 크기인 20행 묶음을 만든다.
function batch(start = 0) {
  // 검토: 시작 번호부터 연속된 20개 기사를 만들어 응답 순서를 보존한다.
  return Array.from({ length: 20 }, (_, index) => article(start + index));
}

// 검토: 각 테스트에 깨끗한 요청 기록과 화면을 준비한다.
beforeEach(() => {
  // 검토: 이전 테스트의 모의 응답과 요청 횟수를 모두 초기화한다.
  request.mockReset();
  // 검토: 실제 환경 파일 대신 예약 도메인을 서버 API 설정으로 사용한다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 제품의 fetch 호출을 기록 가능한 모의 함수로 교체한다.
  vi.stubGlobal('fetch', request);
  // 검토: React의 테스트 업데이트를 act로 관리하도록 설정한다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: 새 화면 컨테이너를 만든다.
  container = document.createElement('div');
  // 검토: 버튼 클릭 등 DOM 동작을 수행할 수 있게 문서에 연결한다.
  document.body.append(container);
  // 검토: 제품 컴포넌트를 렌더할 React root를 만든다.
  root = createRoot(container);
});

// 검토: 테스트가 실패해도 화면과 전역 대체값을 복구한다.
afterEach(async () => {
  // 검토: 상태 효과의 정리까지 기다린 뒤 화면을 해제한다.
  await act(async () => root.unmount());
  // 검토: 테스트용 DOM을 제거한다.
  container.remove();
  // 검토: 임시로 대체한 함수를 복구한다.
  vi.restoreAllMocks();
  // 검토: fetch와 React 전역 테스트 설정을 복구한다.
  vi.unstubAllGlobals();
  // 검토: 서버 API 환경변수를 원래대로 복구한다.
  vi.unstubAllEnvs();
});

// 검토: 실제 서버 페이지의 첫 조회 결과를 화면에 연결한다.
async function mount() {
  // 검토: 현재 페이지 함수를 직접 호출하므로 초기 API 요청도 검증에 포함된다.
  const page = await IncidentsPage();
  // 검토: 반환된 화면의 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => root.render(page));
}

// 검토: 사용자에게 보이는 이름으로 목록 버튼을 찾는다.
function button(name: string) {
  // 검토: 이번 페이지 컨테이너 안의 버튼만 검사한다.
  const found = Array.from(container.querySelectorAll('button')).find(
    // 검토: 각 후보 버튼의 접근 가능한 이름을 비교한다.
    (entry) =>
      // 검토: aria-label이 있으면 그것을, 없으면 버튼 문구를 이름으로 사용한다.
      (entry.getAttribute('aria-label') ?? entry.textContent?.trim()) === name,
  );
  // 검토: 버튼이 없으면 행동 검증 실패로 판정하며 구현 심볼 부재와 구분한다.
  assert(found, `${name} 버튼이 표시되어야 합니다`);
  // 검토: 검증된 버튼을 돌려주어 클릭·비활성 상태를 확인한다.
  return found;
}

// 검토: 사용자 클릭 후 발생하는 React 상태 갱신까지 기다린다.
async function click(name: string) {
  // 검토: 이름으로 찾은 실제 DOM 버튼을 클릭한다.
  await act(async () => button(name).click());
}

// 검토: 화면의 기사 제목을 순서대로 읽는다.
function titles() {
  // 검토: 목록 카드의 제목 요소만 선택한다.
  return Array.from(container.querySelectorAll('article h2')).map(
    // 검토: HTML 내부 구조 대신 사용자가 읽는 텍스트를 비교한다.
    (title) => title.textContent,
  );
}

// 검토: 실제 fetch 기록에서 페이지 시작 위치를 추출한다.
function offsets() {
  // 검토: 요청이 발생한 순서를 유지한다.
  return request.mock.calls.map(([input]) =>
    // 검토: 요청 URL의 쿼리 값을 안전하게 파싱한다.
    new URL(
      // 검토: Request 객체 또는 문자열 URL 양쪽을 처리한다.
      input instanceof Request ? input.url : String(input),
    // 검토: 다음 페이지 위치를 카드 수가 아닌 실제 offset으로 검증한다.
    ).searchParams.get('offset'),
  );
}
```

## 항목 1 — articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity

대상 파일: `src/app/incidents/article-list-pagination.test.ts` · 위 공유 헤더를 사용한다.

```ts
// 검토: 원본 행 이동·첫 등장 중복 제거·추가 카드 연결을 하나의 누적 흐름에서 확인한다.
test('articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity', async () => {
  // 검토: 첫 페이지 20행 중 마지막을 ID 0 중복으로 만들어 고유 기사는 19개로 만든다.
  const first = [...batch().slice(0, 19), article(0)];
  // 검토: 원본 총량은 100행으로 응답해 첫 페이지 뒤에도 더 볼 수 있게 한다.
  request.mockResolvedValueOnce(Response.json({ total: 100, items: first }));
  // 검토: 실제 목록 페이지를 렌더한다.
  await mount();
  // 검토: 초기 중복이 제거된 제목과 순서를 확인한다.
  expect(titles()).toEqual(
    // 검토: 처음 등장한 0~18번 기사만 남아야 한다.
    first.slice(0, 19).map((item) => item.article.title),
  );
  // 검토: 버튼을 누르기 전에는 첫 요청 한 번만 발생해야 한다.
  expect(request).toHaveBeenCalledTimes(1);
  // 검토: 남은 행이 있으므로 더 보기 버튼을 사용할 수 있어야 한다.
  expect(button('더 보기').disabled).toBe(false);

  // 검토: 이미 표시한 ID 0을 다음 응답에서도 사용한다.
  const duplicate = article(0);
  // 검토: 동일 ID의 나중 제목으로 첫 카드가 덮어써지는 오류를 탐지한다.
  duplicate.article.title = '뒤늦은 중복 제목';
  // 검토: 다음 요청의 응답을 미리 준비한다.
  request.mockResolvedValueOnce(
    // 검토: 원본 응답은 정상 JSON 구조로 제공한다.
    Response.json({
      // 검토: 전체 원본 행 수는 여전히 100이다.
      total: 100,
      // 검토: 페이지 전체 20행을 기존 ID의 중복으로 채운다.
      items: Array.from({ length: 20 }, () => duplicate),
    }),
  );
  // 검토: 사용자 동작으로 두 번째 페이지를 요청한다.
  await click('더 보기');
  // 검토: 중복만 받은 뒤에도 표시된 제목과 순서가 변하지 않아야 한다.
  expect(titles()).toEqual(
    // 검토: 원래 19개 제목이 그대로 남아야 한다.
    first.slice(0, 19).map((item) => item.article.title),
  );
  // 검토: 신규 카드가 없어도 원본 행이 남았으므로 더 보기를 계속 제공한다.
  expect(button('더 보기').disabled).toBe(false);

  // 검토: 다음 짧은 페이지에서 새로 등장할 ID 19 기사를 준비한다.
  const next = article(19);
  // 검토: 추가 카드의 완성 이미지 상태를 검증한다.
  next.image_status = 'ready';
  // 검토: 기존 계약대로 자기 기사 ID의 JPEG 경로만 제공한다.
  next.image_url = `/images/${next.article_id}.jpg`;
  // 검토: 새 페이지 내부에도 같은 ID가 다시 등장하도록 준비한다.
  const repeatedNext = {
    // 검토: 복제본의 ID와 이미지 속성은 첫 새 기사와 같다.
    ...next,
    // 검토: 뒤의 복제본 제목이 첫 제목을 대체하는지도 구별한다.
    article: { ...next.article, title: '새 페이지 내부의 중복 제목' },
  };
  // 검토: 20행보다 짧은 다음 응답을 준비한다.
  request.mockResolvedValueOnce(
    // 검토: 원본 2행이지만 고유 새 기사는 1개이며 total은 여전히 100이다.
    Response.json({ total: 100, items: [next, repeatedNext] }),
  );
  // 검토: 짧은 페이지를 실제로 요청한다.
  await click('더 보기');
  // 검토: 0~19번 기사 20개가 처음 등장한 순서대로 표시되어야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: 짧은 페이지라는 이유만으로 아직 남은 조회를 중단하면 안 된다.
  expect(button('더 보기').disabled).toBe(false);
  // 검토: 마지막에 추가된 기사 카드를 검사한다.
  const added = Array.from(container.querySelectorAll('article')).at(-1);
  // 검토: 검사할 카드가 실제로 존재해야 한다.
  assert(added);
  // 검토: 추가 카드의 제목 링크가 상세 화면으로 연결되는지 확인한다.
  expect(added.querySelector('h2 a')?.getAttribute('href')).toBe(
    // 검토: URL에 그 카드의 안정적인 article_id가 들어가야 한다.
    `/incidents/${next.article_id}`,
  );
  // 검토: 추가 카드도 기존 이미지 경로 정책을 사용해야 한다.
  expect(added.querySelector('img')?.getAttribute('src')).toBe(
    // 검토: 허용된 API origin과 해당 JPEG 경로가 결합되어야 한다.
    apiOrigin + next.image_url,
  );
  // 검토: 이미지에는 AI 생성 표시가 있어야 한다. 실제 JPEG 다운로드 성공은 이 테스트의 범위가 아니다.
  expect(added.textContent).toContain('AI 생성 이미지');
  // 검토: 추가 카드에 원문 링크가 남아 있는지 확인한다.
  expect(
    // 검토: 이 fixture의 19번 기사 원문 링크를 찾는다.
    added.querySelector('a[href="https://publisher.example.invalid/19"]'),
  // 검토: 링크가 실제 DOM에 존재해야 한다.
  ).not.toBeNull();

  // 검토: 총량이 갱신된 마지막 응답을 준비한다.
  request.mockResolvedValueOnce(
    // 검토: 원본 총량을 43으로 줄이고 기존 ID의 중복 1행을 반환한다.
    Response.json({ total: 43, items: [duplicate] }),
  );
  // 검토: 마지막 원본 행을 조회한다.
  await click('더 보기');
  // 검토: 고유 카드 수와 무관하게 원본 20·20·2행을 누적해 0→20→40→42로 이동해야 한다.
  expect(offsets()).toEqual(['0', '20', '40', '42']);
  // 검토: 마지막 중복은 새 카드를 만들거나 기존 제목을 바꾸지 않아야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: 최신 total 43에 도달했으므로 더 보기 버튼이 사라져야 한다.
  expect(container.querySelector('button')).toBeNull();
  // 검토: 기존 ID의 뒤늦은 제목이 표시되지 않아야 한다.
  expect(container.textContent).not.toContain('뒤늦은 중복 제목');
  // 검토: 새 페이지 내부의 동일 ID도 첫 제목을 유지해야 한다.
  expect(container.textContent).not.toContain('새 페이지 내부의 중복 제목');
  // 검토: 중복 포함 원본 total을 고유 기사 건수로 표시하지 않는지 두 total 값으로 검사한다.
  expect(container.textContent).not.toMatch(/(?:100|43)\s*건/);
  // 검토: 초기 및 모든 추가 요청에 같은 서버 조회 계약이 적용되는지 확인한다.
  for (const [input, init] of request.mock.calls) {
    // 검토: 각 요청 URL을 파싱한다.
    const url = new URL(input instanceof Request ? input.url : String(input));
    // 검토: 설정한 API origin만 사용해야 한다.
    expect(url.origin).toBe(apiOrigin);
    // 검토: 수집이나 이미지 생성이 아닌 /news 읽기 요청이어야 한다.
    expect(url.pathname).toBe('/news');
    // 검토: 일반 목록에는 keyword나 다른 쿼리를 추가하지 않는다.
    expect([...url.searchParams.keys()].sort()).toEqual(['limit', 'offset']);
    // 검토: 각 요청의 페이지 크기는 기존과 동일한 20이다.
    expect(url.searchParams.get('limit')).toBe('20');
    // 검토: 기사를 읽는 GET 요청이어야 한다.
    expect(init?.method).toBe('GET');
    // 검토: 기존 no-store 정책을 유지해야 한다.
    expect(init?.cache).toBe('no-store');
    // 검토: 취소/시간 제한 신호를 전달해야 한다. 5초 경과 자체는 기존 테스트가 검증한다.
    expect(init?.signal).toBeTruthy();
    // 검토: 읽기 요청에 본문을 보내지 않는다.
    expect(init?.body).toBeUndefined();
  }
});
```

## 항목 2 — articleListMorePendingFailuresAndRetryPreserveArticles

대상 파일: `src/app/incidents/article-list-pagination.test.ts` · 위 공유 헤더를 사용한다.

```ts
// 검토: 추가 조회 지연·여러 실패·복구 중 기존 기사와 페이지 위치가 유지되는지 검증한다.
test('articleListMorePendingFailuresAndRetryPreserveArticles', async () => {
  // 검토: 21행 중 첫 20행을 준비해 정확히 다음 페이지가 필요하게 한다.
  request.mockResolvedValueOnce(Response.json({ total: 21, items: batch() }));
  // 검토: 첫 페이지를 표시한다.
  await mount();
  // 검토: 요청 완료 시점을 테스트가 제어하도록 resolver를 보관한다.
  let finish: ((response: Response) => void) | undefined;
  // 검토: 다음 fetch는 즉시 완료되지 않도록 대체한다.
  request.mockImplementationOnce(
    // 검토: 모의 fetch가 호출되면 대기 중인 Promise를 반환한다.
    () =>
      // 검토: 응답을 보류하여 로딩 상태를 관찰한다.
      new Promise((resolve) => {
        // 검토: 나중에 실패 응답을 전달할 함수를 보관한다.
        finish = resolve;
      }),
  );
  // 검토: 처음 표시된 더 보기 버튼을 잡는다.
  const more = button('더 보기');
  // 검토: React가 다시 렌더하기 전 같은 이벤트 묶음에서 연속 클릭한다.
  await act(async () => {
    // 검토: 첫 클릭으로 추가 조회를 시작한다.
    more.click();
    // 검토: 즉시 두 번째 클릭을 시도해 중복 요청 방지를 검증한다.
    more.click();
  });
  // 검토: 초기 1회와 추가 1회만 요청되어야 한다.
  expect(request).toHaveBeenCalledTimes(2);
  // 검토: 추가 요청 중 버튼은 비활성화되어야 한다.
  expect(more.disabled).toBe(true);
  // 검토: 스크린리더에도 읽을 수 있는 로딩 상태를 찾는다.
  const busy = container.querySelector('[role="status"][aria-busy="true"]');
  // 검토: 추가 조회 중이라는 문구가 표시되어야 한다.
  expect(busy?.textContent).toContain('추가 기사를 불러오는 중이에요');
  // 검토: 로딩 중 기존 20개 기사와 순서가 유지되어야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: 대기 중인 요청이 실제로 만들어졌음을 확인한다.
  assert(finish);
  // 검토: 확인된 resolver를 비동기 콜백에서 사용한다.
  const resolvePending = finish;
  // 검토: 실패 응답 후 UI 갱신까지 기다린다.
  await act(async () =>
    // 검토: 민감할 수 있는 내부 본문을 포함한 503 응답으로 끝낸다.
    resolvePending(new Response('PRIVATE_HTTP_FAILURE', { status: 503 })),
  );
  // 검토: 실패를 접근 가능한 알림으로 표시하는지 확인한다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 추가 조회 실패 문구가 보여야 한다.
    '추가 기사를 불러오지 못했어요',
  );
  // 검토: 서버의 원본 오류 본문을 사용자에게 노출하면 안 된다.
  expect(container.textContent).not.toContain('PRIVATE_HTTP_FAILURE');
  // 검토: 실패한 뒤 로딩 표시는 해제되어야 한다.
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  // 검토: 사용자가 재시도할 수 있도록 버튼을 활성화해야 한다.
  expect(button('다시 시도').disabled).toBe(false);
  // 검토: 503 오류 후에도 기존 제목과 순서가 보존되어야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));

  // 검토: 전송은 성공했지만 본문이 잘못된 두 경우를 차례로 검증한다.
  for (const response of [
    // 검토: 파싱할 수 없는 JSON 응답을 준비한다.
    new Response('invalid-json'),
    // 검토: JSON이지만 기사 스키마가 잘못된 응답도 준비한다.
    Response.json({
      // 검토: total 자체는 정상 값으로 둔다.
      total: 21,
      // 검토: 잘못된 기사 ID 하나 때문에 페이지 검증이 실패하도록 만든다.
      items: [{ ...article(20), article_id: 'invalid' }],
    }),
  ]) {
    // 검토: 해당 실패 응답을 다음 요청에서 반환한다.
    request.mockResolvedValueOnce(response);
    // 검토: 실패한 페이지를 사용자가 재시도한다.
    await click('다시 시도');
    // 검토: 잘못된 데이터를 받았더라도 이미 읽은 20개는 유지한다.
    expect(titles()).toEqual(batch().map((item) => item.article.title));
    // 검토: 잘못된 응답도 추가 조회 오류로 표시되어야 한다.
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      // 검토: 사용자에게 동일한 일반 오류 문구를 보여 준다.
      '추가 기사를 불러오지 못했어요',
    );
  }
  // 검토: 연결 자체가 실패하는 경우도 검증한다.
  request.mockRejectedValueOnce(new Error('PRIVATE_NETWORK_FAILURE'));
  // 검토: 같은 재시도 버튼으로 네트워크 오류를 경험한다.
  await click('다시 시도');
  // 검토: 네트워크 실패에도 기존 카드는 변하지 않아야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: 내부 예외 메시지는 화면에 표시하지 않는다.
  expect(container.textContent).not.toContain('PRIVATE_NETWORK_FAILURE');
  // 검토: 계속 재시도할 수 있어야 한다.
  expect(button('다시 시도').disabled).toBe(false);
  // 검토: 다음 재시도는 정상적으로 마지막 기사 하나를 반환한다.
  request.mockResolvedValueOnce(
    // 검토: 최신 total 21에 도달하는 정상 응답이다.
    Response.json({ total: 21, items: [article(20)] }),
  );
  // 검토: 정상 응답으로 복구를 시도한다.
  await click('다시 시도');
  // 검토: 기존 20개에 마지막 1개만 추가되는지 확인한다.
  expect(titles()).toEqual(
    // 검토: 제목 순서는 0~20번이어야 한다.
    [...batch(), article(20)].map((item) => item.article.title),
  );
  // 검토: 모든 실패는 offset을 소비하지 않으므로 첫 추가 요청과 네 번의 재시도 모두 20을 요청한다.
  expect(offsets()).toEqual(['0', '20', '20', '20', '20', '20']);
  // 검토: 복구 후 오류 알림을 제거해야 한다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 복구 후 로딩 상태도 남지 않아야 한다.
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  // 검토: 마지막 행까지 받았으므로 더 보기 버튼을 제거해야 한다.
  expect(container.querySelector('button')).toBeNull();
});
```

## 항목 3 — articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists

대상 파일: `src/app/incidents/article-list-pagination.test.ts` · 위 공유 헤더를 사용한다.

```ts
// 검토: 빈 다음 페이지와 처음부터 끝난 결과에서 불필요한 조회를 제공하지 않는지 검증한다.
test('articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists', async () => {
  // 검토: 아직 남은 행이 있다고 알려 주는 초기 20행을 준비한다.
  request.mockResolvedValueOnce(Response.json({ total: 100, items: batch() }));
  // 검토: 첫 페이지를 표시한다.
  await mount();
  // 검토: 다음 페이지를 요청할 버튼이 있어야 한다.
  expect(button('더 보기').disabled).toBe(false);
  // 검토: total이 남았다고 해도 다음 응답이 비어 있는 상황을 만든다.
  request.mockResolvedValueOnce(Response.json({ total: 100, items: [] }));
  // 검토: 빈 다음 페이지를 실제로 요청한다.
  await click('더 보기');
  // 검토: 빈 추가 응답이 기존 기사를 지우지 않아야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: total만 믿고 빈 페이지를 반복 요청하지 않도록 더 보기를 종료한다.
  expect(container.querySelector('button')).toBeNull();
  // 검토: 이미 기사가 있으므로 초기 빈 목록 메시지를 표시하지 않는다.
  expect(container.textContent).not.toContain('아직 수집된 기사가 없어요');
  // 검토: 빈 페이지는 정상 응답이므로 오류가 아니다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 0과 20 위치만 요청해야 한다.
  expect(offsets()).toEqual(['0', '20']);

  // 검토: 이전 누적 화면을 해제하여 새 진입을 시뮬레이션한다.
  await act(async () => root.render(null));
  // 검토: total이 양수여도 첫 items가 비어 있는 경계를 준비한다.
  request.mockResolvedValueOnce(Response.json({ total: 99, items: [] }));
  // 검토: 빈 초기 목록을 표시한다.
  await mount();
  // 검토: 카드가 없어야 한다.
  expect(titles()).toEqual([]);
  // 검토: 기존 빈 목록 안내가 유지되는지 확인한다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 아직 수집된 기사가 없다는 기존 문구를 유지한다.
    '아직 수집된 기사가 없어요',
  );
  // 검토: 초기 응답이 비어 있으면 더 보기를 제공하지 않는다.
  expect(container.querySelector('button')).toBeNull();
  // 검토: 빈 결과를 오류로 취급하지 않는다.
  expect(container.querySelector('[role="alert"]')).toBeNull();

  // 검토: 두 번째 시나리오도 해제하고 새 진입을 시작한다.
  await act(async () => root.render(null));
  // 검토: 첫 20행이 전체 20행인 완료 결과를 준비한다.
  request.mockResolvedValueOnce(Response.json({ total: 20, items: batch() }));
  // 검토: 첫 페이지부터 완료된 목록을 표시한다.
  await mount();
  // 검토: 20개 기사는 모두 표시해야 한다.
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  // 검토: 이미 전체 행을 받았으므로 더 보기를 제공하지 않는다.
  expect(container.querySelector('button')).toBeNull();
  // 검토: 각 새 진입은 offset 0부터 시작하고 추가 자동 조회는 없어야 한다.
  expect(offsets()).toEqual(['0', '20', '0', '0']);
  // 검토: 명시한 초기 조회 3회와 첫 시나리오의 추가 조회 1회만 있어야 한다.
  expect(request).toHaveBeenCalledTimes(4);
});
```
