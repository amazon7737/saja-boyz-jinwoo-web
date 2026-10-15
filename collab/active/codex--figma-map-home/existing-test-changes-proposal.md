# 기존 테스트3개 변경 초안(미승인)

새 요구와 충돌하는 기존 기대값만 변경한다. 나머지99개 테스트·공통 fixture·명령은 유지한다. 승인 전 원본 파일은 수정하지 않는다.

## 1. src/features/map/ui/map-home/map-articles.test.ts

변경 전:
```ts
test('uses the original Figma article marker and restores its unselected appearance when the sheet closes', async () => {
  const fixture = await mount();
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLButtonElement };
  };
  const button = marker.icon?.content;
  expect(button?.getAttribute('aria-label')).toContain('지역 대표 위치');
  expect(button?.querySelector('img')?.getAttribute('src')).toBe(
    '/map/article-marker.svg',
  );
  await act(async () => fixture.selected[0]());
  expect(button?.getAttribute('aria-pressed')).toBe('true');
  expect(button?.querySelector('img')?.getAttribute('src')).toBe(
    '/map/article-selected.svg',
  );
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('button[aria-label="기사 선택 닫기"]')!
      .click(),
  );
  expect(button?.getAttribute('aria-pressed')).toBe('false');
  expect(button?.querySelector('img')?.getAttribute('src')).toBe(
    '/map/article-marker.svg',
  );
  expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
});
```

변경 후:
```ts
test('uses a numeric region circle for one article and restores its unselected appearance when the sheet closes', async () => {
  const fixture = await mount();
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLButtonElement };
  };
  const button = marker.icon?.content;
  expect(button?.getAttribute('aria-label')).toContain('지역 대표 위치');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  await act(async () => fixture.selected[0]());
  expect(button?.getAttribute('aria-pressed')).toBe('true');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('button[aria-label="기사 선택 닫기"]')!
      .click(),
  );
  expect(button?.getAttribute('aria-pressed')).toBe('false');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
});
```

## 2. src/features/map/ui/map-home/map-articles.test.ts

변경 전:
```ts
test('groups articles at the same representative coordinate and keeps every article selectable', async () => {
  const second = {
    ...data.items[0],
    article_id: 'b'.repeat(64),
    article: { ...data.items[0].article, title: '동일 지역의 두 번째 기사' },
  };
  const fixture = await mount({
    ...data,
    total: 2,
    items: [...data.items, second],
  });
  expect(fixture.positions).toHaveLength(1);
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLElement };
    title: string;
  };
  expect(marker.icon?.content.textContent).toBe('2');
  expect(marker.title).toContain('2건');
  await act(async () => fixture.selected[0]());
  const links = document.querySelectorAll('a[href^="/incidents/"]');
  expect([...links].map((link) => link.getAttribute('href'))).toEqual([
    '/incidents/' + 'a'.repeat(64),
    '/incidents/' + 'b'.repeat(64),
  ]);
  expect(document.body.textContent).toContain('지역 대표 위치');
});
```

변경 후:
```ts
test('groups articles at the same representative coordinate and keeps every article selectable', async () => {
  const second = {
    ...data.items[0],
    article_id: 'b'.repeat(64),
    article: { ...data.items[0].article, title: '동일 지역의 두 번째 기사' },
  };
  const fixture = await mount({
    ...data,
    total: 2,
    items: [...data.items, second],
  });
  expect(fixture.positions).toHaveLength(1);
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLElement };
    title: string;
  };
  expect(marker.icon?.content.textContent).toBe('2');
  expect(marker.title).toContain('2건');
  await act(async () => fixture.selected[0]());
  const links = document
    .querySelector('[aria-label="선택한 기사"]')!
    .querySelectorAll('a[href^="/incidents/"]');
  expect([...links].map((link) => link.getAttribute('href'))).toEqual([
    '/incidents/' + 'a'.repeat(64),
    '/incidents/' + 'b'.repeat(64),
  ]);
  expect(document.body.textContent).toContain('지역 대표 위치');
});
```

## 3. src/components/layout/app-shell/app-shell-foundation.test.ts

변경 전:
```ts
test('foundationUnconnectedArticleFiltersCannotPretendToFilter', async () => {
  for (const route of ['/', '/incidents']) {
    await withShell(route, (host) => {
      const filters = host.querySelector('[aria-label="기사 필터"]');
      assert(filters);
      for (const label of ['기간', '카테고리', '상태']) {
        const button = Array.from(
          filters.querySelectorAll<HTMLButtonElement>('button'),
        ).find((candidate) => candidate.textContent?.trim().startsWith(label));
        assert(button);
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('title')).toContain('준비 중');
      }
      expect(host.querySelector('main')?.textContent).toContain('기능 내용');
    });
  }
  await withShell('/search', (host) => {
    expect(host.querySelector('[aria-label="기사 필터"]')).toBeNull();
  });
});
```

변경 후:
```ts
test('foundationUnconnectedArticleFiltersCannotPretendToFilter', async () => {
  for (const route of ['/incidents']) {
    await withShell(route, (host) => {
      const filters = host.querySelector('[aria-label="기사 필터"]');
      assert(filters);
      for (const label of ['기간', '카테고리', '상태']) {
        const button = Array.from(
          filters.querySelectorAll<HTMLButtonElement>('button'),
        ).find((candidate) => candidate.textContent?.trim().startsWith(label));
        assert(button);
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('title')).toContain('준비 중');
      }
      expect(host.querySelector('main')?.textContent).toContain('기능 내용');
    });
  }
  await withShell('/', (host) => {
    expect(host.querySelector('[aria-label="기사 필터"]')).toBeNull();
    expect(host.querySelector('header')).not.toBeNull();
  });
  await withShell('/search', (host) => {
    expect(host.querySelector('[aria-label="기사 필터"]')).toBeNull();
  });
});
```
