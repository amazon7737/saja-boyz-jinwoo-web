# 네이버 지도 정확 테스트 초안

신규 6개. 기존 34개 테스트·전체 명령·의존성 유지. 아래 header와 본문 전체가 승인 대상이다. SDK fixture는 외부 호출 없이 상태/지도/위치 callback 동작만 검사하며 실제 SDK/타일은 구현 후 별도 Chrome에서 확인한다.

## 지도 홈

```ts
// file: src/features/map/ui/map-home/map-home.test.ts
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { afterEach, expect, test, vi } from 'vitest';
import HomePage from '@/app/page';

let dom: JSDOM;
let root: Root;
let container: HTMLDivElement;
let oldId: string | undefined;
const previous = new Map<string, PropertyDescriptor | undefined>();

async function mount(id = 'map-test-id') {
  oldId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (id) process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = id;
  else delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost:3000',
  });
  const values = {
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
  previous.set('naver', Object.getOwnPropertyDescriptor(globalThis, 'naver'));
  container = document.querySelector<HTMLDivElement>('#root')!;
  root = createRoot(container);
  const page = await HomePage();
  await act(async () => root.render(page));
}

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  dom?.window.close();
  for (const [key, value] of previous) {
    if (value) Object.defineProperty(globalThis, key, value);
    else Reflect.deleteProperty(globalThis, key);
  }
  previous.clear();
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
  const move = (point: LatLng) => centers.push([point.lat(), point.lng()]);
  class MapFixture {
    constructor(
      element: HTMLElement,
      options: { center: LatLng; zoom: number },
    ) {
      created(element, options);
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
    setPosition(point: LatLng) {
      move(point);
    }
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
        addListener: vi.fn(() => ({})),
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
        trigger: vi.fn(),
      },
    },
  };
  Object.assign(dom.window, { naver });
  Object.defineProperty(globalThis, 'naver', {
    value: naver,
    configurable: true,
    writable: true,
  });
  return { centers, created, destroy, markers, setMap };
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

- [ ] mapMissingKeyExplainsSetupWithoutSdkRequest — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapMissingKeyExplainsSetupWithoutSdkRequest', async () => {
  await mount('');
  expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
    /지도/,
  );
  expect(
    document.querySelector('script[src*="oapi.map.naver.com"]'),
  ).toBeNull();
  expect(container.querySelector('[aria-label="주변 지도"]')).not.toBeNull();
});
```

- [ ] mapLoadsNaverSdkAndPreservesHomeNavigation — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapLoadsNaverSdkAndPreservesHomeNavigation', async () => {
  await mount();
  expect(container.querySelector('[aria-label="주변 지도"]')).not.toBeNull();
  expect(
    container.querySelector('[role="status"][aria-busy="true"]')?.textContent,
  ).toMatch(/지도/);
  const url = new URL(script().src);
  expect(url.origin).toBe('https://oapi.map.naver.com');
  expect(url.searchParams.get('ncpKeyId')).toBe('map-test-id');
  expect(url.searchParams.has('clientSecret')).toBe(false);
  const fixture = await loaded();
  expect(fixture.created).toHaveBeenCalledTimes(1);
  const [element, options] = fixture.created.mock.calls[0];
  expect(element).toBeInstanceOf(dom.window.HTMLElement);
  expect(options.center.lat()).toBe(37.5665);
  expect(options.center.lng()).toBe(126.978);
  expect(options.zoom).toBe(12);
  expect(
    container.querySelector('[role="status"][aria-busy="true"]'),
  ).toBeNull();
  expect(container.textContent).not.toMatch(
    /인천 외국인|방공식별구역|지금 핫한 사건/,
  );
  await act(async () => root.unmount());
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
```

- [ ] mapSdkFailureRetriesAndRecovers — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapSdkFailureRetriesAndRecovers', async () => {
  await mount();
  await act(async () => script().dispatchEvent(new dom.window.Event('error')));
  expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
    /지도/,
  );
  await act(async () => button('다시 시도').click());
  const fixture = await loaded();
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(
    document.querySelectorAll(
      'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]',
    ),
  ).toHaveLength(1);
});
```

- [ ] mapSdkTimeoutAndAuthenticationFailureAreVisible — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapSdkTimeoutAndAuthenticationFailureAreVisible', async () => {
  vi.useFakeTimers();
  await mount();
  await act(async () => vi.advanceTimersByTime(10001));
  expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
    /지도/,
  );
  await act(async () => button('다시 시도').click());
  const callback = Reflect.get(dom.window, 'navermap_authFailure');
  expect(typeof callback).toBe('function');
  await act(async () => callback());
  expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
    /지도/,
  );
  expect(
    container.querySelector('[role="status"][aria-busy="true"]'),
  ).toBeNull();
});
```

- [ ] mapLocationStartsOnClickAndMovesOnlyAfterSuccess — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapLocationStartsOnClickAndMovesOnlyAfterSuccess', async () => {
  await mount();
  let success!: PositionCallback;
  const request = vi.fn((callback: PositionCallback) => {
    success = callback;
  });
  geolocation({ getCurrentPosition: request });
  const fixture = await loaded();
  expect(request).not.toHaveBeenCalled();
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(1);
  expect(button('내 위치').disabled).toBe(true);
  await act(async () => button('내 위치').click());
  expect(request).toHaveBeenCalledTimes(1);
  const position = {
    coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
  } as GeolocationPosition;
  await act(async () => success(position));
  expect(fixture.centers).toContainEqual([37.5, 127.1]);
  expect(button('내 위치').disabled).toBe(false);
  expect(fixture.markers).toHaveBeenCalled();
});
```

- [ ] mapLocationDenialUnsupportedAndLateCallbacksKeepMapSafe — 지도 상태와 내 위치 사용자 흐름 검증

```ts
test('mapLocationDenialUnsupportedAndLateCallbacksKeepMapSafe', async () => {
  await mount();
  let success!: PositionCallback;
  let failure!: PositionErrorCallback;
  const request = vi.fn((ok: PositionCallback, bad: PositionErrorCallback) => {
    success = ok;
    failure = bad;
  });
  geolocation({ getCurrentPosition: request });
  const fixture = await loaded();
  await act(async () => button('내 위치').click());
  await act(async () =>
    failure({ code: 1, message: 'denied' } as GeolocationPositionError),
  );
  expect(container.textContent).toMatch(/위치.*권한|권한.*위치/);
  expect(fixture.centers).toHaveLength(0);
  expect(button('내 위치').disabled).toBe(false);
  geolocation(undefined);
  await act(async () => button('내 위치').click());
  expect(container.textContent).toMatch(/지원/);
  geolocation({ getCurrentPosition: request });
  await act(async () => button('내 위치').click());
  await act(async () => root.unmount());
  await act(async () =>
    success({
      coords: { latitude: 37.5, longitude: 127.1, accuracy: 10 },
    } as GeolocationPosition),
  );
  expect(fixture.centers).toHaveLength(0);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
```
