# 입력 필드 포커스 시나리오

## 검색 입력
```ts
// file: src/proxy-navigation.test.ts
```
- [ ] searchKeyboardFocusKeepsTheFormOutlineAndClearControl — 키보드 포커스 윤곽선이 검색 필드 경계에 닿고 초기화 버튼도 사용할 수 있다.
```ts
test('searchKeyboardFocusKeepsTheFormOutlineAndClearControl', async () => {
  for (const width of [320, 393]) {
    const page = await openList(width);
    try {
      await page.goto(origin + '/search');
      const input = page.getByRole('searchbox', { name: '기사 키워드 검색' });
      const submit = page.getByRole('button', { name: '검색', exact: true });
      await input.waitFor();
      await page.getByRole('link', { name: '지도로 돌아가기' }).focus();
      await page.keyboard.press('Tab');
      expect(
        await submit.evaluate((element) => element === document.activeElement),
      ).toBe(true);
      await page.keyboard.press('Tab');
      const focused = await input.evaluate((element: HTMLInputElement) => {
        const form = getComputedStyle(element.form!);
        return {
          active: element === document.activeElement,
          visible: element.matches(':focus-visible'),
          inputOutline: getComputedStyle(element).outlineStyle,
          formOutline: form.outlineStyle,
          width: form.outlineWidth,
          offset: form.outlineOffset,
          color: form.outlineColor,
        };
      });
      expect(focused).toEqual({
        active: true,
        visible: true,
        inputOutline: 'none',
        formOutline: 'solid',
        width: '3px',
        offset: '0px',
        color: 'rgb(232, 25, 44)',
      });
      await page.keyboard.type('fire');
      await page.keyboard.press('Tab');
      const clear = page.getByRole('button', { name: '검색어 초기화' });
      expect(
        await clear.evaluate((element) => element === document.activeElement),
      ).toBe(true);
      expect(
        await input.evaluate(
          (element: HTMLInputElement) =>
            getComputedStyle(element.form!).outlineStyle,
        ),
      ).toBe('none');
      await page.keyboard.press('Enter');
      expect(await input.inputValue()).toBe('');
    } finally {
      await page.close();
    }
  }
}, 120000);
```

## 제보 입력
- [ ] reportFieldFocusAndErrorsRemainAccessible — 입력과 첨부 필드의 포커스가 경계에 맞으며 오류와 키보드 탐색이 유지된다.
