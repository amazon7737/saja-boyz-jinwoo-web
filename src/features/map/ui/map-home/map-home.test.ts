// file: src/features/map/ui/map-home/map-home.test.ts
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';
import HomePage from '@/app/page';

const dom = { window };
let root: Root;
let container: HTMLDivElement;
let oldId: string | undefined;

async function mount(id = 'map-test-id') {
  oldId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  if (id) process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = id;
  else delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const page = await HomePage();
  await act(async () => root.render(page));
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
  vi.stubGlobal('naver', naver);
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
