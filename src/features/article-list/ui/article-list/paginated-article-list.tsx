'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadArticlePage } from '../../api/load-article-page';
import { ArticleList } from './article-list';
import { useArticleTail } from './use-article-tail';

type ArticlePage = NonNullable<Awaited<ReturnType<typeof loadArticlePage>>>;

export function PaginatedArticleList({
  initialPage,
}: {
  initialPage: ArticlePage;
}) {
  const [page, setPage] = useState(initialPage);
  const [offset, setOffset] = useState(initialPage.items.length);
  const [exhausted, setExhausted] = useState(initialPage.items.length === 0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const hasMore = !exhausted && offset < page.total;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!mounted.current || inFlight.current || !hasMore) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);

    try {
      const nextPage = await loadArticlePage(offset);

      if (!mounted.current) return;

      if (!nextPage) {
        setFailed(true);

        return;
      }

      setPage((previous) => ({
        ...nextPage,
        items: [...previous.items, ...nextPage.items],
      }));
      setOffset(offset + nextPage.items.length);
      setExhausted(nextPage.items.length === 0);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }, [hasMore, offset]);

  const tail = useArticleTail(hasMore && !pending && !failed, loadMore);

  return (
    <>
      <ArticleList items={page.items} apiOrigin={page.apiOrigin} />
      {pending && (
        <p role="status" aria-busy="true">
          추가 기사를 불러오는 중이에요
        </p>
      )}
      {failed && <p role="alert">추가 기사를 불러오지 못했어요</p>}
      {hasMore && <div ref={tail} aria-hidden="true" className="h-px" />}
      {hasMore && failed && (
        <button
          type="button"
          disabled={pending}
          onClick={loadMore}
          className="rounded-lg border border-solid border-border bg-surface px-3 py-2 text-brand disabled:opacity-50"
        >
          다시 시도
        </button>
      )}
    </>
  );
}
