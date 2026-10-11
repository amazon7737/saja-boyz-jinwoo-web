# 기사 상세 테스트 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

[구현안](proposal.md) · [신규 실행 초안](failed-test.draft.md) · [기존 테스트 변경점](existing-tests.patch)

신규 8개 항목의 공통 헤더와 본문, 기존 4개 테스트의 대체 본문 및 변경 없는 공유 헤더를 빠짐없이 포함했다. `// 검토:` 줄만 제거하면 실행 입력과 바이트 단위로 일치한다. 기존 테스트 대체안은 현재 구현에서도 통과하며, 신규 상세 진입의 필수 동작은 별도 신규 테스트가 검증한다.

API·OS 공유·클립보드는 가짜 응답으로 대체한다. DOM 동작 검증과 실제 브라우저/OCI 검증의 범위를 혼동하지 않는다. 픽스처는 실제 기사가 아니다.

## 기사 상세·진입·공유 테스트 초안

검토 전 초안. 아래 헤더와 본문이 실행 입력이며 `review.ko.md`의 설명 주석은 포함하지 않는다.

## 상세 경로 통합 검증

```ts
// file: src/app/incidents/article-detail.test.ts
// @vitest-environment jsdom
// 검토: 검증·가짜 응답·환경 복구 도구를 사용한다. 외부 API는 테스트에서 실제 호출하지 않는다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 실제 React 렌더와 이벤트 업데이트를 검증하기 위한 도구·타입을 사용한다.
import { act, type ReactNode } from 'react';
// 검토: 브라우저 DOM에 실제 컴포넌트를 마운트하고 종료 후 정리한다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 서버 페이지의 반환값을 HTML로 렌더해 내용과 링크를 검사한다.
import { renderToStaticMarkup } from 'react-dom/server';
// 검토: 실제 앱 모듈 ./[id]/page를 사용한다. 해당 제품 코드를 테스트용 가짜 구현으로 바꾸지 않는다.
import DetailPage from './[id]/page';

// 검토: Next의 notFound를 식별 가능한 오류로 대체한다. HTTP 404 전송 자체는 실제 브라우저 검증에서 별도로 확인한다.
vi.mock('next/navigation', () => ({
  // 검토: Next 기사 없음 동작의 테스트용 대체 함수: () => { throw new Error('TEST_ARTICLE_NOT_FOUND'); }
  notFound: () => {
    // 검토: 실제 Next 응답 대신 이 테스트에서 식별할 수 있는 기사 없음 신호로 종료한다.
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

// 검토: 실제 기사와 혼동하지 않도록 64자리 가짜 기사 ID를 사용한다.
const id = 'a'.repeat(64);
// 검토: 실제 API가 아닌 example.invalid 주소를 사용한다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 서버 응답 형식의 가짜 기사를 정의한다. 제목 태그·한국 시간·AI 이미지의 표시 규칙을 확인하는 입력이다.
const item = {
  // 검토: 가짜 수집 묶음 ID: 'test-collection'
  collection_id: 'test-collection',
  // 검토: 기사 고유 ID: id
  article_id: id,
  // 검토: 기사 원본 필드 묶음: { title: '교통 <b>안내</b> &amp; 점검', description: '도로 점검으로 우회가 필요합니다.', pubDate: '2026-10-10T09:00:00+09:00', originallink: 'https://publisher.example.invalid/article', link: 'https://portal.example.invalid/article', }
  article: {
    // 검토: 기사 제목 입력: '교통 <b>안내</b> &amp; 점검'
    title: '교통 <b>안내</b> &amp; 점검',
    // 검토: 기사 요약 입력: '도로 점검으로 우회가 필요합니다.'
    description: '도로 점검으로 우회가 필요합니다.',
    // 검토: 기사 발행 시각 입력: '2026-10-10T09:00:00+09:00'
    pubDate: '2026-10-10T09:00:00+09:00',
    // 검토: 원문 URL 입력: 'https://publisher.example.invalid/article'
    originallink: 'https://publisher.example.invalid/article',
    // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: 'https://portal.example.invalid/article'
    link: 'https://portal.example.invalid/article',
  },
  // 검토: 서버의 이미지 준비 상태: 'ready'
  image_status: 'ready',
  // 검토: 해당 기사 ID에 연결된 이미지 경로: `/images/${id}.jpg`
  image_url: `/images/${id}.jpg`,
};
// 검토: 외부 뉴스 API 대신 호출 횟수·요청·응답을 기록하는 가짜 fetch를 만든다.
const fetchMock = vi.fn<typeof fetch>();
// 검토: 기존 빈 페이지도 호출할 수 있는 타입으로 상세 진입점을 연결한다. 반환이 없으면 아래 헬퍼가 빈 렌더 값으로 처리한다.
const detailRoute: (props: {
  params: Promise<{ id: string }>;
}) => ReactNode | void | Promise<ReactNode | void> = DetailPage;
// 검토: 이 단계의 검증에 사용할 container 값을 준비한다: let container: HTMLDivElement
let container: HTMLDivElement;
// 검토: 이 단계의 검증에 사용할 root 값을 준비한다: let root: Root
let root: Root;

// 검토: 각 테스트 전에 환경과 DOM을 새로 준비해 이전 테스트 상태가 섞이지 않게 한다.
beforeEach(() => {
  // 검토: 이 경우의 서버 주소 환경변수를 설정한다. 잘못된 주소 사례는 네트워크 요청 전에 거절돼야 한다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 현재 테스트에만 전역 값을 대체한다. 실제 API 호출과 React 업데이트를 통제하며 종료 시 복구한다.
  vi.stubGlobal('fetch', fetchMock);
  // 검토: 현재 테스트에만 전역 값을 대체한다. 실제 API 호출과 React 업데이트를 통제하며 종료 시 복구한다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: 테스트용 브라우저 주소를 기본 경로로 복원한다.
  window.history.replaceState(null, '', '/');
  // 검토: 테스트 동작을 수행한다: container = document.createElement('div');
  container = document.createElement('div');
  // 검토: 검사할 컴포넌트의 DOM 컨테이너를 문서에 붙인다.
  document.body.append(container);
  // 검토: 테스트 동작을 수행한다: root = createRoot(container);
  root = createRoot(container);
});

// 검토: 각 테스트 후 DOM·가짜 함수·환경변수·전역 객체를 복원한다.
afterEach(async () => {
  // 검토: 마운트했던 React 트리를 제거하고 업데이트가 끝날 때까지 기다린다.
  await act(async () => root.unmount());
  // 검토: 이 테스트가 추가한 DOM 컨테이너를 제거한다.
  container.remove();
  // 검토: 이후 검증에 앞선 호출 기록이나 예약된 가짜 응답이 섞이지 않게 정리한다.
  fetchMock.mockReset();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.restoreAllMocks();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.unstubAllGlobals();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.unstubAllEnvs();
  // 검토: 테스트용 브라우저 주소를 기본 경로로 복원한다.
  window.history.replaceState(null, '', '/');
});

// 검토: 실제 상세 라우트에 Promise 형태의 ID 파라미터를 전달한다. HTTP 서버 없이 서버 페이지 함수를 호출하는 검사다.
async function detailTree(articleId = id) {
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: ( (await detailRoute({ params: Promise.resolve({ id: articleId }) })) ?? null )
  return (
    (await detailRoute({ params: Promise.resolve({ id: articleId }) })) ?? null
  );
}

// 검토: 정상 상세 결과를 정적 HTML로 만들고 표시 내용을 읽는다. 예외는 정상 응답으로 숨기지 않는다.
async function detailMarkup() {
  // 검토: 상세 페이지의 정상 반환과 예외를 구별해서, 정상 표시 기대가 예외로 끝나면 단언으로 실패시킨다.
  const outcome = await detailTree().then(
    (tree) => ({ tree }),
    (error: unknown) => ({ error }),
  );
  // 검토: 검사 대상 outcome에 'error' 항목이 있으면 안 된다.
  expect(outcome).not.toHaveProperty('error');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: 'tree' in outcome. 없으면 즉시 실패한다.
  assert('tree' in outcome);
  // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
  const view = document.createElement('div');
  // 검토: 서버가 반환한 HTML을 검사용 DOM으로 읽는다. HTML 파서가 구조를 정리하므로 중첩 링크는 원본 문자열에서도 별도로 검사한다.
  view.innerHTML = renderToStaticMarkup(outcome.tree);
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: view
  return view;
}
```

- [ ] articleDetailRequestAndContent — 상세 URL의 ID로 단건 조회하고 실제 필드만 표시한다.

