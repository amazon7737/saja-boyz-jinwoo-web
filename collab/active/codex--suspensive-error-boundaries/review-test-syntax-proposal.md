# 승인 테스트 문법 수정 제안

nextBoundaryPreservesFeatureClassification의 검증과 기대값은 유지한다. Next ErrorBoundaryHandler의 필수 props인 children을 boundaryProps 객체로 구성하고 createElement에 전달하여 react/no-children-prop 규칙을 만족한다. 억제 주석·lint 설정 변경은 하지 않는다. RouteError의 error 입력은 Next 실제 타입 unknown과 호환되게 안전하게 좁힌다. 전체 추가 테스트는 아래와 같다.

```ts
test('nextBoundaryPreservesFeatureClassification', async () => {
  for (const [reason, message] of [
    ['network', '연결을 확인'],
    ['configuration', '서비스 설정'],
    ['invalid-response', '응답을 확인'],
  ] as const) {
    await draw(null);
    vi.mocked(console.error).mockClear();
    let broken = true;
    const error = new FeatureError(reason);
    error.message = 'SECRET_CLIENT_DETAIL';
    function Page() {
      if (broken) throw error;
      return createElement('p', null, '정상 페이지');
    }
    function tree() {
      const boundaryProps = {
        pathname,
        errorComponent: RouteError,
        children: createElement(Page),
      };
      return createElement(
        AppShell,
        null,
        createElement(ErrorBoundaryHandler, boundaryProps),
      );
    }
    await draw(tree());
    expect(
      container.querySelector('main [role="alert"]')?.textContent,
    ).toContain(message);
    expect(console.error).toHaveBeenCalledWith('기능 오류:', reason);
    expect(container.textContent).not.toContain('SECRET_CLIENT_DETAIL');
    expect(container.querySelector('header')?.textContent).toContain('흉흉');
    expect(container.querySelector('nav')?.textContent).toContain('목록');
    broken = false;
    const retry = container.querySelector('main button');
    expect(retry).toBeInstanceOf(HTMLButtonElement);
    await act(async () => (retry as HTMLButtonElement).click());
    expect(container.textContent).toContain('정상 페이지');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    broken = true;
    await draw(tree());
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    broken = false;
    pathname = '/search';
    await draw(tree());
    expect(container.textContent).toContain('정상 페이지');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    pathname = '/incidents';
  }
});
```
