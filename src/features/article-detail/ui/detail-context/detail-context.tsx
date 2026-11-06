'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  publicationDate,
  publicationText,
} from '@/features/article-list/model/article-presentation';

import { useArticleSheetRoute } from '../../model/article-sheet-context';
import { useDetailLocation } from '../../model/detail-location-context';

export function DetailLocation({ id }: { id: string }) {
  const state = useDetailLocation(id);

  if (state.status === 'loading')
    return (
      <span className="sr-only" role="status">
        기사 위치를 확인하고 있어요
      </span>
    );
  if (state.status === 'error')
    return (
      <p className="m-0 text-xs text-muted" role="alert">
        위치를 불러오지 못했어요{' '}
        <button
          type="button"
          className="ui-control inline-flex min-h-11 items-center border-0 bg-transparent px-2 text-brand underline"
          onClick={state.retry}
        >
          다시 시도
        </button>
      </p>
    );
  const location = state.data?.location;

  if (!location) return null;
  const precision =
    location.precision === 'address'
      ? '기사에 언급된 주소'
      : location.precision === 'neighborhood'
        ? '동네 기준 위치'
        : '지역 대표 위치';

  return (
    <p className="m-0 flex items-start gap-1 text-[13px]/[18px] font-medium text-muted">
      <span className="inline-flex min-w-0 items-center gap-1">
        <Image
          src="/figma/preview-location.svg"
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          unoptimized
          className="size-4 shrink-0"
        />
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {location.label} · {precision}
          {location.precision !== 'address' && (
            <span className="sr-only">
              {' '}
              · 실제 발생 지점과 다를 수 있습니다
            </span>
          )}
        </span>
      </span>
    </p>
  );
}

export function RelatedArticles({ id }: { id: string }) {
  const route = useArticleSheetRoute();
  const related = useDetailLocation(id).data?.related ?? [];

  if (!related.length) return null;

  return (
    <section aria-label="주변 핫한 사건" className="flex flex-col gap-2.5">
      <h2 className="m-0 text-[12px]/[15px] font-bold text-muted">
        주변 핫한 사건
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {related.map((item) => {
          const published = publicationDate(item.publishedAt);

          return (
            <li key={item.articleId}>
              <Link
                href={'/incidents/' + item.articleId}
                replace={route?.active}
                scroll={false}
                className="ui-link flex flex-col gap-1.5 rounded-lg border border-solid border-[#e3e8f0] bg-[#f7fafc] p-2.5"
              >
                <span className="self-end text-[11px]/[13px] text-muted">
                  {Number.isNaN(published.getTime()) ? (
                    '발행 시각 미확인'
                  ) : (
                    <time dateTime={published.toISOString()}>
                      {publicationText(published)}
                    </time>
                  )}
                </span>
                <span className="text-[13px]/[16px] font-bold text-text">
                  {item.title}
                </span>
                <span className="text-[11px]/[13px] text-muted">
                  {item.locationLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