```ts
// 검토: 상세 주소로 단건 조회하고 서버의 제목·요약·발행 시각·원문·AI 이미지만 표시하는지 확인한다.
test('articleDetailRequestAndContent', async () => {
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(Response.json(item));
  // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
  const view = await detailMarkup();
  // 검토: 뉴스 조회 대체 함수가 정확히 1번 호출되어야 한다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 이 단계의 검증에 사용할 [input, init] 값을 준비한다: const [input, init] = fetchMock.mock.calls[0]
  const [input, init] = fetchMock.mock.calls[0];
  // 검토: 기록된 API 요청 URL을 파싱해 대상 경로 또는 검색 파라미터를 검사한다.
  const url = new URL(input instanceof Request ? input.url : String(input));
  // 검토: 서버에 요청한 전체 URL의 기대값은 `${apiOrigin}/news/${id}`이다.
  expect(url.href).toBe(`${apiOrigin}/news/${id}`);
  // 검토: 서버 조회의 HTTP 메서드의 기대값은 'GET'이다.
  expect(init?.method).toBe('GET');
  // 검토: 서버 조회의 캐시 정책의 기대값은 'no-store'이다.
  expect(init?.cache).toBe('no-store');
  // 검토: 조회 요청 본문를 전달하거나 만들지 않아야 한다.
  expect(init?.body).toBeUndefined();
  // 검토: 조회 요청의 취소 신호가 제공되어야 한다.
  expect(init?.signal).toBeTruthy();
  // 검토: 상세 화면의 기사 제목의 기대값은 '교통 안내 & 점검'이다.
  expect(view.querySelector('h1')?.textContent).toBe('교통 안내 & 점검');
  // 검토: 화면 문구(view.textContent)에 '기사 요약'가 포함되어야 한다.
  expect(view.textContent).toContain('기사 요약');
  // 검토: 화면 문구(view.textContent)에 item.article.description가 포함되어야 한다.
  expect(view.textContent).toContain(item.article.description);
  // 검토: 화면 문구(view.textContent)에 '기사 발행'가 포함되어야 한다.
  expect(view.textContent).toContain('기사 발행');
  // 검토: 화면 문구(view.textContent)에 '2026-10-10 09:00 KST'가 포함되어야 한다.
  expect(view.textContent).toContain('2026-10-10 09:00 KST');
  // 검토: 기사 발행 시각의 기계 판독 값의 기대값은 '2026-10-10T00:00:00.000Z'이다.
  expect(view.querySelector('time')?.dateTime).toBe('2026-10-10T00:00:00.000Z');
  // 검토: 해당 원문 URL의 링크에 '원문'가 포함되어야 한다.
  expect(
    view.querySelector('a[href="https://publisher.example.invalid/article"]')
      ?.textContent,
  ).toContain('원문');
  // 검토: 검사 대상 view.querySelector(`img[src="${apiOrigin}/images/${id}.jpg"]`),가 존재해야 한다.
  expect(
    view.querySelector(`img[src="${apiOrigin}/images/${id}.jpg"]`),
  ).not.toBeNull();
  // 검토: 화면 문구(view.textContent)에 'AI 생성 이미지'가 포함되어야 한다.
  expect(view.textContent).toContain('AI 생성 이미지');
  // 검토: 화면 문구(view.textContent)가 /사건 위치|발생 시각|타임라인/ 패턴에 맞으면 안 된다.
  expect(view.textContent).not.toMatch(/사건 위치|발생 시각|타임라인/);
  // 검토: 검사 대상 view.querySelector('a[href="/incidents"]')가 존재해야 한다.
  expect(view.querySelector('a[href="/incidents"]')).not.toBeNull();
  // 검토: 검사 대상 view.querySelector('a[href="/"]')가 존재해야 한다.
  expect(view.querySelector('a[href="/"]')).not.toBeNull();
});
```

- [ ] articleDetailFailureStates — 잘못된 ID·404와 설정·통신·응답 오류를 구분하고 안전한 재시도를 제공한다.

```ts
// 검토: 잘못된 ID·404와 일시적인 조회 장애를 구분하고 내부 오류를 노출하지 않는지 확인한다.
test('articleDetailFailureStates', async () => {
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ 'short', 'A'.repeat(64), '../news', 'a'.repeat(65), ]
  for (const invalidId of [
    'short',
    'A'.repeat(64),
    '../news',
    'a'.repeat(65),
  ]) {
    // 검토: 검사 대상 detailTree(invalidId)가 'TEST_ARTICLE_NOT_FOUND' 오류로 종료돼야 한다. 이 오류는 테스트의 notFound 대체 신호다.
    await expect(detailTree(invalidId)).rejects.toThrow(
      'TEST_ARTICLE_NOT_FOUND',
    );
  }
  // 검토: 뉴스 조회 대체 함수가 호출되지 않아야 한다.
  expect(fetchMock).not.toHaveBeenCalled();
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
  // 검토: 검사 대상 detailTree()가 'TEST_ARTICLE_NOT_FOUND' 오류로 종료돼야 한다. 이 오류는 테스트의 notFound 대체 신호다.
  await expect(detailTree()).rejects.toThrow('TEST_ARTICLE_NOT_FOUND');
  // 검토: 뉴스 조회 대체 함수가 정확히 1번 호출되어야 한다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 이후 검증에 앞선 호출 기록이나 예약된 가짜 응답이 섞이지 않게 정리한다.
  fetchMock.mockReset();
  // 검토: 각 장애 사례에 동일하게 적용할 화면 오류·재시도·비밀 문자열 비노출 검증을 정의한다.
  const expectFailure = (view: HTMLDivElement) => {
    // 검토: 이 단계의 검증에 사용할 alert 값을 준비한다: const alert = view.querySelector('[role="alert"]')
    const alert = view.querySelector('[role="alert"]');
    // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: alert. 없으면 즉시 실패한다.
    assert(alert);
    // 검토: 화면 문구(alert.textContent)에 '기사를 불러오지 못했어요'가 포함되어야 한다.
    expect(alert.textContent).toContain('기사를 불러오지 못했어요');
    // 검토: 화면 문구(alert.querySelector(`a[href="/incidents/${id}"]`)?.textContent,)에 '다시 시도'가 포함되어야 한다.
    expect(
      alert.querySelector(`a[href="/incidents/${id}"]`)?.textContent,
    ).toContain('다시 시도');
    // 검토: 화면 문구(view.textContent)가 /PRIVATE_DETAIL|기사를 찾을 수 없어요/ 패턴에 맞으면 안 된다.
    expect(view.textContent).not.toMatch(
      /PRIVATE_DETAIL|기사를 찾을 수 없어요/,
    );
    // 검토: 상세 화면의 기사 제목의 기대값은 '교통 안내 & 점검'이다 — 같으면 실패한다.
    expect(view.querySelector('h1')?.textContent).not.toBe('교통 안내 & 점검');
  };
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ '', 'file:///tmp/news', 'https://user:secret@news.example.invalid', ]
  for (const base of [
    '',
    'file:///tmp/news',
    'https://user:secret@news.example.invalid',
  ]) {
    // 검토: 이 경우의 서버 주소 환경변수를 설정한다. 잘못된 주소 사례는 네트워크 요청 전에 거절돼야 한다.
    vi.stubEnv('NEWS_API_BASE_URL', base);
    // 검토: 이 경우에도 오류 안내·동일 상세 URL 재시도·내부 오류 비노출 조건이 모두 성립해야 한다.
    expectFailure(await detailMarkup());
  }
  // 검토: 뉴스 조회 대체 함수가 호출되지 않아야 한다.
  expect(fetchMock).not.toHaveBeenCalled();
  // 검토: 이 경우의 서버 주소 환경변수를 설정한다. 잘못된 주소 사례는 네트워크 요청 전에 거절돼야 한다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 기사 조회의 통신 실패를 재현한다. PRIVATE_DETAIL 문자열은 화면에 노출되면 안 되는 예시다.
  fetchMock.mockRejectedValueOnce(new Error('PRIVATE_DETAIL'));
  // 검토: 이 경우에도 오류 안내·동일 상세 URL 재시도·내부 오류 비노출 조건이 모두 성립해야 한다.
  expectFailure(await detailMarkup());
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(
    new Response('PRIVATE_DETAIL', { status: 503 }),
  );
  // 검토: 이 경우에도 오류 안내·동일 상세 URL 재시도·내부 오류 비노출 조건이 모두 성립해야 한다.
  expectFailure(await detailMarkup());
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(new Response('invalid-json'));
  // 검토: 이 경우에도 오류 안내·동일 상세 URL 재시도·내부 오류 비노출 조건이 모두 성립해야 한다.
  expectFailure(await detailMarkup());
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ null, { ...item, article_id: 'b'.repeat(64) }, { ...item, article: null }, { ...item, article: { ...item.article, description: 42 } }, { ...item, image_url: 42 }, ]
  for (const payload of [
    null,
    // 검토: 기사 고유 ID: 'b'.repeat(64)
    { ...item, article_id: 'b'.repeat(64) },
    // 검토: 기사 원본 필드 묶음: null
    { ...item, article: null },
    // 검토: 기사 원본 필드 묶음: { ...item.article, description: 42 }
    { ...item, article: { ...item.article, description: 42 } },
    // 검토: 해당 기사 ID에 연결된 이미지 경로: 42
    { ...item, image_url: 42 },
  ]) {
    // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
    fetchMock.mockResolvedValueOnce(Response.json(payload));
    // 검토: 이 경우에도 오류 안내·동일 상세 URL 재시도·내부 오류 비노출 조건이 모두 성립해야 한다.
    expectFailure(await detailMarkup());
  }
});
```

- [ ] articleDetailSafePresentation — 기사 문자열·원문·날짜·이미지 상태를 안전하게 표시한다.

