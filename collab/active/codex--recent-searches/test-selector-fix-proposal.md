# 최근 검색 테스트 조회 문법 수정안

2026-10-10 · 대상: recentSearchesKeepLinksEncodedAndUserContentSafe 한 곳.

실제 Chrome에는 `aria-label="서울 & 화재 삭제"` 버튼이 정상 표시된다. jsdom 27.4.0의 CSS 속성 선택자는 React가 없는 최소 재현에서도 정확한 속성을 가진 버튼을 찾지 못했다. 모든 버튼을 조회하고 실제 aria-label 문자열을 비교하면 찾는다. 의존성이나 제품 접근성 이름을 바꾸지 않고 동일한 버튼 존재 기대값을 유지한다.

승인된 원문:

```ts
  expect(
    section.querySelector('button[aria-label="서울 & 화재 삭제"]'),
  ).not.toBeNull();
```

변경 제안:

```ts
  expect(
    Array.from(section.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === '서울 & 화재 삭제',
    ),
  ).toBeDefined();
```

다른 본문·헤더·fixtures·기존 40개 테스트·전체 테스트 명령은 그대로 유지한다. 사용자 승인 후 정확 수정안을 failed-test.md와 해당 materialized 테스트에 반영해 커밋하고 approve.sh --replace로 새 기준을 기록한다. 이전 승인 기준 및 세 완료 체크포인트의 이력을 보존한다.
