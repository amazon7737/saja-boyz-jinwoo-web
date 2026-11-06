'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { highlightedText } from '../highlighted-text';

type Suggestion = { id: string; title: string };

function validItems(value: unknown): value is { items: Suggestion[] } {
  if (!value || typeof value !== 'object' || !('items' in value)) return false;
  const items = value.items;

  return (
    Array.isArray(items) &&
    items.length <= 5 &&
    items.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        /^[a-f0-9]{64}$/.test(item.id) &&
        typeof item.title === 'string' &&
        Boolean(item.title.trim()),
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

  return (
    <>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {items.length > 0 ? `일치하는 기사 ${items.length}개` : ''}
      </p>
      {items.length > 0 && (
        <section
          aria-labelledby="search-suggestions-title"
          className="flex flex-col gap-2"
        >
          <h2
            id="search-suggestions-title"
            className="m-0 text-xs font-bold text-muted"
          >
            일치하는 기사
          </h2>
          <ul className="m-0 flex min-w-0 list-none flex-col gap-2 p-0">
            {items.map((item) => (
              <li
                key={item.id}
                className="min-w-0 border-b border-solid border-border"
              >
                <Link
                  href={`/incidents/${item.id}`}
                  className="ui-control block min-h-[33px] min-w-0 rounded-sm py-2 text-[14px]/[17px] text-text [overflow-wrap:anywhere]"
                >
                  {highlightedText(item.title, normalized)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