```ts
// 검토: 태그·엔티티·위험한 URL·잘못된 날짜·준비되지 않은 이미지를 안전하게 표시하는지 확인한다.
test('articleDetailSafePresentation', async () => {
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ 'disabled', 'pending', 'generating', 'failed', 'unknown', ]
  for (const imageStatus of [
    'disabled',
    'pending',
    'generating',
    'failed',
    'unknown',
  ]) {
    // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
    fetchMock.mockResolvedValueOnce(
      // 검토: 서버의 이미지 준비 상태: imageStatus
      Response.json({ ...item, image_status: imageStatus }),
    );
    // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
    const view = await detailMarkup();
    // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
    expect(view.querySelector('img')).toBeNull();
    // 검토: 화면 문구(view.textContent)에 '이미지 없음'가 포함되어야 한다.
    expect(view.textContent).toContain('이미지 없음');
    // 검토: 화면 문구(view.textContent)에 'AI 생성 이미지'가 포함되면 안 된다.
    expect(view.textContent).not.toContain('AI 생성 이미지');
  }
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ null, 'https://other.invalid/image.jpg', '//other.invalid/image.jpg', `/images/${'b'.repeat(64)}.jpg`, ]
  for (const imageUrl of [
    null,
    'https://other.invalid/image.jpg',
    '//other.invalid/image.jpg',
    `/images/${'b'.repeat(64)}.jpg`,
  ]) {
    // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...item,
        // 검토: 해당 기사 ID에 연결된 이미지 경로: imageUrl
        image_url: imageUrl,
        // 검토: 기사 원본 필드 묶음: { ...item.article, title: '<b>안내</b> &lt;script&gt;alert(1)&lt;/script&gt;', description: '&quot;확인&quot; <img src=x onerror=alert(1)>', originallink: 'javascript:alert(1)', pubDate: 'invalid-date', }
        article: {
          ...item.article,
          // 검토: 기사 제목 입력: '<b>안내</b> &lt;script&gt;alert(1)&lt;/script&gt;'
          title: '<b>안내</b> &lt;script&gt;alert(1)&lt;/script&gt;',
          // 검토: 기사 요약 입력: '&quot;확인&quot; <img src=x onerror=alert(1)>'
          description: '&quot;확인&quot; <img src=x onerror=alert(1)>',
          // 검토: 원문 URL 입력: 'javascript:alert(1)'
          originallink: 'javascript:alert(1)',
          // 검토: 기사 발행 시각 입력: 'invalid-date'
          pubDate: 'invalid-date',
        },
      }),
    );
    // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
    const view = await detailMarkup();
    // 검토: 상세 화면의 기사 제목의 기대값은 '안내 <script>alert(1)</script>'이다.
    expect(view.querySelector('h1')?.textContent).toBe(
      '안내 <script>alert(1)</script>',
    );
    // 검토: 화면 문구(view.textContent)에 '"확인"'가 포함되어야 한다.
    expect(view.textContent).toContain('"확인"');
    // 검토: 검사 대상 view.querySelector('script, img, b, time')가 없어야 한다.
    expect(view.querySelector('script, img, b, time')).toBeNull();
    // 검토: 해당 원문 URL의 링크가 존재해야 한다.
    expect(
      view.querySelector('a[href="https://portal.example.invalid/article"]'),
    ).not.toBeNull();
    // 검토: 검사 대상 view.querySelector('a[href^="javascript:"]')가 없어야 한다.
    expect(view.querySelector('a[href^="javascript:"]')).toBeNull();
    // 검토: 화면 문구(view.textContent)에 '발행 시각 미확인'가 포함되어야 한다.
    expect(view.textContent).toContain('발행 시각 미확인');
  }
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(
    Response.json({
      ...item,
      // 검토: 기사 원본 필드 묶음: { ...item.article, originallink: '//unsafe.invalid', link: 'data:text/html,unsafe', }
      article: {
        ...item.article,
        // 검토: 원문 URL 입력: '//unsafe.invalid'
        originallink: '//unsafe.invalid',
        // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: 'data:text/html,unsafe'
        link: 'data:text/html,unsafe',
      },
    }),
  );
  // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
  const view = await detailMarkup();
  // 검토: 화면 문구(view.textContent)에 '원문 링크 없음'가 포함되어야 한다.
  expect(view.textContent).toContain('원문 링크 없음');
  // 검토: 검사 대상 view.querySelector('a[href^="//"], a[href^="data:"]')가 없어야 한다.
  expect(view.querySelector('a[href^="//"], a[href^="data:"]')).toBeNull();
});
```

- [ ] articleDetailTimeout — 응답이 멈춘 단건 조회를 중단하고 오류를 표시한다.

```ts
// 검토: 끝나지 않는 조회를 제한 시간 안에 중단하고 다시 시도 안내를 표시하는지 확인한다.
test('articleDetailTimeout', async () => {
  // 검토: 실제 요청에 전달된 취소 신호를 저장해 타임아웃 후 aborted 상태를 검사한다.
  let signal: AbortSignal | null | undefined;
  // 검토: 응답이 끝나지 않고 요청의 abort 이벤트로만 거부되는 조회를 만들어 타임아웃을 검증한다.
  fetchMock.mockImplementationOnce((_input, init) => {
    // 검토: 테스트 동작을 수행한다: signal = init?.signal;
    signal = init?.signal;
    // 검토: 헬퍼가 후속 검사에 전달하는 결과다: new Promise<Response>((_resolve, reject) => { signal?.addEventListener( 'abort', () => reject(new DOMException('PRIVATE_DETAIL', 'AbortError')), { once: true }, ); })
    return new Promise<Response>((_resolve, reject) => {
      // 검토: 요청이 취소될 때만 가짜 조회를 거부해 실제 제한 시간 처리를 드러낸다.
      signal?.addEventListener(
        'abort',
        () => reject(new DOMException('PRIVATE_DETAIL', 'AbortError')),
        { once: true },
      );
    });
  });
  // 검토: 제품이 끝나지 않아도 테스트가 7초 뒤 실패하도록 별도 타이머를 관리한다.
  let deadline: ReturnType<typeof setTimeout> | undefined;
  // 검토: 정상·실패 어느 경우든 타이머 정리가 실행되도록 검사한다.
  try {
    // 검토: 이 단계의 검증에 사용할 result 값을 준비한다: const result = await Promise.race([ detailMarkup(), new Promise<null>((resolve) => { deadline = setTimeout(() => resolve(null), 7000); }), ])
    const result = await Promise.race([
      detailMarkup(),
      new Promise<null>((resolve) => {
        // 검토: 테스트 동작을 수행한다: deadline = setTimeout(() => resolve(null), 7000);
        deadline = setTimeout(() => resolve(null), 7000);
      }),
    ]);
    // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: result. 없으면 즉시 실패한다.
    assert(result);
    // 검토: 화면의 오류 안내에 '기사를 불러오지 못했어요'가 포함되어야 한다.
    expect(result.querySelector('[role="alert"]')?.textContent).toContain(
      '기사를 불러오지 못했어요',
    );
    // 검토: 화면 문구(result.textContent)에 'PRIVATE_DETAIL'가 포함되면 안 된다.
    expect(result.textContent).not.toContain('PRIVATE_DETAIL');
    // 검토: 조회 중단 신호의 취소 상태의 기대값은 true이다.
    expect(signal?.aborted).toBe(true);
  } finally {
    // 검토: 테스트가 만든 제한 시간 타이머를 정리한다.
    clearTimeout(deadline);
  }
}, 10000);
```

- [ ] articleDetailImageFailure — 상세 이미지 로딩 실패 후에도 제목·요약·원문·공유가 남는다.

```ts
// 검토: 이미지 오류가 발생해도 기사 내용·원문·공유 조작을 유지하는지 확인한다.
test('articleDetailImageFailure', async () => {
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(Response.json(item));
  // 검토: 실제 상세 페이지를 직접 호출해 렌더할 React 트리를 얻는다.
  const tree = await detailTree();
  // 검토: 실제 페이지 또는 목록 컴포넌트를 DOM에 렌더하고 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => root.render(tree));
  // 검토: 이 단계의 검증에 사용할 image 값을 준비한다: const image = container.querySelector('img')
  const image = container.querySelector('img');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: image. 없으면 즉시 실패한다.
  assert(image);
  // 검토: 이미지 로딩 오류 이벤트를 발생시킨다. 실제 이미지 다운로드나 시각적 품질은 이 검사 범위가 아니다.
  await act(async () => image.dispatchEvent(new Event('error')));
  // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
  expect(container.querySelector('img')).toBeNull();
  // 검토: 화면 문구(container.textContent)에 '이미지 없음'가 포함되어야 한다.
  expect(container.textContent).toContain('이미지 없음');
  // 검토: 화면 문구(container.textContent)에 'AI 생성 이미지'가 포함되면 안 된다.
  expect(container.textContent).not.toContain('AI 생성 이미지');
  // 검토: 상세 화면의 기사 제목의 기대값은 '교통 안내 & 점검'이다.
  expect(container.querySelector('h1')?.textContent).toBe('교통 안내 & 점검');
  // 검토: 화면 문구(container.textContent)에 item.article.description가 포함되어야 한다.
  expect(container.textContent).toContain(item.article.description);
  // 검토: 해당 원문 URL의 링크가 존재해야 한다.
  expect(
    container.querySelector(
      'a[href="https://publisher.example.invalid/article"]',
    ),
  ).not.toBeNull();
  // 검토: 화면 문구(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('공유'), ),)의 기대값은 true이다.
  expect(
    Array.from(container.querySelectorAll('button')).some((button) =>
      button.textContent?.includes('공유'),
    ),
  ).toBe(true);
});
```

- [ ] articleDetailShareUrl — 직접 상세 URL을 공유·복사하고 취소·실패를 구분한다.

