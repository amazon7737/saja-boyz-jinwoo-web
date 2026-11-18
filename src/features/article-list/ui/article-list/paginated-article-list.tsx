'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Notice } from '@/components/feedback/notice';
import { ArticleSkeleton } from '@/components/feedback/article-skeleton';

import { loadArticlePage } from '../../api/load-article-page';
import type { ArticlePeriod } from '../../model/article-period';
import { ArticleList } from './article-list';
import { useArticleTail } from './use-article-tail';

type ArticlePage = NonNullable<Awaited<ReturnType<typeof loadArticlePage>>>;

export function PaginatedArticleList({
  initialPage,
  period,
}: {
  initialPage: ArticlePage;
  period?: ArticlePeriod;
}) {
  const [page, setPage] = useState(initialPage);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const update = () => {
      if (active) setNow(Date.now());
    };

    queueMicrotask(update);
    const timer = setInterval(update, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const [offset, setOffset] = useState(initialPage.items.length);
  const [exhausted, setExhausted] = useState(initialPage.items.length === 0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const hasMore = !exhausted && offset < page.total;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const loadMore = useCallback(
    async (manual = false) => {
      if (!mounted.current || inFlight.current || !hasMore) return;
      inFlight.current = true;
      setPending(true);
      setFailed(false);
      setRetrying(manual);

      try {
        const nextPage = await loadArticlePage(offset, period);

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

        if (mounted.current) {
          setPending(false);
          setRetrying(false);
        }
      }
    },
    [hasMore, offset, period],
  );

  const tail = useArticleTail(hasMore && !pending && !failed, loadMore);

  return (
    <>
      {period && page.items.length === 0 ? (
        <Notice title="선택한 기간의 기사가 없어요">
          기간을 변경해 다른 소식도 살펴보세요.
        </Notice>
      ) : (
        <ArticleList items={page.items} apiOrigin={page.apiOrigin} now={now} />
      )}
      {pending && <ArticleSkeleton label="추가 기사를 불러오는 중이에요" />}
      {hasMore && <div ref={tail} aria-hidden="true" className="h-px" />}
      {hasMore && (failed || retrying) && (
        <Notice
          role={failed ? 'alert' : 'group'}
          title={failed ? '이어지는 소식을 다시 볼까요?' : '이어지는 소식'}
          action={
            <button
              type="button"
              disabled={pending}
              onClick={() => loadMore(true)}
              className="ui-control rounded-lg border border-solid border-border bg-surface px-3 py-2 text-brand disabled:opacity-50"
            >
              다시 시도
            </button>
          }
        >
          {failed && <p>추가 기사를 불러오지 못했어요</p>}
          <p>읽던 내용은 그대로 있어요.</p>
        </Notice>
      )}
    </>
  );
}
