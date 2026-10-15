# 기존 테스트1개 변경 초안

동일 좌표의 다른 지역도 화면에서 겹치므로 표시 마커 수3→2, 숫자1·1·2→2·2로 바꾼다. 대표 좌표·지역 식별·중복 제거·카메라 보존은 유지한다. helper/fixture와 다른 기존108개 본문은 그대로다.

## 변경 전

```ts
test('mapRegionCirclesCountUniqueArticlesAtFixedPoints', async () => {
  const first = item(1);
  const items = [
    first,
    { ...first, collection_id: 'duplicate' },
    item(2),
    item(3, 0, '부산광역시'),
    item(4, 0, '부산광역시 중구'),
  ];
  const fixture = await mount(items);
  const markers = [...fixture.active];
  expect(markers).toHaveLength(3);
  expect(markers.map((marker) => marker.content.textContent).sort()).toEqual([
    '1',
    '1',
    '2',
  ]);
  expect(markers[0].position).toMatchObject({
    latitude: 37.56,
    longitude: 126.99,
  });
  for (const marker of markers) {
    expect(marker.content.querySelector('img')).toBeNull();
    expect(marker.content.getAttribute('aria-label')).toContain(
      '지역 대표 위치',
    );
  }
  for (const events of fixture.callbacks.values())
    events.get('zoom_changed')?.();
  expect(
    [...fixture.active].map((marker) => marker.content.textContent).sort(),
  ).toEqual(['1', '1', '2']);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

```

## 변경 후

```ts
test('mapRegionCirclesCountUniqueArticlesAtFixedPoints', async () => {
  const first = item(1);
  const items = [
    first,
    { ...first, collection_id: 'duplicate' },
    item(2),
    item(3, 0, '부산광역시'),
    item(4, 0, '부산광역시 중구'),
  ];
  const fixture = await mount(items);
  const markers = [...fixture.active];
  expect(markers).toHaveLength(2);
  expect(markers.map((marker) => marker.content.textContent).sort()).toEqual([
    '2',
    '2',
  ]);
  expect(markers[0].position).toMatchObject({
    latitude: 37.56,
    longitude: 126.99,
  });
  for (const marker of markers) {
    expect(marker.content.querySelector('img')).toBeNull();
    expect(marker.content.getAttribute('aria-label')).toContain(
      '지역 대표 위치',
    );
  }
  for (const events of fixture.callbacks.values())
    events.get('zoom_changed')?.();
  expect(
    [...fixture.active].map((marker) => marker.content.textContent).sort(),
  ).toEqual(['2', '2']);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

```
