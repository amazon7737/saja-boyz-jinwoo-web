# 최근 검색 — 정확 실패 테스트 초안

사용자 승인 전 초안. 기존 40개 테스트·helpers·fixtures·명령을 유지한다. 실제 SearchPage를 렌더링하고 검색 API를 기존 응답 계약대로 mock한다. 유틸 구현을 그대로 따라 쓰는 테스트는 추가하지 않는다.

## 최근 검색 사용자 흐름

```ts
// file: src/features/search/ui/recent-searches/recent-searches.test.ts
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SearchPage from '@/app/search/page';

const storageKey = 'hh:recent-searches:v1';
const request = vi.fn<typeof fetch>();
let root: Root | undefined;
let container: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  request.mockReset();
  request.mockImplementation(async () =>
    Response.json({ total: 0, items: [] }),
  );
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('fetch', request);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
});
async function unmount() {
  if (root) await act(async () => root?.unmount());
  root = undefined;
}
afterEach(async () => {
  await unmount();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});
async function mount(q?: string | string[]) {
  const page = await SearchPage({ searchParams: Promise.resolve({ q }) });
  root ??= createRoot(container);
  await act(async () => root?.render(page));
}
function recent() {
  const section = container.querySelector('section[aria-label="최근 검색"]');
  expect(section).not.toBeNull();
  return section!;
}
function terms() {
  return Array.from(recent().querySelectorAll('a')).map((link) => {
    const url = new URL(
      link.getAttribute('href') ?? '',
      'https://app.example.invalid',
    );
    expect(url.pathname).toBe('/search');
    return url.searchParams.get('q');
  });
}
function stored() {
  return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[];
}
```

- [ ] recentSearchesRestoreStoredKeywordsWithoutFetching — 저장 기록 복원·입력만으로 저장하지 않음

```ts
test('recentSearchesRestoreStoredKeywordsWithoutFetching', async () => {
  const keywords = ['서울 소방서', '서교동 화재'];
  localStorage.setItem(storageKey, JSON.stringify(keywords));
  await mount();
  expect(terms()).toEqual(keywords);
  expect(recent().textContent).not.toContain('실시간 강남역');
  expect(request).not.toHaveBeenCalled();
  const input = container.querySelector('input[name="q"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  await act(async () => {
    (input as HTMLInputElement).value = '아직 입력 중';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(stored()).toEqual(keywords);
  expect(request).not.toHaveBeenCalled();
});
```

- [ ] recentSearchesRecordExecutedKeywordAndDeduplicate — 실행 검색 기록·최신 순·중복 정리·추천과 재진입

```ts
test('recentSearchesRecordExecutedKeywordAndDeduplicate', async () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify(['서교동 화재', '서울 & 화재', '서울 & 화재']),
  );
  await mount(['  서울 & 화재  ', '무시할 값']);
  expect(stored()).toEqual(['서울 & 화재', '서교동 화재']);
  expect(
    new URL(String(request.mock.calls[0][0])).searchParams.get('keyword'),
  ).toBe('서울 & 화재');
  await mount('대형화재');
  expect(stored()).toEqual(['대형화재', '서울 & 화재', '서교동 화재']);
  await unmount();
  await mount('   ');
  expect(terms()).toEqual(['대형화재', '서울 & 화재', '서교동 화재']);
  expect(request).toHaveBeenCalledTimes(2);
});
```

- [ ] recentSearchesBoundHistoryAndDeleteOneKeyword — 최대 10개·개별 삭제·저장 반영·삭제 시 검색 미실행

```ts
test('recentSearchesBoundHistoryAndDeleteOneKeyword', async () => {
  const older = Array.from({ length: 12 }, (_, index) => '기록 ' + index);
  localStorage.setItem(storageKey, JSON.stringify(older));
  await mount('새 검색');
  const expected = ['새 검색', ...older.slice(0, 9)];
  expect(stored()).toEqual(expected);
  await mount();
  expect(terms()).toEqual(expected);
  const remove = recent().querySelector('button[aria-label="새 검색 삭제"]');
  expect(remove).not.toBeNull();
  expect(remove!.getAttribute('type')).toBe('button');
  await act(async () => (remove as HTMLButtonElement).click());
  expect(terms()).toEqual(older.slice(0, 9));
  expect(stored()).toEqual(older.slice(0, 9));
  expect(request).toHaveBeenCalledTimes(1);
  await unmount();
  await mount();
  expect(terms()).toEqual(older.slice(0, 9));
});
```

- [ ] recentSearchesKeepLinksEncodedAndUserContentSafe — 재검색 URL 인코딩·텍스트 안전성·동일 기사 검색 경로

```ts
test('recentSearchesKeepLinksEncodedAndUserContentSafe', async () => {
  const keywords = ['서울 & 화재', '<img src=x onerror=alert(1)>'];
  localStorage.setItem(storageKey, JSON.stringify(keywords));
  await mount();
  expect(terms()).toEqual(keywords);
  const section = recent();
  expect(section.textContent).toContain(keywords[1]);
  expect(section.querySelector('img, script')).toBeNull();
  const first = section.querySelector('a');
  expect(first!.getAttribute('href')).toBe(
    '/search?q=' + encodeURIComponent(keywords[0]),
  );
  expect(
    section.querySelector('button[aria-label="서울 & 화재 삭제"]'),
  ).not.toBeNull();
  expect(request).not.toHaveBeenCalled();
});
```

- [ ] recentSearchesTolerateInvalidOrUnavailableStorage — 손상/잘못된 형태·저장소 접근/쓰기 실패에서도 검색 유지

```ts
test('recentSearchesTolerateInvalidOrUnavailableStorage', async () => {
  for (const raw of ['{broken', '{"items":["가짜 기록"]}', '[null,7,"",{}]']) {
    localStorage.setItem(storageKey, raw);
    await mount();
    expect(terms()).toEqual([]);
    expect(recent().textContent).toContain('최근 검색어가 없어요');
    await unmount();
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  await mount('화재');
  expect(
    container.querySelector('section[aria-label="기사 검색 결과"]'),
  ).not.toBeNull();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
  await mount();
  expect(terms()).toEqual([]);
  expect(container.querySelector('form[action="/search"]')).not.toBeNull();
  expect(container.textContent).toContain('추천 검색어');
});
```

