'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

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
  const inFlight = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
    };
  }, []);

  async function loadMore() {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);

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
      if (active.current) setPending(false);
    }
  }

  return (
    <section aria-label="기사 검색 결과" className="ui-results-enter">
      <h1 className="m-0 mb-3 text-xs font-bold text-muted">기사 검색 결과</h1>
      <p className="sr-only">
        더 보기로 기사를 이어서 볼 수 있어요. 중복 기사는 한 번만 표시해요.
      </p>
      {cards.length === 0 ? (
        <p role="status" className="text-muted leading-[1.7]">
          검색 결과가 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-2 pb-2">
          {cards.map(({ id, content }) => (
            <Fragment key={id}>{content}</Fragment>
          ))}
        </div>
      )}
      {pending && (
        <p role="status" aria-busy="true" className="text-muted">
          추가 기사를 불러오는 중이에요
        </p>
      )}
      {failed && <p role="alert">추가 기사를 불러오지 못했어요</p>}
      {hasMore && (
        <button
          type="button"
          disabled={pending}
          onClick={loadMore}
          className="ui-control rounded-lg border border-solid border-border bg-surface px-3 py-2 text-brand disabled:opacity-50"
        >
          {failed ? '다시 시도' : '더 보기'}
        </button>
      )}
    </section>
  );
}
