'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { highlightedText } from '../highlighted-text';
import { ArticlePreviewCard } from '../article-preview-card/article-preview-card';

type Suggestion = {
  id: string;
  title: string;
  publishedAt: string | null;
  imageUrl: string | null;
};

function validImageUrl(value: unknown, id: string): boolean {
  if (value === null) return true;
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value);

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === `/images/${id}.jpg` &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function validItems(value: unknown): value is { items: Suggestion[] } {
  if (!value || typeof value !== 'object' || !('items' in value)) return false;
  const items = value.items;

  return (
    Array.isArray(items) &&
    items.length <= 6 &&
    items.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        /^[a-f0-9]{64}$/.test(item.id) &&
        typeof item.title === 'string' &&
        Boolean(item.title.trim()) &&
        (item.publishedAt === null ||
          (typeof item.publishedAt === 'string' &&
            !Number.isNaN(Date.parse(item.publishedAt)))) &&
        validImageUrl(item.imageUrl, item.id),
    )
  );
}

export function SearchSuggestions({
  query,
  keyword,
  composing,
}: {
  query: string;
  keyword: string;
  composing: boolean;
}) {
  const [result, setResult] = useState<{
    query: string;
    items: Suggestion[];
  } | null>(null);
  const normalized = query.trim();
  const highlightQuery = normalized.split(/\s+/).at(-1) ?? '';
  const requestKey = JSON.stringify([composing, keyword, normalized]);
  const [previousKey, setPreviousKey] = useState(requestKey);

  if (previousKey !== requestKey) {
    setPreviousKey(requestKey);
    setResult(null);
  }

  useEffect(() => {
    if (
      composing ||
      normalized.length < 2 ||
      normalized.length > 200 ||
      normalized === keyword.trim()
    )
      return;

    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );

        if (!response.ok) return;
        const payload: unknown = await response.json();

        if (active && validItems(payload))
          setResult({ query: normalized, items: payload.items });
      } catch {
        // Suggestions are optional; the search form remains available.
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalized, keyword, composing]);

  const items =
    !composing && normalized !== keyword.trim() && result?.query === normalized
      ? result.items
      : [];

  const cards = items.slice(0, 2);
  const suggestions = items.slice(2);
  const hasCards = cards.length > 0;
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!hasCards) return;
    let active = true;
    const update = () => {
      if (active) setNow(new Date());
    };

    queueMicrotask(update);
    const timer = setInterval(update, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hasCards]);

  return (
    <>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {items.length > 0 ? `일치하는 기사 ${items.length}개` : ''}
      </p>
      {suggestions.length > 0 && (
        <section
          aria-labelledby="search-suggestions-title"
          className="flex flex-col gap-2"
        >
          <h2 id="search-suggestions-title" className="sr-only">
            일치하는 기사
          </h2>
          <ul className="m-0 flex min-w-0 list-none flex-col gap-2 p-0">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="min-w-0 border-0 border-b border-solid border-border"
              >
                <Link
                  href={`/incidents/${item.id}`}
                  className="ui-control block min-h-[33px] min-w-0 rounded-sm py-2 text-[14px]/[17px] text-text [overflow-wrap:anywhere]"
                >
                  {highlightedText(item.title, highlightQuery)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {cards.length > 0 && (
        <section
          aria-labelledby="matching-articles-title"
          className="flex min-w-0 flex-col gap-2"
        >
          <h2
            id="matching-articles-title"
            className="m-0 text-xs font-bold text-muted"
          >
            일치한 사건
          </h2>
          <ul className="m-0 flex min-w-0 list-none flex-col gap-2 p-0">
            {cards.map((item) => (
              <li key={item.id} className="min-w-0">
                <ArticlePreviewCard
                  id={item.id}
                  title={item.title}
                  publishedAt={item.publishedAt}
                  imageUrl={item.imageUrl}
                  now={now}
                  keyword={highlightQuery}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
