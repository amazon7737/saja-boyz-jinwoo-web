'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  if (
    composing ||
    normalized === keyword.trim() ||
    result?.query !== normalized ||
    !result.items.length
  )
    return null;

  return (
    <section
      aria-live="polite"
      aria-labelledby="search-suggestions-title"
      className="flex flex-col gap-2"
    >
      <h2
        id="search-suggestions-title"
        className="m-0 text-xs font-bold text-muted"
      >
        일치하는 기사
      </h2>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {result.items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/incidents/${item.id}`}
              className="ui-control block rounded-lg px-2 py-2 text-sm text-text"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
