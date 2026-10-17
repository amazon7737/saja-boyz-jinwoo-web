# 브랜드 아이콘과 첫 진입 위치 — 정확 테스트 변경 초안

기존 위치 검사2개를 자동 요청 계약으로 확장·교체한다. 같은 파일의 SDK 검사4개 본문과 나머지 테스트 파일은 유지한다. 등록 baseline에서 기존 위치2개만 분리하고 러너가 아래 정확 본문으로 복원한다. 최종 전체121개 유지, skip·가짜 통과·기대값 완화 없음.

## Node — src/features/map/ui/map-home/map-home.test.ts

```ts
// file: src/features/map/ui/map-home/map-home.test.ts
// @vitest-environment jsdom
import { act, createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
let HomePage: typeof import('@/app/page').default;

beforeEach(async () => {
  vi.resetModules();
  ({ default: HomePage } = await import('@/app/page'));
});

const dom = { window };
let root: Root;
let container: HTMLDivElement;
let oldId: string | undefined;

async function mount(id = 'map-test-id', strict = false) {
  oldId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (id) process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = id;
  else delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const page = await HomePage();
  await act(async () =>
    root.render(strict ? createElement(StrictMode, null, page) : page),
  );
}

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]')
    .forEach((node) => node.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  Reflect.deleteProperty(navigator, 'geolocation');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (oldId === undefined) delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  else process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = oldId;
  vi.useRealTimers();
});

function script() {
  const node = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]',
  );
  expect(node).not.toBeNull();
  return node!;
}
function button(name: string) {
  const node = [...container.querySelectorAll('button')].find(
    (element) =>
      element.textContent?.includes(name) ||
      element.getAttribute('aria-label')?.includes(name),
  );
  expect(node).toBeDefined();
  return node!;
}
function sdk() {
  const centers: [number, number][] = [];
  let viewport = { latitude: 37.5665, longitude: 126.978, zoom: 12 };
  const listeners: Array<{ event: string; callback: () => void }> = [];
  class LatLng {
    constructor(
      private latitude: number,
      private longitude: number,
    ) {}
    lat() {
      return this.latitude;
    }
    lng() {
      return this.longitude;
    }
  }
  const destroy = vi.fn();
  const setMap = vi.fn();
  const created = vi.fn();
  const markers = vi.fn();
  const move = (point: LatLng) => {
    centers.push([point.lat(), point.lng()]);
    viewport = { ...viewport, latitude: point.lat(), longitude: point.lng() };
  };
  class MapFixture {
    constructor(
      element: HTMLElement,
      options: { center: LatLng; zoom: number },
    ) {
      viewport = {
        latitude: options.center.lat(),
        longitude: options.center.lng(),
        zoom: options.zoom,
      };
      created(element, options);
    }
    getCenter() {
      return new LatLng(viewport.latitude, viewport.longitude);
    }
    getZoom() {
      return viewport.zoom;
    }
    setCenter = move;
    panTo = move;
    destroy = destroy;
    setSize() {}
    refresh() {}
  }
  class MarkerFixture {
    constructor(options: unknown) {
      markers(options);
    }
    setMap = setMap;
    setPosition() {}
  }
  const naver = {
    maps: {
      Map: MapFixture,
      LatLng,
      Marker: MarkerFixture,
      Circle: MarkerFixture,
      Size: class {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
      Point: class {
        constructor(
          public x: number,
          public y: number,
        ) {}
      },
      Position: { TOP_RIGHT: 3, BOTTOM_LEFT: 6 },
      Event: {
        addListener: vi.fn(
          (_target: unknown, event: string, callback: () => void) => {
            const listener = { event, callback };
            listeners.push(listener);
            return listener;
          },
        ),
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
        trigger: vi.fn(),
      },
    },
  };
  Object.assign(dom.window, { naver });
  vi.stubGlobal('naver', naver);
  return {
    centers,
    created,
    destroy,
    markers,
    setMap,
    get viewport() {
      return viewport;
    },
    pan(next: typeof viewport) {
      viewport = next;
      for (const listener of listeners.filter(
        (item) => item.event === 'dragstart',
      ))
        listener.callback();
    },
  };
}
async function loaded() {
  const fixture = sdk();
  await act(async () => script().dispatchEvent(new dom.window.Event('load')));
  return fixture;
}
function geolocation(value: unknown) {
  Object.defineProperty(dom.window.navigator, 'geolocation', {
    value,
    configurable: true,
  });
}
```

- [x] mapFirstVisitLocatesAutomaticallyAndPreservesReturnViewport — 첫 진입에서 SDK 전 위치 요청 1회·StrictMode 중복 방지·최초 중심·마커·복귀 뷰포트·수동 재조회·저장소 미사용

