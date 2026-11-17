# 포커스 표시

## 검색 폼
```ts
// file: src/proxy-navigation.test.ts
```
- [x] searchKeyboardFocusKeepsTheFormOutlineAndClearControl — 검색 폼의 키보드 포커스는 1px로 표시되고 입력과 지우기 동작이 유지된다.
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
        width: '1px',
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

## 입력 포커스 단일선
```ts
// file: src/proxy-navigation.test.ts
```
- [x] thinFocus — 검색·제보·첨부·공유 입력의 포커스는 구분 가능한 빨간 1px 선 한 겹이다.
```ts
test('thinFocus: searchKeyboardFocusKeepsTheFormOutlineAndClearControl', async () => {
  for (const width of [320, 393]) {
    const page = await openList(width);
    try {
      await page.goto(origin + '/search');
      const input = page.getByRole('searchbox', { name: '기사 키워드 검색' });
      const submit = page.getByRole('button', { name: '검색', exact: true });
      await input.waitFor();
      const unfocusedBorder = await input.evaluate(
        (element: HTMLInputElement) =>
          getComputedStyle(element.form!).borderTopColor,
      );
      expect(unfocusedBorder).not.toBe('rgb(232, 25, 44)');
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
          border: form.borderTopColor,
        };
      });
      expect(focused).toEqual({
        active: true,
        visible: true,
        inputOutline: 'none',
        formOutline: 'solid',
        width: '1px',
        offset: '0px',
        color: 'rgb(232, 25, 44)',
        border: 'rgba(0, 0, 0, 0)',
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