```ts
// 검토: 정확한 상세 URL 공유, 취소, 복사 완료 시점, 복사 실패 대체를 확인한다.
test('articleDetailShareUrl', async () => {
  // 검토: 추적 쿼리와 해시가 있는 상세 주소로 설정한다. 공유 URL에서 이 둘이 제거되는지 검증한다.
  window.history.replaceState(
    null,
    '',
    `/incidents/${id}?tracking=test#summary`,
  );
  // 검토: 성공하는 기본 공유 API 대체 함수를 준비한다.
  const share = vi.fn().mockResolvedValue(undefined);
  // 검토: 성공하는 클립보드 API 대체 함수를 준비하며 뒤에서 실패·보류 사례도 설정한다.
  const writeText = vi.fn().mockResolvedValue(undefined);
  // 검토: 실제 OS 공유창과 클립보드를 가짜 인터페이스로 대체한다. 아래에 없는 기능은 미지원 브라우저 상황이다.
  vi.stubGlobal('navigator', { share, clipboard: { writeText } });
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(Response.json(item));
  // 검토: 실제 상세 페이지를 직접 호출해 렌더할 React 트리를 얻는다.
  const tree = await detailTree();
  // 검토: 실제 페이지 또는 목록 컴포넌트를 DOM에 렌더하고 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => root.render(tree));
  // 검토: 이 단계의 검증에 사용할 button 값을 준비한다: const button = Array.from(container.querySelectorAll('button')).find( (entry) => entry.textContent?.includes('공유'), )
  const button = Array.from(container.querySelectorAll('button')).find(
    (entry) => entry.textContent?.includes('공유'),
  );
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: button. 없으면 즉시 실패한다.
  assert(button);
  // 검토: 현재 웹앱의 origin과 기사 ID로 공유 URL을 만든다. 추적 쿼리·해시·API 주소·원문 주소는 포함하지 않는다.
  const url = `${window.location.origin}/incidents/${id}`;
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 브라우저 기본 공유 대체 함수를 정확히 한 번 호출하며 전달값은 expect.objectContaining({ title: '교통 안내 & 점검', url })이어야 한다.
  expect(share).toHaveBeenCalledExactlyOnceWith(
    // 검토: 기사 제목 입력: '교통 안내 & 점검'
    expect.objectContaining({ title: '교통 안내 & 점검', url }),
  );
  // 검토: 클립보드 쓰기 대체 함수가 호출되지 않아야 한다.
  expect(writeText).not.toHaveBeenCalled();
  // 검토: 사용자가 기본 공유창을 취소한 상황을 재현한다. 자동 복사가 일어나면 안 된다.
  share.mockRejectedValueOnce(new DOMException('user canceled', 'AbortError'));
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 클립보드 쓰기 대체 함수가 호출되지 않아야 한다.
  expect(writeText).not.toHaveBeenCalled();
  // 검토: 화면의 오류 안내가 없어야 한다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 기본 공유 기능의 일반 오류를 재현해 링크 복사로 이어지는지 확인한다.
  share.mockRejectedValueOnce(new Error('PRIVATE_SHARE_FAILURE'));
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 클립보드 쓰기 대체 함수의 마지막 호출이 url를 전달했는지 확인한다.
  expect(writeText).toHaveBeenLastCalledWith(url);
  // 검토: 화면의 상태 안내에 '링크를 복사했어요'가 포함되어야 한다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '링크를 복사했어요',
  );
  // 검토: 이후 검증에 앞선 호출 기록이나 예약된 가짜 응답이 섞이지 않게 정리한다.
  writeText.mockClear();
  // 검토: 실제 OS 공유창과 클립보드를 가짜 인터페이스로 대체한다. 아래에 없는 기능은 미지원 브라우저 상황이다.
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  // 검토: 나중에 미완료 클립보드 Promise를 성공시킬 함수를 보관한다.
  let completeCopy = () => {};
  // 검토: 클립보드 저장을 미완료 상태로 두어 완료 안내가 너무 일찍 나타나지 않는지 검사한다.
  writeText.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        // 검토: 클립보드 성공 시점을 테스트가 나중에 결정할 수 있도록 완료 함수를 보관한다.
        completeCopy = resolve;
      }),
  );
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 클립보드 쓰기 대체 함수를 정확히 한 번 호출하며 전달값은 url이어야 한다.
  expect(writeText).toHaveBeenCalledExactlyOnceWith(url);
  // 검토: 화면 문구(container.textContent)에 '링크를 복사했어요'가 포함되면 안 된다.
  expect(container.textContent).not.toContain('링크를 복사했어요');
  // 검토: 보류한 클립보드 저장을 성공 처리하고 완료 안내가 이후에 나타나는지 검사한다.
  await act(async () => completeCopy());
  // 검토: 화면의 상태 안내에 '링크를 복사했어요'가 포함되어야 한다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '링크를 복사했어요',
  );
  // 검토: 클립보드 저장 실패를 재현해 직접 복사할 URL 제공을 검증한다.
  writeText.mockRejectedValueOnce(new Error('PRIVATE_CLIPBOARD_FAILURE'));
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 복사 실패 후 사용자가 직접 복사할 URL 입력칸을 찾는다.
  const manual = container.querySelector('input[aria-label="공유 링크"]');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: manual instanceof HTMLInputElement. 없으면 즉시 실패한다.
  assert(manual instanceof HTMLInputElement);
  // 검토: 수동 복사 입력칸의 URL의 기대값은 url이다.
  expect(manual.value).toBe(url);
  // 검토: 수동 복사 입력칸의 읽기 전용 상태의 기대값은 true이다.
  expect(manual.readOnly).toBe(true);
  // 검토: 화면 문구(container.textContent)가 /PRIVATE_|링크를 복사했어요/ 패턴에 맞으면 안 된다.
  expect(container.textContent).not.toMatch(/PRIVATE_|링크를 복사했어요/);
  // 검토: 실제 OS 공유창과 클립보드를 가짜 인터페이스로 대체한다. 아래에 없는 기능은 미지원 브라우저 상황이다.
  vi.stubGlobal('navigator', {});
  // 검토: 실제 공유 버튼의 클릭 핸들러를 실행하고 React 업데이트를 반영한다.
  await act(async () => button.click());
  // 검토: 검사 대상 container.querySelector('input[aria-label="공유 링크"]'),가 존재해야 한다.
  expect(
    container.querySelector('input[aria-label="공유 링크"]'),
  ).not.toBeNull();
  // 검토: 뉴스 조회 대체 함수가 정확히 1번 호출되어야 한다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] articleDetailLinksFromListAndSearch — 목록·검색 카드 제목은 내부 상세로, 원문은 외부 기사로 연결한다.

```ts
// 검토: 목록·검색 제목의 상세 링크, 별도 원문 링크, 중복 제거와 키워드 전달을 함께 확인한다.
test('articleDetailLinksFromListAndSearch', async () => {
  // 검토: 이 단계의 검증에 사용할 { default: IncidentsPage } 값을 준비한다: const { default: IncidentsPage } = await import('./page')
  const { default: IncidentsPage } = await import('./page');
  // 검토: 이 단계의 검증에 사용할 { default: SearchPage } 값을 준비한다: const { default: SearchPage } = await import('../search/page')
  const { default: SearchPage } = await import('../search/page');
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ () => IncidentsPage(), () => SearchPage({ searchParams: Promise.resolve({ q: ' 도로 점검 ' }) }), ]
  for (const page of [
    () => IncidentsPage(),
    () => SearchPage({ searchParams: Promise.resolve({ q: '  도로 점검  ' }) }),
  ]) {
    // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
    fetchMock.mockResolvedValueOnce(
      // 검토: 서버가 반환한 총 개수: 2
      Response.json({ total: 2, items: [item, item] }),
    );
    // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
    const view = document.createElement('div');
    // 검토: 페이지의 원본 SSR HTML을 보관한다. 브라우저 파서가 중첩 링크를 고치기 전에 검사한다.
    const html = renderToStaticMarkup(await page());
    // 검토: 서버가 만든 HTML(html)가 /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/ 패턴에 맞으면 안 된다.
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
    // 검토: 서버가 반환한 HTML을 검사용 DOM으로 읽는다. HTML 파서가 구조를 정리하므로 중첩 링크는 원본 문자열에서도 별도로 검사한다.
    view.innerHTML = html;
    // 검토: 화면의 기사 카드 수의 개수는 1이어야 한다.
    expect(view.querySelectorAll('article')).toHaveLength(1);
    // 검토: 이 단계의 검증에 사용할 title 값을 준비한다: const title = view.querySelector('article h2')
    const title = view.querySelector('article h2');
    // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: title. 없으면 즉시 실패한다.
    assert(title);
    // 검토: 제목 안쪽 또는 제목을 감싼 링크를 찾아 접근 가능한 상세 진입을 검사한다.
    const detailLink = title.querySelector('a') ?? title.closest('a');
    // 검토: 기사 제목에 연결된 내부 상세 링크의 기대값은 `/incidents/${id}`이다.
    expect(detailLink?.getAttribute('href')).toBe(`/incidents/${id}`);
    // 검토: 기사 제목에 연결된 내부 상세 링크에 '교통 안내 & 점검'가 포함되어야 한다.
    expect(detailLink?.textContent).toContain('교통 안내 & 점검');
    // 검토: 해당 원문 URL의 링크의 기대값은 '기사 원문'이다.
    expect(
      view.querySelector(
        'article a[href="https://publisher.example.invalid/article"]',
      )?.textContent,
    ).toBe('기사 원문');
  }
  // 검토: 뉴스 조회 대체 함수가 정확히 2번 호출되어야 한다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 이 단계의 검증에 사용할 [input] 값을 준비한다: const [input] = fetchMock.mock.calls[1]
  const [input] = fetchMock.mock.calls[1];
  // 검토: 기록된 API 요청 URL을 파싱해 대상 경로 또는 검색 파라미터를 검사한다.
  const url = new URL(input instanceof Request ? input.url : String(input));
  // 검토: 서버 요청에 전달된 검색 키워드의 기대값은 '도로 점검'이다.
  expect(url.searchParams.get('keyword')).toBe('도로 점검');
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(
    Response.json({
      // 검토: 서버가 반환한 총 개수: 1
      total: 1,
      // 검토: 서버가 반환할 기사 배열: [ { ...item, article: { ...item.article, originallink: 'javascript:alert(1)', link: '/unsafe-relative', }, }, ]
      items: [
        {
          ...item,
          // 검토: 기사 원본 필드 묶음: { ...item.article, originallink: 'javascript:alert(1)', link: '/unsafe-relative', }
          article: {
            ...item.article,
            // 검토: 원문 URL 입력: 'javascript:alert(1)'
            originallink: 'javascript:alert(1)',
            // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: '/unsafe-relative'
            link: '/unsafe-relative',
          },
        },
      ],
    }),
  );
  // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
  const view = document.createElement('div');
  // 검토: 서버가 반환한 HTML을 검사용 DOM으로 읽는다. HTML 파서가 구조를 정리하므로 중첩 링크는 원본 문자열에서도 별도로 검사한다.
  view.innerHTML = renderToStaticMarkup(await IncidentsPage());
  // 검토: 이 단계의 검증에 사용할 title 값을 준비한다: const title = view.querySelector('article h2')
  const title = view.querySelector('article h2');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: title. 없으면 즉시 실패한다.
  assert(title);
  // 검토: 제목 안쪽 또는 제목을 감싼 링크를 찾아 접근 가능한 상세 진입을 검사한다.
  const detailLink = title.querySelector('a') ?? title.closest('a');
  // 검토: 기사 제목에 연결된 내부 상세 링크의 기대값은 `/incidents/${id}`이다.
  expect(detailLink?.getAttribute('href')).toBe(`/incidents/${id}`);
  // 검토: 화면 문구(view.textContent)에 '원문 링크 없음'가 포함되어야 한다.
  expect(view.textContent).toContain('원문 링크 없음');
  // 검토: 검사 대상 view.querySelector('a[href^="javascript:"], a[href="/unsafe-relative"]'),가 없어야 한다.
  expect(
    view.querySelector('a[href^="javascript:"], a[href="/unsafe-relative"]'),
  ).toBeNull();
  // 검토: 뉴스 조회 대체 함수가 정확히 3번 호출되어야 한다.
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
```

