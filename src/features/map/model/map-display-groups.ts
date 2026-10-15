import type { LocatedArticle } from './map-article.types';

type DisplayGroup = { items: LocatedArticle[]; regionCount: number };
type PixelPoint = { x: number; y: number };
type ProjectLocation = (location: LocatedArticle['location']) => PixelPoint;

export function sameMapDisplayGroups(
  previous: Map<string, DisplayGroup>,
  next: Map<string, DisplayGroup>,
) {
  if (previous.size !== next.size) return false;

  return [...next].every(([key, group]) => {
    const before = previous.get(key);

    return (
      before?.regionCount === group.regionCount &&
      before.items.length === group.items.length &&
      before.items.every((item, index) => item === group.items[index])
    );
  });
}

export function mapDisplayDiameter(count: number, cluster = false) {
  return count <= 5 && !cluster ? 38.4 : count < 10 ? 48 : 72;
}

// Logical regions retain their representative points. Projection only decides
// which circles share a display marker, never a new geographical location.
export function groupMapDisplayPoints(
  groups: Map<string, LocatedArticle[]>,
  project?: ProjectLocation,
) {
  const points = new Map<string, DisplayGroup>();

  for (const group of groups.values()) {
    const { latitude, longitude } = group[0].location;
    const key = JSON.stringify([latitude, longitude]);
    const point = points.get(key) ?? { items: [], regionCount: 0 };
    const seen = new Set(point.items.map((item) => item.article_id));

    for (const item of group) {
      if (seen.has(item.article_id)) continue;
      seen.add(item.article_id);
      point.items.push(item);
    }

    point.regionCount += 1;
    points.set(key, point);
  }

  if (!project) return points;

  const displays = [...points].map(([key, group]) => ({
    key,
    group,
    circles: [
      {
        point: project(group.items[0].location),
        radius:
          mapDisplayDiameter(group.items.length, group.regionCount > 1) / 2,
      },
    ],
  }));
  const overlaps = (
    left: (typeof displays)[number],
    right: (typeof displays)[number],
  ) =>
    left.circles.some((a) =>
      right.circles.some(
        (b) =>
          Math.hypot(a.point.x - b.point.x, a.point.y - b.point.y) <=
          a.radius + b.radius,
      ),
    );

  // Retain original circles for transitive overlap, and include each enlarged
  // representative circle. Restart after merging so growth cannot leave a
  // previously checked circle overlapping the resulting display marker.
  for (let left = 0; left < displays.length; left += 1) {
    for (let right = left + 1; right < displays.length; right += 1) {
      const first = displays[left];
      const second = displays[right];

      if (!overlaps(first, second)) continue;
      const seen = new Set(first.group.items.map((item) => item.article_id));

      first.group.items.push(
        ...second.group.items.filter((item) => {
          if (seen.has(item.article_id)) return false;
          seen.add(item.article_id);

          return true;
        }),
      );
      first.group.regionCount += second.group.regionCount;
      first.circles.push(...second.circles, {
        point: first.circles[0].point,
        radius: mapDisplayDiameter(first.group.items.length, true) / 2,
      });
      displays.splice(right, 1);
      left = -1;
      break;
    }
  }

  return new Map(displays.map(({ key, group }) => [key, group]));
}
