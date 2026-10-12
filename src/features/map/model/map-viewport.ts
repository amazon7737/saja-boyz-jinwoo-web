type MapViewport = {
  latitude: number;
  longitude: number;
  zoom: number;
};

type ViewportReader = {
  getCenter?(): { lat(): number; lng(): number };
  getZoom?(): number;
};

const defaultViewport: MapViewport = {
  latitude: 37.5665,
  longitude: 126.978,
  zoom: 12,
};

let activeClientId: string | undefined;
let snapshot: MapViewport | undefined;

export function restoreMapViewport(clientId: string): MapViewport {
  if (activeClientId !== clientId) {
    activeClientId = clientId;
    snapshot = undefined;
  }

  return { ...(snapshot ?? defaultViewport) };
}

export function captureMapViewport(clientId: string, map: ViewportReader) {
  if (activeClientId !== clientId) return;

  try {
    const center = map.getCenter?.();
    const latitude = center?.lat();
    const longitude = center?.lng();
    const zoom = map.getZoom?.();

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      typeof zoom !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(zoom) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      zoom < 0 ||
      zoom > 21
    ) {
      return;
    }

    snapshot = { latitude, longitude, zoom };
  } catch {
    // SDK reads must never prevent cleanup or replace a valid snapshot.
  }
}