- [ ] articleDetailRouteBoundaries — 상세 로딩과 기사 없음 화면은 서로 다른 안내와 복귀 경로를 제공한다.

```ts
// 검토: 실제 상세 경로의 로딩·기사 없음 진입점을 찾아 각 안내와 복귀 링크를 확인한다.
test('articleDetailRouteBoundaries', async () => {
  // 검토: 이 단계의 검증에 사용할 { createElement } 값을 준비한다: const { createElement } = await import('react')
  const { createElement } = await import('react');
  // 검토: 실제 상세 경로의 loading/not-found 파일을 탐색한다. 파일 부재는 명시적인 검증 실패가 된다.
  const routes = import.meta.glob('./[[]id]/{loading,not-found}.tsx');
  // 검토: 가져온 모듈에 렌더 가능한 default 함수가 있는지 타입과 실행 전제를 확인한다.
  function isRoute(value: unknown): value is { default: () => ReactNode } {
    // 검토: 헬퍼가 후속 검사에 전달하는 결과다: ( value !== null && typeof value === 'object' && 'default' in value && typeof value.default === 'function' )
    return (
      value !== null &&
      typeof value === 'object' &&
      'default' in value &&
      typeof value.default === 'function'
    );
  }
  // 검토: 이 단계의 검증에 사용할 loading 값을 준비한다: const loading = routes['./[id]/loading.tsx']
  const loading = routes['./[id]/loading.tsx'];
  // 검토: 이 단계의 검증에 사용할 notFound 값을 준비한다: const notFound = routes['./[id]/not-found.tsx']
  const notFound = routes['./[id]/not-found.tsx'];
  // 검토: 검사 대상 loading의 타입이 'function'인지 확인해 실제 라우트 모듈이 있는지 검사한다.
  expect(loading).toBeTypeOf('function');
  // 검토: 검사 대상 notFound의 타입이 'function'인지 확인해 실제 라우트 모듈이 있는지 검사한다.
  expect(notFound).toBeTypeOf('function');
  // 검토: 화면 결과를 검사할 DOM 컨테이너를 준비하거나 렌더 결과를 받는다.
  const view = document.createElement('div');
  // 검토: 이 단계의 검증에 사용할 loadingModule 값을 준비한다: const loadingModule = await loading()
  const loadingModule = await loading();
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: isRoute(loadingModule). 없으면 즉시 실패한다.
  assert(isRoute(loadingModule));
  // 검토: 서버가 반환한 HTML을 검사용 DOM으로 읽는다. HTML 파서가 구조를 정리하므로 중첩 링크는 원본 문자열에서도 별도로 검사한다.
  view.innerHTML = renderToStaticMarkup(createElement(loadingModule.default));
  // 검토: 화면의 상태 안내에 '기사를 불러오는 중'가 포함되어야 한다.
  expect(
    view.querySelector('[role="status"][aria-busy="true"]')?.textContent,
  ).toContain('기사를 불러오는 중');
  // 검토: 화면 문구(view.textContent)에 '기사를 찾을 수 없어요'가 포함되면 안 된다.
  expect(view.textContent).not.toContain('기사를 찾을 수 없어요');
  // 검토: 이 단계의 검증에 사용할 notFoundModule 값을 준비한다: const notFoundModule = await notFound()
  const notFoundModule = await notFound();
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: isRoute(notFoundModule). 없으면 즉시 실패한다.
  assert(isRoute(notFoundModule));
  // 검토: 서버가 반환한 HTML을 검사용 DOM으로 읽는다. HTML 파서가 구조를 정리하므로 중첩 링크는 원본 문자열에서도 별도로 검사한다.
  view.innerHTML = renderToStaticMarkup(createElement(notFoundModule.default));
  // 검토: 화면 문구(view.textContent)에 '기사를 찾을 수 없어요'가 포함되어야 한다.
  expect(view.textContent).toContain('기사를 찾을 수 없어요');
  // 검토: 검사 대상 view.querySelector('a[href="/incidents"]')가 존재해야 한다.
  expect(view.querySelector('a[href="/incidents"]')).not.toBeNull();
  // 검토: 검사 대상 view.querySelector('[aria-busy="true"]')가 없어야 한다.
  expect(view.querySelector('[aria-busy="true"]')).toBeNull();
  // 검토: 뉴스 조회 대체 함수가 호출되지 않아야 한다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 기존 테스트 대체 제안

실제 파일은 변경하지 않았다. 아래 네 본문만 대체하며 공유 헤더·그 밖의 기존 테스트는 유지한다. 상세 링크가 없어야 한다는 오래된 조건은 제거하고, 링크 존재는 신규 `articleDetailLinksFromListAndSearch`에서 확인한다. 안전하지 않은 원문을 가진 카드에는 정확한 내부 상세 링크만 허용한다. 네 대체안은 현재 구현에서도 통과하는 호환성 변경이며 신규 기능 테스트로 중복 등록하지 않는다.

## src/app/incidents/article-list-api.test.ts

### 기존 공유 헤더 — 변경 없음

```ts
// file: src/app/incidents/article-list-api.test.ts
// 검토: 검증·가짜 응답·환경 복구 도구를 사용한다. 외부 API는 테스트에서 실제 호출하지 않는다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 실제 React 렌더와 이벤트 업데이트를 검증하기 위한 도구·타입을 사용한다.
import { createElement, type ComponentType } from 'react';
// 검토: 서버 페이지의 반환값을 HTML로 렌더해 내용과 링크를 검사한다.
import { renderToStaticMarkup } from 'react-dom/server';

// 검토: 이 단계의 검증에 사용할 loadingRoutes 값을 준비한다: const loadingRoutes = import.meta.glob('./loading.tsx')
const loadingRoutes = import.meta.glob('./loading.tsx');
// 검토: 실제 API가 아닌 example.invalid 주소를 사용한다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 이 단계의 검증에 사용할 idA 값을 준비한다: const idA = 'e77553113fe8862b91aec1fd09a25af83e256ac12cb4a8ff7d8d78ea3050c909'
const idA = 'e77553113fe8862b91aec1fd09a25af83e256ac12cb4a8ff7d8d78ea3050c909';
// 검토: 이 단계의 검증에 사용할 idB 값을 준비한다: const idB = '6dd70b87676f579839c940ae6048bc6bf65d2005e1552c515b9a0151500b621a'
const idB = '6dd70b87676f579839c940ae6048bc6bf65d2005e1552c515b9a0151500b621a';
// 검토: 서버 응답 형식의 가짜 기사를 정의한다. 제목 태그·한국 시간·AI 이미지의 표시 규칙을 확인하는 입력이다.
const item = {
  // 검토: 가짜 수집 묶음 ID: '20261004T030000000000Z_00000000000000000000000000000000'
  collection_id: '20261004T030000000000Z_00000000000000000000000000000000',
  // 검토: 기사 고유 ID: idA
  article_id: idA,
  // 검토: 기사 원본 필드 묶음: { title: '샘플: <b>교통</b> 안내 &amp; 점검', originallink: 'https://example.invalid/news/a', link: 'https://portal.example.invalid/news/a', description: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;', pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900', }
  article: {
    // 검토: 기사 제목 입력: '샘플: <b>교통</b> 안내 &amp; 점검'
    title: '샘플: <b>교통</b> 안내 &amp; 점검',
    // 검토: 원문 URL 입력: 'https://example.invalid/news/a'
    originallink: 'https://example.invalid/news/a',
    // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: 'https://portal.example.invalid/news/a'
    link: 'https://portal.example.invalid/news/a',
    // 검토: 기사 요약 입력: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;'
    description: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;',
    // 검토: 기사 발행 시각 입력: 'Thu, 17 Sep 2026 09:00:00 +0900'
    pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900',
  },
  // 검토: 서버의 이미지 준비 상태: 'disabled'
  image_status: 'disabled',
  // 검토: 해당 기사 ID에 연결된 이미지 경로: null
  image_url: null,
};
// 검토: 외부 뉴스 API 대신 호출 횟수·요청·응답을 기록하는 가짜 fetch를 만든다.
const fetchMock = vi.fn<typeof fetch>();

