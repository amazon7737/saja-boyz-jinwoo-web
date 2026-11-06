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

type SdkWindow = Window & {
  naver?: { maps?: NaverMaps };
  navermap_authFailure?: () => void;
};

type SdkSubscriber = {
  ready(maps: NaverMaps): void;
  error(): void;
};

type SdkLoad = {
  clientId: string;
  script: HTMLScriptElement;
  state: 'loading' | 'ready' | 'failed';
  subscribers: Set<SdkSubscriber>;
  previousAuth?: () => void;
  auth(): void;
  loaded(): void;
  failed(): void;
  timeout?: ReturnType<typeof setTimeout>;
  observer?: MutationObserver;
};

let currentLoad: SdkLoad | undefined;
const ownedScripts = new WeakSet<HTMLScriptElement>();

function reportSubscriberError(subscriber: SdkSubscriber) {
  try {
    subscriber.error();
  } catch {
    // A failed consumer must not prevent other maps from receiving SDK events.
  }
}

function reportReady(subscriber: SdkSubscriber, maps: NaverMaps) {
  try {
    subscriber.ready(maps);
  } catch {
    reportSubscriberError(subscriber);
  }
}

function stopLoad(load: SdkLoad) {
  clearTimeout(load.timeout);
  load.observer?.disconnect();
  load.script.removeEventListener('load', load.loaded);
  load.script.removeEventListener('error', load.failed);
  const sdkWindow = window as SdkWindow;

  if (sdkWindow.navermap_authFailure === load.auth) {
    if (load.previousAuth) sdkWindow.navermap_authFailure = load.previousAuth;
    else delete sdkWindow.navermap_authFailure;
  }

  if (currentLoad === load) currentLoad = undefined;
}

function startLoad(clientId: string): SdkLoad | undefined {
  const url = naverMapScriptUrl(clientId);
  const scripts = [
    ...document.querySelectorAll<HTMLScriptElement>('script[src]'),
  ];
  const differentKey = scripts.filter((element) => {
    const source = new URL(element.src);

    return (
      source.origin === url.origin &&
      source.pathname === url.pathname &&
      element.src !== url.href
    );
  });

  if (differentKey.some((element) => !ownedScripts.has(element)))
    return undefined;
  for (const element of differentKey) element.remove();
  let script = scripts.find((element) => element.src === url.href);
  const existing = Boolean(script);

  if (!script) {
    script = document.createElement('script');
    script.src = url.href;
    script.async = true;
    ownedScripts.add(script);
  }

  const sdkScript = script;

  // Keep the completion marker even if StrictMode releases all subscribers
  // before the browser finishes loading this same script.
  sdkScript.addEventListener(
    'load',
    () => {
      sdkScript.dataset.naverMapLoaded = 'true';
    },
    { once: true },
  );
  const sdkWindow = window as SdkWindow;
  const load: SdkLoad = {
    clientId,
    script: sdkScript,
    state: 'loading',
    subscribers: new Set(),
    previousAuth: sdkWindow.navermap_authFailure,
    auth: () => {},
    loaded: () => {},
    failed: () => {},
  };

  load.failed = () => {
    if (currentLoad !== load || load.state === 'failed') return;
    clearTimeout(load.timeout);
    load.observer?.disconnect();
    load.state = 'failed';

    if (sdkWindow.navermap_authFailure === load.auth) {
      if (load.previousAuth) sdkWindow.navermap_authFailure = load.previousAuth;
      else delete sdkWindow.navermap_authFailure;
    }

    sdkScript.remove();
    for (const subscriber of [...load.subscribers])
      reportSubscriberError(subscriber);
  };

  load.loaded = () => {
    if (currentLoad !== load || load.state !== 'loading') return;
    const maps = sdkWindow.naver?.maps;

    if (!maps) return load.failed();
    clearTimeout(load.timeout);
    load.state = 'ready';
    for (const subscriber of [...load.subscribers])
      reportReady(subscriber, maps);
  };

  load.auth = () => {
    load.failed();

    try {
      load.previousAuth?.();
    } catch {
      // An unrelated authentication callback must not interrupt SDK cleanup.
    }
  };

  currentLoad = load;
  sdkWindow.navermap_authFailure = load.auth;
  sdkScript.addEventListener('load', load.loaded);
  sdkScript.addEventListener('error', load.failed);
  load.timeout = setTimeout(load.failed, 10_000);

  if (typeof MutationObserver !== 'undefined') {
    load.observer = new MutationObserver(() => {
      if (currentLoad === load && !sdkScript.isConnected) load.failed();
    });
    load.observer.observe(document.head, { childList: true });
  }

  if (!existing) document.head.append(sdkScript);
  if (sdkScript.dataset.naverMapLoaded === 'true') queueMicrotask(load.loaded);

  return load;
}

export function subscribeNaverMaps(
  clientId: string,
  subscriber: SdkSubscriber,
) {
  let subscribed = true;
  const reportFailureLater = () => {
    queueMicrotask(() => {
      if (subscribed) reportSubscriberError(subscriber);
    });

    return () => {
      subscribed = false;
    };
  };
  const key = clientId.trim();

  if (!key || (currentLoad && currentLoad.clientId !== key))
    return reportFailureLater();
  if (currentLoad?.state === 'failed') stopLoad(currentLoad);
  const load = currentLoad ?? startLoad(key);

  if (!load) return reportFailureLater();
  const registration: SdkSubscriber = {
    ready: (maps) => subscriber.ready(maps),
    error: () => subscriber.error(),
  };

  load.subscribers.add(registration);

  if (load.state === 'ready') {
    queueMicrotask(() => {
      const maps = (window as SdkWindow).naver?.maps;

      if (subscribed && currentLoad === load && load.state === 'ready' && maps)
        reportReady(registration, maps);
    });
  }

  return () => {
    if (!subscribed) return;
    subscribed = false;
    load.subscribers.delete(registration);
    if (!load.subscribers.size) stopLoad(load);
  };
}
