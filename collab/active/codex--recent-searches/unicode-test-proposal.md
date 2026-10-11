# 손상된 Unicode 저장값 회귀 테스트 추가안

2026-10-11 · Astra 독립 리뷰가 발견한 URIError 처리.

저장 기록에 JSON 문자열로 들어온 고립 surrogate(`\ud800`, `\udc00`)는 JavaScript 문자열이지만 encodeURIComponent에서 URIError를 일으킨다. 현재 최근 검색 목록을 렌더링하다 오류가 나므로 손상된 저장소가 기존 검색 화면을 깨뜨린다.

## 명세 추가 제안

최근 검색 기록의 문자열 검증에서 URL로 인코딩할 수 없는 고립 surrogate를 무시한다. 유효한 Unicode 문자열과 정상 surrogate pair인 이모지는 그대로 보존한다. 기존 검색 폼·추천·URL·API와 저장소 예외 처리를 유지한다.

## 정확 테스트 추가 제안

기존 헤더·helpers·fixtures·45개 테스트와 명령은 그대로 유지하고, failed-test.md의 같은 최근 검색 섹션 끝에 아래 항목 1개만 추가한다. 전체 46개 기준으로 검증한다.

- [ ] recentSearchesIgnoreMalformedUnicodeWithoutBreakingSearch — 손상 Unicode 무시·정상 문자열/이모지 유지·검색 지속

```ts
test('recentSearchesIgnoreMalformedUnicodeWithoutBreakingSearch', async () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify(['\ud800', '정상 검색어', '\udc00', '🔥 화재']),
  );
  await mount();
  expect(terms()).toEqual(['정상 검색어', '🔥 화재']);
  expect(container.querySelector('form[action="/search"]')).not.toBeNull();
  expect(request).not.toHaveBeenCalled();
  await mount('소방');
  expect(stored()).toEqual(['소방', '정상 검색어', '🔥 화재']);
  expect(request).toHaveBeenCalledTimes(1);
});
```

사용자 승인 후 위 명세 문장과 정확 테스트를 루트 입력에 반영해 커밋하고 approve.sh --replace로 새 기준을 기록한다. sobaya Astra 구현·전체 suite·gate·독립 리뷰·타입·실제 Chrome 재검증 후 PR #9를 완료한다. 새 의존성이나 sobaya 런타임 변경은 없다.