// 검토: 각 테스트 전에 환경과 DOM을 새로 준비해 이전 테스트 상태가 섞이지 않게 한다.
beforeEach(() => {
  // 검토: 이 경우의 서버 주소 환경변수를 설정한다. 잘못된 주소 사례는 네트워크 요청 전에 거절돼야 한다.
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  // 검토: 현재 테스트에만 전역 값을 대체한다. 실제 API 호출과 React 업데이트를 통제하며 종료 시 복구한다.
  vi.stubGlobal('fetch', fetchMock);
});

// 검토: 각 테스트 후 DOM·가짜 함수·환경변수·전역 객체를 복원한다.
afterEach(() => {
  // 검토: 이후 검증에 앞선 호출 기록이나 예약된 가짜 응답이 섞이지 않게 정리한다.
  fetchMock.mockReset();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.unstubAllGlobals();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.unstubAllEnvs();
});

// 검토: 기존 목록 API 응답을 구성하는 공유 헬퍼다. 응답 total은 기본적으로 입력 항목 수다.
function respond(items: unknown[], total = items.length) {
  // 검토: 다음 뉴스 조회 한 번에 아래 응답을 반환한다. 네트워크·운영 데이터 품질은 이 테스트가 대신 검증하지 않는다.
  fetchMock.mockResolvedValueOnce(Response.json({ total, items }));
}

// 검토: 기존 사건 목록 서버 페이지를 호출해 HTML을 받는다.
async function renderPage() {
  // 검토: 기존 페이지 모듈을 다시 읽어 테스트별 환경 설정을 반영한다.
  vi.resetModules();
  // 검토: 이 단계의 검증에 사용할 { default: IncidentsPage } 값을 준비한다: const { default: IncidentsPage } = await import('./page')
  const { default: IncidentsPage } = await import('./page');
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: renderToStaticMarkup(await IncidentsPage())
  return renderToStaticMarkup(await IncidentsPage());
}

// 검토: 렌더된 article 태그를 추출하는 기존 공유 헬퍼다.
function cards(html: string): string[] {
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? []
  return html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
}

// 검토: 결과가 정확히 한 카드일 때 해당 카드의 HTML을 반환한다.
function singleCard(html: string) {
  // 검토: 이 단계의 검증에 사용할 rows 값을 준비한다: const rows = cards(html)
  const rows = cards(html);
  // 검토: 검사 대상 rows의 개수는 1이어야 한다.
  expect(rows).toHaveLength(1);
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: rows[0]
  return rows[0];
}

