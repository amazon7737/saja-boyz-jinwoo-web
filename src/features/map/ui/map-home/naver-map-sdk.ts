type ControlCollection = { getArray(): HTMLElement[] };

export type MapInstance = {
  controls?: Partial<Record<string | number, ControlCollection>>;
  destroy(): void;
  getCenter?(): { lat(): number; lng(): number };
  getZoom?(): number;
  getProjection?(): {
    fromCoordToOffset(point: unknown): { x: number; y: number };
  };
  setCenter(point: unknown): void;
  setSize(size: unknown): void;
};

export type MarkerInstance = { setMap(map: MapInstance | null): void };

export type NaverMaps = {
  Position?: {
    BOTTOM_LEFT: string | number;
    BOTTOM_CENTER?: string | number;
    BOTTOM_RIGHT: string | number;
  };
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Marker: new (options: {
    map: MapInstance;
    position: unknown;
    icon?:
      | { url: string; size: unknown; anchor: unknown }
      | { content: HTMLElement; anchor: unknown };
    title?: string;
  }) => MarkerInstance;
  Event: {
    addListener(
      target: MapInstance | MarkerInstance | ControlCollection,
      event: string,
      callback: () => void,
    ): unknown;
    removeListener(listener: unknown): void;
  };
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: {
      center: unknown;
      zoom: number;
      draggable?: boolean;
      scrollWheel?: boolean;
      pinchZoom?: boolean;
      keyboardShortcuts?: boolean;
      disableDoubleClickZoom?: boolean;
      disableDoubleTapZoom?: boolean;
      disableTwoFingerTapZoom?: boolean;
    },
  ) => MapInstance;
};

export function naverMapScriptUrl(clientId: string) {
  const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');

  url.searchParams.set('ncpKeyId', clientId);

  return url;
}