```ts
test('mapFirstVisitLocatesAutomaticallyAndPreservesReturnViewport', async () => {
  const successes: PositionCallback[] = [];
  const request = vi.fn<Geolocation['getCurrentPosition']>((success) => {
    successes.push(success);
  });
  geolocation({ getCurrentPosition: request });
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  await mount('map-test-id', true);
  const initialId = oldId;
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]?.[2]).toMatchObject({ timeout: 10_000 });
  expect(Reflect.get(window, 'naver')).toBeUndefined();
  await act(async () =>
    successes[0]({
      coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
    } as GeolocationPosition),
  );
  const fixture = await loaded();
  expect(fixture.created).toHaveBeenCalledTimes(1);
  const options = fixture.created.mock.calls[0][1];
  expect(options.center.lat()).toBe(37.5);
  expect(options.center.lng()).toBe(127.1);
  expect(options.zoom).toBe(12);
  expect(fixture.markers).toHaveBeenCalled();
  expect(button('내 위치').disabled).toBe(false);
  await act(async () =>
    fixture.pan({ latitude: 35.1796, longitude: 129.0756, zoom: 15 }),
  );
  await act(async () => root.unmount());
  container.remove();
  await mount('map-test-id', true);
  oldId = initialId;
  expect(request).toHaveBeenCalledTimes(1);
  const restored = fixture.created.mock.calls.at(-1)![1];
  expect(restored.center.lat()).toBe(35.1796);
  expect(restored.center.lng()).toBe(129.0756);
  expect(restored.zoom).toBe(15);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(2);
  expect(button('내 위치').disabled).toBe(true);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(2);
  await act(async () =>
    successes[1]({
      coords: { latitude: 37.6, longitude: 127.2, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(fixture.centers).toContainEqual([37.6, 127.2]);
  expect(button('내 위치').disabled).toBe(false);
  expect(storage).not.toHaveBeenCalled();
});
```

- [ ] mapAutomaticLocationFailureRetryAndStaleCallbacksStaySafe — 늦은 자동 위치와 사용자 이동·권한 거부·미지원·시간 초과·비정상 좌표·SDK 실패/재시도·해제 후 응답 안전성

```ts
test('mapAutomaticLocationFailureRetryAndStaleCallbacksStaySafe', async () => {
  const successes: PositionCallback[] = [];
  const failures: PositionErrorCallback[] = [];
  const request = vi.fn(
    (success: PositionCallback, failure: PositionErrorCallback) => {
      successes.push(success);
      failures.push(failure);
    },
  );
  geolocation({ getCurrentPosition: request });
  await mount('map-test-id', true);
  expect(request).toHaveBeenCalledTimes(1);
  const fixture = await loaded();
  expect(button('내 위치').disabled).toBe(true);
  await act(async () =>
    fixture.pan({ latitude: 35.1796, longitude: 129.0756, zoom: 15 }),
  );
  await act(async () =>
    successes[0]({
      coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(fixture.centers).toHaveLength(0);
  expect(fixture.viewport).toEqual({
    latitude: 35.1796,
    longitude: 129.0756,
    zoom: 15,
  });
  expect(button('내 위치').disabled).toBe(false);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(2);
  await act(async () =>
    failures[1]({ code: 1, message: 'denied' } as GeolocationPositionError),
  );
  expect(container.textContent).toMatch(/위치.*권한|권한.*위치/);
  expect(fixture.centers).toHaveLength(0);
  expect(button('내 위치').disabled).toBe(false);
  geolocation(undefined);
  await act(async () => button('내 위치').click());
  expect(container.textContent).toMatch(/지원/);
  geolocation({ getCurrentPosition: request });
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(3);
  await act(async () =>
    failures[2]({ code: 3, message: 'timeout' } as GeolocationPositionError),
  );
  expect(container.textContent).toMatch(/시간.*초과/);
  expect(button('내 위치').disabled).toBe(false);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(4);
  await act(async () =>
    successes[3]({
      coords: { latitude: Number.NaN, longitude: 181, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(fixture.centers).toHaveLength(0);
  expect(button('내 위치').disabled).toBe(false);
  expect(container.textContent).toMatch(/위치.*확인|위치.*유효/);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(5);
  const authenticationFailure = Reflect.get(window, 'navermap_authFailure');
  await act(async () => authenticationFailure());
  await act(async () =>
    successes[4]({
      coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(fixture.centers).toHaveLength(0);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  await act(async () => button('다시 시도').click());
  const recovered = await loaded();
  expect(request).toHaveBeenCalledTimes(5);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(6);
  await act(async () => root.unmount());
  await act(async () =>
    successes[5]({
      coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(recovered.centers).toHaveLength(0);
  expect(recovered.destroy).toHaveBeenCalledTimes(1);
});
```