// 검토: 기존 HTML의 status 또는 alert 영역을 찾아 검사한다.
function readRole(html: string, role: 'status' | 'alert') {
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: html.match( new RegExp( `<([a-z][a-z0-9]*)\\b([^>]*\\brole="${role}"[^>]*)>([\\s\\S]*?)<\\/\\1>`, ), )
  return html.match(
    new RegExp(
      `<([a-z][a-z0-9]*)\\b([^>]*\\brole="${role}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    ),
  );
}

// 검토: 기존 로딩 모듈의 default export가 컴포넌트 함수인지 검사한다.
function isLoadingModule(value: unknown): value is { default: ComponentType } {
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: ( value !== null && typeof value === 'object' && 'default' in value && typeof value.default === 'function' )
  return (
    value !== null &&
    typeof value === 'object' &&
    'default' in value &&
    typeof value.default === 'function'
  );
}

// 검토: 기존 목록 조회 실패 안내·재시도·빈 결과와의 구별을 검증한다.
function expectError(html: string) {
  // 검토: 이 단계의 검증에 사용할 alert 값을 준비한다: const alert = readRole(html, 'alert')
  const alert = readRole(html, 'alert');
  // 검토: 검사 대상 alert가 존재해야 한다.
  expect(alert).not.toBeNull();
  // 검토: 검사 대상 alert?.[3]에 '기사를 불러오지 못했어요'가 포함되어야 한다.
  expect(alert?.[3]).toContain('기사를 불러오지 못했어요');
  // 검토: 검사 대상 alert?.[3]에 '다시 시도'가 포함되어야 한다.
  expect(alert?.[3]).toContain('다시 시도');
  // 검토: 검사 대상 alert?.[3]에 'href="/incidents"'가 포함되어야 한다.
  expect(alert?.[3]).toContain('href="/incidents"');
  // 검토: 서버가 만든 HTML(html)에 '아직 수집된 기사가 없어요'가 포함되면 안 된다.
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  // 검토: 검사 대상 cards(html)의 개수는 0이어야 한다.
  expect(cards(html)).toHaveLength(0);
}

```

### articleCardsIdentityAndPublication — 대체 본문

```ts
// 검토: 기존 중복 제거·내용·출처·발행 시각 검증을 유지한다. 상세 링크 존재는 신규 진입 테스트가 담당한다.
test('articleCardsIdentityAndPublication', async () => {
  // 검토: 기존 목록 API의 가짜 응답에 아래 기사들을 넣는다. 입력 순서와 중복 기사를 그대로 유지한다.
  respond(
    [
      item,
      {
        ...item,
        // 검토: 기사 고유 ID: idB
        article_id: idB,
        // 검토: 기사 원본 필드 묶음: { ...item.article, originallink: 'https://example.invalid/news/b', pubDate: 'Fri, 18 Sep 2099 12:00:00 +0900', }
        article: {
          ...item.article,
          // 검토: 원문 URL 입력: 'https://example.invalid/news/b'
          originallink: 'https://example.invalid/news/b',
          // 검토: 기사 발행 시각 입력: 'Fri, 18 Sep 2099 12:00:00 +0900'
          pubDate: 'Fri, 18 Sep 2099 12:00:00 +0900',
        },
      },
      {
        ...item,
        // 검토: 가짜 수집 묶음 ID: 'older-collection'
        collection_id: 'older-collection',
        // 검토: 기사 원본 필드 묶음: { ...item.article, title: '오래된 중복 제목' }
        article: { ...item.article, title: '오래된 중복 제목' },
      },
    ],
    987654,
  );
  // 검토: 페이지의 원본 SSR HTML을 보관한다. 브라우저 파서가 중첩 링크를 고치기 전에 검사한다.
  const html = await renderPage();
  // 검토: 이 단계의 검증에 사용할 rows 값을 준비한다: const rows = cards(html)
  const rows = cards(html);
  // 검토: 서버가 만든 HTML(html)에 '사건 목록'가 포함되어야 한다.
  expect(html).toContain('사건 목록');
  // 검토: 검사 대상 rows의 개수는 2이어야 한다.
  expect(rows).toHaveLength(2);
  // 검토: 서버가 만든 HTML(rows[0])에 '샘플: 교통 안내 &amp; 점검'가 포함되어야 한다.
  expect(rows[0]).toContain('샘플: 교통 안내 &amp; 점검');
  // 검토: 서버가 만든 HTML(rows[1])에 '샘플: 교통 안내 &amp; 점검'가 포함되어야 한다.
  expect(rows[1]).toContain('샘플: 교통 안내 &amp; 점검');
  // 검토: 서버가 만든 HTML(rows[0])에 '가상 &quot;안내&quot; &#x27;검증&#x27; 가'가 포함되어야 한다.
  expect(rows[0]).toContain('가상 &quot;안내&quot; &#x27;검증&#x27; 가');
  // 검토: 서버가 만든 HTML(rows[0])에 'href="https://example.invalid/news/a"'가 포함되어야 한다.
  expect(rows[0]).toContain('href="https://example.invalid/news/a"');
  // 검토: 서버가 만든 HTML(rows[1])에 'href="https://example.invalid/news/b"'가 포함되어야 한다.
  expect(rows[1]).toContain('href="https://example.invalid/news/b"');
  // 검토: 서버가 만든 HTML(rows[0])에 '기사 발행'가 포함되어야 한다.
  expect(rows[0]).toContain('기사 발행');
  // 검토: 서버가 만든 HTML(rows[0])에 'dateTime="2026-09-17T00:00:00.000Z"'가 포함되어야 한다.
  expect(rows[0]).toContain('dateTime="2026-09-17T00:00:00.000Z"');
  // 검토: 서버가 만든 HTML(rows[0])에 '2026-09-17 09:00 KST'가 포함되어야 한다.
  expect(rows[0]).toContain('2026-09-17 09:00 KST');
  // 검토: 서버가 만든 HTML(rows[1])에 '2099-09-18 12:00 KST'가 포함되어야 한다.
  expect(rows[1]).toContain('2099-09-18 12:00 KST');
  // 검토: 서버가 만든 HTML(html)에 '987654'가 포함되면 안 된다.
  expect(html).not.toContain('987654');
  // 검토: 서버가 만든 HTML(html)에 '987,654'가 포함되면 안 된다.
  expect(html).not.toContain('987,654');
  // 검토: 서버가 만든 HTML(html)에 '오래된 중복 제목'가 포함되면 안 된다.
  expect(html).not.toContain('오래된 중복 제목');
  // 검토: 서버가 만든 HTML(html)가 /data-category|data-status|📍|진행 중|발생 시각|전체 사건/ 패턴에 맞으면 안 된다.
  expect(html).not.toMatch(
    /data-category|data-status|📍|진행 중|발생 시각|전체 사건/,
  );
  // 검토: 서버가 만든 HTML(html)가 /<header\b|<nav\b/ 패턴에 맞으면 안 된다.
  expect(html).not.toMatch(/<header\b|<nav\b/);
});

```

### articleTextAndSourceSafety — 대체 본문

```ts
// 검토: 기존 텍스트·위험한 원문 URL 차단을 유지하며, 정확한 내부 상세 링크만 예외로 허용한다.
test('articleTextAndSourceSafety', async () => {
  // 검토: 아래 입력을 하나씩 독립적으로 확인한다: [ 'javascript:alert(1)', 'data:text/html,test', '/relative', '//other.invalid/a', 'https://user:password@example.invalid/a', ]
  for (const unsafe of [
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative',
    '//other.invalid/a',
    'https://user:password@example.invalid/a',
  ]) {
    // 검토: 기존 목록 API의 가짜 응답에 아래 기사들을 넣는다. 입력 순서와 중복 기사를 그대로 유지한다.
    respond([
      {
        ...item,
        // 검토: 기사 원본 필드 묶음: { ...item.article, title: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;', description: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;', originallink: unsafe, link: 'https://portal.example.invalid/fallback', pubDate: 'invalid-date', }
        article: {
          ...item.article,
          // 검토: 기사 제목 입력: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;'
          title: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;',
          // 검토: 기사 요약 입력: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;'
          description: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;',
          // 검토: 원문 URL 입력: unsafe
          originallink: unsafe,
          // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: 'https://portal.example.invalid/fallback'
          link: 'https://portal.example.invalid/fallback',
          // 검토: 기사 발행 시각 입력: 'invalid-date'
          pubDate: 'invalid-date',
        },
      },
    ]);
    // 검토: 이 단계의 검증에 사용할 row 값을 준비한다: const row = singleCard(await renderPage())
    const row = singleCard(await renderPage());
    // 검토: 서버가 만든 HTML(row)에 '태그 강조 &lt;img src=x onerror=alert(1)&gt;'가 포함되어야 한다.
    expect(row).toContain('태그 강조 &lt;img src=x onerror=alert(1)&gt;');
    // 검토: 서버가 만든 HTML(row)에 '&#x27;인용&#x27;'가 포함되어야 한다.
    expect(row).toContain('&#x27;인용&#x27;');
    // 검토: 서버가 만든 HTML(row)에 '📰'가 포함되어야 한다.
    expect(row).toContain('📰');
    // 검토: 서버가 만든 HTML(row)에 '&amp;#x110000;'가 포함되어야 한다.
    expect(row).toContain('&amp;#x110000;');
    // 검토: 서버가 만든 HTML(row)에 '&amp;#xD800;'가 포함되어야 한다.
    expect(row).toContain('&amp;#xD800;');
    // 검토: 서버가 만든 HTML(row)에 'href="https://portal.example.invalid/fallback"'가 포함되어야 한다.
    expect(row).toContain('href="https://portal.example.invalid/fallback"');
    // 검토: 서버가 만든 HTML(row)에 '기사 원문'가 포함되어야 한다.
    expect(row).toContain('기사 원문');
    // 검토: 서버가 만든 HTML(row)에 '발행 시각 미확인'가 포함되어야 한다.
    expect(row).toContain('발행 시각 미확인');
    // 검토: 서버가 만든 HTML(row)가 /<img\b|<b\b|<script\b|<time\b/ 패턴에 맞으면 안 된다.
    expect(row).not.toMatch(/<img\b|<b\b|<script\b|<time\b/);
    // 검토: 기존 목록 API의 가짜 응답에 아래 기사들을 넣는다. 입력 순서와 중복 기사를 그대로 유지한다.
    respond([
      {
        ...item,
        // 검토: 기사 원본 필드 묶음: { ...item.article, originallink: unsafe, link: unsafe }
        article: { ...item.article, originallink: unsafe, link: unsafe },
      },
    ]);
    // 검토: 이 단계의 검증에 사용할 unlinked 값을 준비한다: const unlinked = singleCard(await renderPage())
    const unlinked = singleCard(await renderPage());
    // 검토: 서버가 만든 HTML(unlinked)에 '샘플: 교통 안내'가 포함되어야 한다.
    expect(unlinked).toContain('샘플: 교통 안내');
    // 검토: 서버가 만든 HTML(unlinked)에 '원문 링크 없음'가 포함되어야 한다.
    expect(unlinked).toContain('원문 링크 없음');
    // 검토: 아래 입력을 하나씩 독립적으로 확인한다: unlinked.match(/<a\b[^>]*>/g) ?? []
    for (const anchor of unlinked.match(/<a\b[^>]*>/g) ?? []) {
      // 검토: 원문이 없는 카드에 포함된 각 링크 시작 태그가 new RegExp(`\\shref="/incidents/${idA}"(?:\\s|>)`) 패턴에 맞아야 한다.
      expect(anchor).toMatch(
        new RegExp(`\\shref="/incidents/${idA}"(?:\\s|>)`),
      );
    }
  }
});

```

## src/features/article-list/ui/article-list/article-list.test.ts

### 기존 공유 헤더 — 변경 없음

```ts
// file: src/features/article-list/ui/article-list/article-list.test.ts
// @vitest-environment jsdom
// 검토: 검증·가짜 응답·환경 복구 도구를 사용한다. 외부 API는 테스트에서 실제 호출하지 않는다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 실제 React 렌더와 이벤트 업데이트를 검증하기 위한 도구·타입을 사용한다.
import { act, createElement } from 'react';
// 검토: 브라우저 DOM에 실제 컴포넌트를 마운트하고 종료 후 정리한다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 실제 앱 모듈 ./article-list를 사용한다. 해당 제품 코드를 테스트용 가짜 구현으로 바꾸지 않는다.
import { ArticleList } from './article-list';
// 검토: 실제 앱 모듈 ../../model/article.types를 사용한다. 해당 제품 코드를 테스트용 가짜 구현으로 바꾸지 않는다.
import type { ArticleCollectionItem } from '../../model/article.types';

// 검토: 실제 API가 아닌 example.invalid 주소를 사용한다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 이 단계의 검증에 사용할 idA 값을 준비한다: const idA = 'a'.repeat(64)
const idA = 'a'.repeat(64);
// 검토: 이 단계의 검증에 사용할 idB 값을 준비한다: const idB = 'b'.repeat(64)
const idB = 'b'.repeat(64);
// 검토: 이 단계의 검증에 사용할 idC 값을 준비한다: const idC = 'c'.repeat(64)
const idC = 'c'.repeat(64);

// 검토: 라벨과 ID가 다른 가짜 기사들을 만드는 기존 픽스처다.
function item(id: string, label: string): ArticleCollectionItem {
  // 검토: 헬퍼가 후속 검사에 전달하는 결과다: { article_id: id, image_status: 'ready', image_url: `/images/${id}.jpg`, article: { title: `샘플 기사 ${label}`, description: `검증용 기사 ${label} 요약`, pubDate: '2026-10-04T09:00:00+09:00', originallink: `https://publisher.example.invalid/${label}`, link: '', }, }
  return {
    // 검토: 기사 고유 ID: id
    article_id: id,
    // 검토: 서버의 이미지 준비 상태: 'ready'
    image_status: 'ready',
    // 검토: 해당 기사 ID에 연결된 이미지 경로: `/images/${id}.jpg`
    image_url: `/images/${id}.jpg`,
    // 검토: 기사 원본 필드 묶음: { title: `샘플 기사 ${label}`, description: `검증용 기사 ${label} 요약`, pubDate: '2026-10-04T09:00:00+09:00', originallink: `https://publisher.example.invalid/${label}`, link: '', }
    article: {
      // 검토: 기사 제목 입력: `샘플 기사 ${label}`
      title: `샘플 기사 ${label}`,
      // 검토: 기사 요약 입력: `검증용 기사 ${label} 요약`
      description: `검증용 기사 ${label} 요약`,
      // 검토: 기사 발행 시각 입력: '2026-10-04T09:00:00+09:00'
      pubDate: '2026-10-04T09:00:00+09:00',
      // 검토: 원문 URL 입력: `https://publisher.example.invalid/${label}`
      originallink: `https://publisher.example.invalid/${label}`,
      // 검토: 원문이 안전하지 않을 때 사용할 대체 기사 URL: ''
      link: '',
    },
  };
}

// 검토: 이 단계의 검증에 사용할 container 값을 준비한다: let container: HTMLDivElement
let container: HTMLDivElement;
// 검토: 이 단계의 검증에 사용할 root 값을 준비한다: let root: Root
let root: Root;

// 검토: 각 테스트 전에 환경과 DOM을 새로 준비해 이전 테스트 상태가 섞이지 않게 한다.
beforeEach(() => {
  // 검토: 현재 테스트에만 전역 값을 대체한다. 실제 API 호출과 React 업데이트를 통제하며 종료 시 복구한다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: 테스트 동작을 수행한다: container = document.createElement('div');
  container = document.createElement('div');
  // 검토: 검사할 컴포넌트의 DOM 컨테이너를 문서에 붙인다.
  document.body.append(container);
  // 검토: 테스트 동작을 수행한다: root = createRoot(container);
  root = createRoot(container);
});

// 검토: 각 테스트 후 DOM·가짜 함수·환경변수·전역 객체를 복원한다.
afterEach(async () => {
  // 검토: 마운트했던 React 트리를 제거하고 업데이트가 끝날 때까지 기다린다.
  await act(async () => root.unmount());
  // 검토: 이 테스트가 추가한 DOM 컨테이너를 제거한다.
  container.remove();
  // 검토: 테스트가 바꾼 상태를 원래 값으로 되돌린다.
  vi.unstubAllGlobals();
});

// 검토: 기존 ArticleList를 실제 DOM에 렌더하고 업데이트를 기다린다.
async function render(items: ArticleCollectionItem[], origin = apiOrigin) {
  // 검토: 실제 페이지 또는 목록 컴포넌트를 DOM에 렌더하고 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => {
    // 검토: 실제 페이지 또는 목록 컴포넌트를 DOM에 렌더하고 React 업데이트가 끝날 때까지 기다린다.
    root.render(createElement(ArticleList, { items, apiOrigin: origin }));
  });
}

