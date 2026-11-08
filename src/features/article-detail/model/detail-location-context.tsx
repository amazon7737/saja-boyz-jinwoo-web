'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { articleTitle } from '@/features/article-list/model/article-presentation';
import { groupMapArticles } from '@/features/map/model/map-region-groups';

import {
  useArticleSheetRoute,
  type ArticleSheetRoute,
} from './article-sheet-context';

type Location = {
  latitude: number;
  longitude: number;
  label: string;
  precision: 'address' | 'neighborhood' | 'region';
};

type RelatedArticle = {
  articleId: string;
  title: string;
  publishedAt: string;
  locationLabel: string;
};

type LocationData = { location: Location | null; related: RelatedArticle[] };
type Result =
  | { id: string; attempt: number; status: 'ready'; data: LocationData }
  | { id: string; attempt: number; status: 'error' };
type DetailLocationState = {
  id: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: LocationData | null;
  retry(): void;
};

const Context = createContext<DetailLocationState | null>(null);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isLocationData(value: unknown, id: string): value is LocationData {
  if (
    !record(value) ||
    !Array.isArray(value.related) ||
    value.related.length > 3
  )
    return false;
  if (value.location === null) return value.related.length === 0;
  if (!record(value.location)) return false;
  const { latitude, longitude, label, precision } = value.location;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof label !== 'string' ||
    !label.trim() ||
    !['address', 'neighborhood', 'region'].includes(String(precision))
  )
    return false;
  const ids = new Set<string>();

  return value.related.every((item: unknown) => {
    if (
      !record(item) ||
      typeof item.articleId !== 'string' ||
      !/^[a-f0-9]{64}$/.test(item.articleId) ||
      item.articleId === id ||
      ids.has(item.articleId) ||
      typeof item.title !== 'string' ||
      typeof item.publishedAt !== 'string' ||
      typeof item.locationLabel !== 'string'
    )
      return false;
    ids.add(item.articleId);

    return true;
  });
}

function fromMap(
  route: ArticleSheetRoute | null,
  id: string,
): LocationData | null {
  const group = [...groupMapArticles(route?.mapArticles ?? []).values()].find(
    (items) => items.some((item) => item.article_id === id),
  );
  const item = group?.find((candidate) => candidate.article_id === id);

  if (!item) return null;
  const { latitude, longitude, label, precision } = item.location;

  return {
    location: { latitude, longitude, label, precision },
    related: (group ?? [])
      .filter((candidate) => candidate.article_id !== id)
      .slice(0, 3)
      .map((candidate) => ({
        articleId: candidate.article_id,
        title: articleTitle(candidate.article.title),
        publishedAt: candidate.article.pubDate,
        locationLabel: candidate.location.label,
      })),
  };
}

export function DetailLocationProvider({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const route = useArticleSheetRoute();
  const local = useMemo(() => fromMap(route, id), [route, id]);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (local || !/^[a-f0-9]{64}$/.test(id)) return;
    const controller = new AbortController();
    const deadline = AbortSignal.timeout(17_000);
    const signal = AbortSignal.any([controller.signal, deadline]);

    void (async () => {
      try {
        const response = await fetch('/api/incidents/' + id + '/location', {
          cache: 'no-store',
          signal,
        });

        if (!response.ok) throw new Error('location unavailable');
        const value: unknown = await response.json();

        if (!isLocationData(value, id)) throw new Error('invalid location');
        if (!controller.signal.aborted)
          setResult({ id, attempt, status: 'ready', data: value });
      } catch {
        if (!controller.signal.aborted)
          setResult({ id, attempt, status: 'error' });
      }
    })();

    return () => controller.abort();
  }, [id, attempt, local]);

  const active =
    result?.id === id && result.attempt === attempt ? result : null;
  const state: DetailLocationState = local
    ? { id, status: 'ready', data: local, retry: () => {} }
    : active?.status === 'ready'
      ? {
          id,
          status: 'ready',
          data: active.data,
          retry: () => setAttempt((value) => value + 1),
        }
      : {
          id,
          status: /^[a-f0-9]{64}$/.test(id)
            ? (active?.status ?? 'loading')
            : 'idle',
          data: null,
          retry: () => setAttempt((value) => value + 1),
        };

  return <Context value={state}>{children}</Context>;
}

export function useDetailLocation(id: string): DetailLocationState {
  const route = useArticleSheetRoute();
  const provided = useContext(Context);
  const local = fromMap(route, id);

  if (local) return { id, status: 'ready', data: local, retry: () => {} };
  if (provided?.id === id) return provided;

  return { id, status: 'idle', data: null, retry: () => {} };
}
