'use client';

import { useEffect, useState } from 'react';

import { ArticleSkeleton } from '@/components/feedback/article-skeleton';
import { Notice } from '@/components/feedback/notice';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

import { usePopularRanking } from '../../model/use-rolling-search-prompt';
import { PopularArticleCard } from './popular-article-card';

type Card = { id: string; item: ArticleCollectionItem; apiOrigin: string };
type Result = { key: string; attempt: number; cards: Card[]; failed: boolean };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validCard(
  value: unknown,
  expectedId: string,
): value is Card & { status: 'success' } {
  if (
    !record(value) ||
    value.id !== expectedId ||
    value.status !== 'success' ||
    typeof value.apiOrigin !== 'string' ||
    !record(value.item) ||
    !record(value.item.article)
  )
    return false;

  try {
    const origin = new URL(value.apiOrigin);
    const item = value.item;
    const article = item.article as Record<string, unknown>;

    return (
      ['http:', 'https:'].includes(origin.protocol) &&
      !origin.username &&
      !origin.password &&
      origin.origin === value.apiOrigin &&
      item.article_id === expectedId &&
      typeof item.image_status === 'string' &&
      (item.image_url === null || typeof item.image_url === 'string') &&
      ['title', 'description', 'pubDate', 'originallink', 'link'].every(
        (key) => typeof article[key] === 'string',
      )
    );
  } catch {
    return false;
  }
}

export function PopularArticles() {
  const ranking = usePopularRanking();
  const ids = ranking.items.map((item) => item.article_id);
  const key = ids.join(',');
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (ranking.status !== 'ready' || !key) return;
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
  }, [ranking.status, key]);

  useEffect(() => {
    if (ranking.status !== 'ready' || !key) return;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 7000);
    const expected = key.split(',');
    const params = new URLSearchParams();

    expected.forEach((id) => params.append('id', id));

    void (async () => {
      try {
        const response = await fetch('/api/search-popular-cards?' + params, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('unavailable');
        const payload: unknown = await response.json();

        if (
          !record(payload) ||
          !Array.isArray(payload.items) ||
          payload.items.length !== expected.length
        )
          throw new Error('invalid');
        const cards: Card[] = [];
        let failed = false;

        for (let index = 0; index < expected.length; index++) {
          const item: unknown = payload.items[index];

          if (validCard(item, expected[index])) cards.push(item);
          else failed = true;
        }

        if (active) setResult({ key, attempt, cards, failed });
      } catch {
        if (active) setResult({ key, attempt, cards: [], failed: true });
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, ranking.status, attempt]);

  const active =
    result?.key === key && result.attempt === attempt ? result : null;
  const loading =
    ranking.status === 'loading' ||
    (ranking.status === 'ready' && Boolean(key) && !active);
  const failed = ranking.status === 'error' || Boolean(active?.failed);
  const empty = ranking.status === 'ready' && !key;
  const byId = new Map(active?.cards.map((card) => [card.id, card]) ?? []);

  return (
    <section aria-labelledby="popular-articles" className="flex flex-col gap-3">
      <h2
        id="popular-articles"
        className="m-0 text-[12px]/[15px] font-bold text-muted"
      >
        🔥 지금 핫한 사건<span className="sr-only"> · 오늘 조회순</span>
      </h2>
      {loading && (
        <ArticleSkeleton
          label="인기 기사를 불러오는 중이에요"
          variant="search"
        />
      )}
      {empty && (
        <p className="m-0 text-xs text-muted">
          아직 오늘 조회된 기사가 없어요.
        </p>
      )}
      {active && active.cards.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {ranking.items.map((rank, index) => {
            const card = byId.get(rank.article_id);

            if (!card) return null;

            return (
              <li key={rank.article_id}>
                <span className="sr-only">{index + 1}위</span>
                <PopularArticleCard
                  item={card.item}
                  apiOrigin={card.apiOrigin}
                  now={now}
                />
              </li>
            );
          })}
        </ol>
      )}
      {failed && (
        <Notice
          role="alert"
          title="인기 기사를 불러오지 못했어요"
          action={
            <button
              type="button"
              className="ui-control border-0 bg-transparent p-0 text-brand underline"
              onClick={() => {
                if (ranking.status === 'error') ranking.retry();
                else {
                  setResult(null);
                  setAttempt((value) => value + 1);
                }
              }}
            >
              다시 시도
            </button>
          }
        >
          <p>잠시 후 다시 확인해 주세요.</p>
        </Notice>
      )}
    </section>
  );
}
