'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { ArticleSkeleton } from '@/components/feedback/article-skeleton';
import { useArticleTail } from '@/features/article-list/ui/article-list/use-article-tail';

import { loadSearchPage } from '../../api/load-search-page';

type SearchPage = NonNullable<Awaited<ReturnType<typeof loadSearchPage>>>;

function uniqueCards(cards: SearchPage['cards']) {
  const seen = new Set<string>();

  return cards.filter(({ id }) => {
    if (seen.has(id)) return false;
    seen.add(id);

    return true;
  });
}

export function SearchResults({
  keyword,
  initialPage,
}: {
  keyword: string;
  initialPage: SearchPage;
}) {
  const [cards, setCards] = useState(() => uniqueCards(initialPage.cards));
  const [offset, setOffset] = useState(initialPage.received);
  const [hasMore, setHasMore] = useState(
    initialPage.received > 0 && initialPage.received < initialPage.total,
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
    };
  }, []);

  const loadMore = useCallback(
    async (manual = false) => {
      if (!active.current || inFlight.current || !hasMore) return;
      inFlight.current = true;
      setPending(true);
      setFailed(false);
      setRetrying(manual);

      try {
        const page = await loadSearchPage(keyword, offset);

        if (!active.current) return;

        if (!page) {
          setFailed(true);

          return;
        }

        const nextOffset = offset + page.received;

        setCards((previous) => uniqueCards([...previous, ...page.cards]));
        setOffset(nextOffset);
        setHasMore(page.received > 0 && nextOffset < page.total);
      } catch {
        if (active.current) setFailed(true);
      } finally {
        inFlight.current = false;

        if (active.current) {
          setPending(false);
          setRetrying(false);
        }
      }
    },
    [hasMore, keyword, offset],
  );

  const tail = useArticleTail(hasMore && !pending && !failed, loadMore);

  return (
    <section aria-label="기사 검색 결과" className="ui-results-enter">
      <h1 className="m-0 mb-3 text-xs font-bold text-muted">기사 검색 결과</h1>
      <p className="sr-only">
        아래로 이동하면 기사를 이어서 불러와요. 중복 기사는 한 번만 표시해요.
      </p>
      {cards.length === 0 ? (
        <p role="status" className="text-muted leading-[1.7]">
          검색 결과가 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-3 pb-3">
          {cards.map(({ id, content }) => (
            <Fragment key={id}>{content}</Fragment>
          ))}
        </div>
      )}
      {pending && (
        <ArticleSkeleton
          label="추가 기사를 불러오는 중이에요"
          variant="search"
        />
      )}
      {failed && <p role="alert">추가 기사를 불러오지 못했어요</p>}
      {hasMore && (failed || retrying) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => loadMore(true)}
          className="ui-control rounded-lg border border-solid border-border bg-surface px-3 py-2 text-brand disabled:opacity-50"
        >
          다시 시도
        </button>
      )}
      {hasMore && <div ref={tail} aria-hidden="true" className="h-px" />}
    </section>
  );
}
