// file: src/features/map/ui/map-home/map-viewport.test.ts
// @vitest-environment jsdom
import { act, createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let MapHome: ComponentType<{ clientId: string }>;
let root: Root | undefined;
let container: HTMLDivElement;
let current = { latitude: 37.5665, longitude: 126.978, zoom: 12 };
let broken = false;
let created = vi.fn();
let destroy = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  ({ MapHome } = await import('./map-home'));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  current = { latitude: 37.5665, longitude: 126.978, zoom: 12 };
  broken = false;
  created = vi.fn();
  destroy = vi.fn();
  class LatLng {
    constructor(private latitude: number, private longitude: number) {}
    lat() { return this.latitude; }
    lng() { return this.longitude; }
  }
  class MapFixture {
    constructor(_element: HTMLElement, options: { center: LatLng; zoom: number }) {
      current = { latitude: options.center.lat(), longitude: options.center.lng(), zoom: options.zoom };
      created(current);
    }
    getCenter() {
      if (broken) throw new Error('unavailable center');
      return new LatLng(current.latitude, current.longitude);
    }
    getZoom() { return current.zoom; }
    setSize() {}
    destroy = destroy;
  }
  Object.assign(window, { naver: { maps: { LatLng, Map: MapFixture } } });
  container = document.createElement('div');
  document.body.append(container);
});

async function visit(clientId = 'viewport-test-id') {
  root = createRoot(container);
  await act(async () => root!.render(createElement(MapHome, { clientId })));
  const script = document.querySelector<HTMLScriptElement>('script[src*="oapi.map.naver.com"]');
  expect(script).not.toBeNull();
  await act(async () => script!.dispatchEvent(new Event('load')));
}

async function leave() {
  await act(async () => root!.unmount());
  root = undefined;
}

afterEach(async () => {
  if (root) await leave();
  container.remove();
  document.querySelectorAll('script[src*="oapi.map.naver.com"]').forEach(node => node.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