// 검토: 특정 이미지에 오류 이벤트를 보내 실패 상태를 재현하는 기존 헬퍼다.
async function failImage(image: HTMLImageElement) {
  // 검토: 이미지 로딩 오류 이벤트를 발생시킨다. 실제 이미지 다운로드나 시각적 품질은 이 검사 범위가 아니다.
  await act(async () => {
    // 검토: 이미지 로딩 오류 이벤트를 발생시킨다. 실제 이미지 다운로드나 시각적 품질은 이 검사 범위가 아니다.
    image.dispatchEvent(new Event('error'));
  });
}

```

### articleImageErrorPreservesCards — 대체 본문

```ts
// 검토: 기존 이미지 실패 후 카드 보존을 검증한다. 원문은 DOM 순서 대신 정확한 URL로 찾는다.
test('articleImageErrorPreservesCards', async () => {
  // 검토: 이 단계의 검증에 사용할 disabled 값을 준비한다: const disabled = { ...item(idC, 'C'), image_status: 'disabled', image_url: null, }
  const disabled = {
    ...item(idC, 'C'),
    // 검토: 서버의 이미지 준비 상태: 'disabled'
    image_status: 'disabled',
    // 검토: 해당 기사 ID에 연결된 이미지 경로: null
    image_url: null,
  };
  // 검토: 주어진 기사 목록과 API origin으로 기존 목록을 실제 DOM에 렌더한다.
  await render([item(idA, 'A'), item(idB, 'B'), disabled]);
  // 검토: 이 단계의 검증에 사용할 initialCards 값을 준비한다: const initialCards = container.querySelectorAll('article')
  const initialCards = container.querySelectorAll('article');
  // 검토: 검사 대상 initialCards의 개수는 3이어야 한다.
  expect(initialCards).toHaveLength(3);
  // 검토: 이 단계의 검증에 사용할 image 값을 준비한다: const image = initialCards[0].querySelector('img')
  const image = initialCards[0].querySelector('img');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: image. 없으면 즉시 실패한다.
  assert(image);
  // 검토: 검사 대상 image.getAttribute('alt')의 기대값은 ''이다.
  expect(image.getAttribute('alt')).toBe('');
  // 검토: 검사 대상 image.getAttribute('width')의 기대값은 '80'이다.
  expect(image.getAttribute('width')).toBe('80');
  // 검토: 검사 대상 image.getAttribute('height')의 기대값은 '80'이다.
  expect(image.getAttribute('height')).toBe('80');
  // 검토: 이미지에 붙는 AI 생성 안내의 기대값은 'AI 생성 이미지'이다.
  expect(initialCards[0].querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );

  // 검토: 지정 이미지에만 오류를 보내 다른 카드와 원문이 유지되는지 검사한다.
  await failImage(image);

  // 검토: 이 단계의 검증에 사용할 cards 값을 준비한다: const cards = container.querySelectorAll('article')
  const cards = container.querySelectorAll('article');
  // 검토: 카드에 표시된 기사 제목의 기대값은 ['샘플 기사 A', '샘플 기사 B', '샘플 기사 C']이다.
  expect(
    Array.from(cards, (card) => card.querySelector('h2')?.textContent),
  ).toEqual(['샘플 기사 A', '샘플 기사 B', '샘플 기사 C']);

  // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
  expect(cards[0].querySelector('img')).toBeNull();
  // 검토: 이미지에 붙는 AI 생성 안내가 없어야 한다.
  expect(cards[0].querySelector('figcaption')).toBeNull();
  // 검토: 화면 문구(cards[0].textContent)에 '이미지 없음'가 포함되어야 한다.
  expect(cards[0].textContent).toContain('이미지 없음');
  // 검토: 카드에 표시된 기사 제목의 기대값은 '샘플 기사 A'이다.
  expect(cards[0].querySelector('h2')?.textContent).toBe('샘플 기사 A');
  // 검토: 화면 문구(cards[0].textContent)에 '검증용 기사 A 요약'가 포함되어야 한다.
  expect(cards[0].textContent).toContain('검증용 기사 A 요약');
  // 검토: 화면 문구(cards[0].textContent)에 '기사 발행 2026-10-04 09:00 KST'가 포함되어야 한다.
  expect(cards[0].textContent).toContain('기사 발행 2026-10-04 09:00 KST');
  // 검토: 기사 발행 시각의 기계 판독 값의 기대값은 '2026-10-04T00:00:00.000Z'이다.
  expect(cards[0].querySelector('time')?.dateTime).toBe(
    '2026-10-04T00:00:00.000Z',
  );
  // 검토: 해당 원문 URL의 링크의 기대값은 'https://publisher.example.invalid/A'이다.
  expect(
    cards[0]
      .querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.getAttribute('href'),
  ).toBe('https://publisher.example.invalid/A');
  // 검토: 해당 원문 URL의 링크의 기대값은 '기사 원문'이다.
  expect(
    cards[0].querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.textContent,
  ).toBe('기사 원문');
  // 검토: 화면에 남아 있는 이미지 요소의 기대값은 `${apiOrigin}/images/${idB}.jpg`이다.
  expect(cards[1].querySelector('img')?.src).toBe(
    `${apiOrigin}/images/${idB}.jpg`,
  );
  // 검토: 이미지에 붙는 AI 생성 안내의 기대값은 'AI 생성 이미지'이다.
  expect(cards[1].querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );
  // 검토: 화면 문구(cards[1].textContent)에 '이미지 없음'가 포함되면 안 된다.
  expect(cards[1].textContent).not.toContain('이미지 없음');
  // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
  expect(cards[2].querySelector('img')).toBeNull();
  // 검토: 화면 문구(cards[2].textContent)에 '이미지 없음'가 포함되어야 한다.
  expect(cards[2].textContent).toContain('이미지 없음');
  // 검토: 화면의 기사 카드 수의 개수는 3이어야 한다.
  expect(container.querySelectorAll('article')).toHaveLength(3);
});

```

### articleImageRecoversForNewSource — 대체 본문

```ts
// 검토: 기존 새 이미지 URL 복구와 재실패 처리를 검증하며 원문 링크를 정확한 URL로 찾는다.
test('articleImageRecoversForNewSource', async () => {
  // 검토: 이 단계의 검증에 사용할 articles 값을 준비한다: const articles = [item(idA, 'A')]
  const articles = [item(idA, 'A')];
  // 검토: 주어진 기사 목록과 API origin으로 기존 목록을 실제 DOM에 렌더한다.
  await render(articles);
  // 검토: 이 단계의 검증에 사용할 initialImage 값을 준비한다: const initialImage = container.querySelector('img')
  const initialImage = container.querySelector('img');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: initialImage. 없으면 즉시 실패한다.
  assert(initialImage);
  // 검토: 지정 이미지에만 오류를 보내 다른 카드와 원문이 유지되는지 검사한다.
  await failImage(initialImage);
  // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
  expect(container.querySelector('img')).toBeNull();
  // 검토: 화면 문구(container.textContent)에 '이미지 없음'가 포함되어야 한다.
  expect(container.textContent).toContain('이미지 없음');

  // 검토: 이 단계의 검증에 사용할 nextOrigin 값을 준비한다: const nextOrigin = 'https://updated-news.example.invalid'
  const nextOrigin = 'https://updated-news.example.invalid';
  // 검토: 주어진 기사 목록과 API origin으로 기존 목록을 실제 DOM에 렌더한다.
  await render(articles, nextOrigin);

  // 검토: 이 단계의 검증에 사용할 nextImage 값을 준비한다: const nextImage = container.querySelector('img')
  const nextImage = container.querySelector('img');
  // 검토: 후속 동작에 필요한 값 또는 타입을 확인한다: nextImage. 없으면 즉시 실패한다.
  assert(nextImage);
  // 검토: 검사 대상 nextImage.src의 기대값은 `${nextOrigin}/images/${idA}.jpg`이다.
  expect(nextImage.src).toBe(`${nextOrigin}/images/${idA}.jpg`);
  // 검토: 검사 대상 nextImage.getAttribute('alt')의 기대값은 ''이다.
  expect(nextImage.getAttribute('alt')).toBe('');
  // 검토: 화면 문구(container.textContent)에 '이미지 없음'가 포함되면 안 된다.
  expect(container.textContent).not.toContain('이미지 없음');
  // 검토: 이미지에 붙는 AI 생성 안내의 기대값은 'AI 생성 이미지'이다.
  expect(container.querySelector('figcaption')?.textContent).toBe(
    'AI 생성 이미지',
  );
  // 검토: 해당 원문 URL의 링크의 기대값은 'https://publisher.example.invalid/A'이다.
  expect(
    container
      .querySelector('a[href="https://publisher.example.invalid/A"]')
      ?.getAttribute('href'),
  ).toBe('https://publisher.example.invalid/A');

  // 검토: 지정 이미지에만 오류를 보내 다른 카드와 원문이 유지되는지 검사한다.
  await failImage(nextImage);

  // 검토: 화면에 남아 있는 이미지 요소가 없어야 한다.
  expect(container.querySelector('img')).toBeNull();
  // 검토: 이미지에 붙는 AI 생성 안내가 없어야 한다.
  expect(container.querySelector('figcaption')).toBeNull();
  // 검토: 화면 문구(container.textContent)에 '이미지 없음'가 포함되어야 한다.
  expect(container.textContent).toContain('이미지 없음');
  // 검토: 화면의 기사 카드 수의 개수는 1이어야 한다.
  expect(container.querySelectorAll('article')).toHaveLength(1);
});
```


