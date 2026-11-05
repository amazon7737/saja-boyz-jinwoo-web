'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useId, useState } from 'react';

import { IconText } from '@/components/ui/icon-text/icon-text';
import { DetailSheet } from '@/features/article-detail/ui/detail-sheet/detail-sheet';
import { useArticleSheetRoute } from '@/features/article-detail/model/article-sheet-context';
import {
  articleText,
  publicationDate,
  publicationText,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';
import { ArticleImage } from '@/features/article-list/ui/article-image/article-image';

import type { LocatedArticle } from '../../model/map-article.types';

export function MapArticleSheet({
  items,
  apiOrigin,
  onClose,
  onHeightChange,
  active = true,
}: {
  items: LocatedArticle[];
  apiOrigin: string;
  onClose(): void;
  onHeightChange?(height: number): void;
  active?: boolean;
}) {
  const route = useArticleSheetRoute();
  const titleId = useId();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview =
    items.length > 1
      ? items.find((item) => item.article_id === previewId)
      : undefined;

  const sheet = (
    <DetailSheet
      titleId={titleId}
      label="선택한 기사"
      initialExpanded={false}
      onClose={onClose}
      closeLabel="기사 선택 닫기"
      onHeightChange={onHeightChange}
      active={active && !preview}
    >
      <h1
        id={titleId}
        className={
          items.length === 1 ? 'sr-only' : 'm-0 text-sm font-bold text-muted'
        }
      >
        선택한 위치의 기사 {items.length}건
      </h1>
      {items.map((item) => {
        const publishedAt = publicationDate(item.article.pubDate);
        const imageUrl =
          item.image_status === 'ready' &&
          /^[a-f0-9]{64}$/.test(item.article_id) &&
          item.image_url === '/images/' + item.article_id + '.jpg'
            ? new URL(item.image_url, apiOrigin).href
            : null;

        const sourceUrl =
          safeSourceUrl(item.article.originallink) ??
          safeSourceUrl(item.article.link);
        const single = items.length === 1;

        return (
          <article
            key={item.article_id}
            className={
              single
                ? 'flex min-w-0 shrink-0 flex-col gap-4'
                : 'flex shrink-0 flex-col gap-3 rounded-lg border border-solid border-border bg-background p-2.5'
            }
          >
            <div className={single ? 'flex flex-col gap-3' : 'contents'}>
              <h2
                className={
                  single
                    ? 'm-0 text-[18px]/[normal] font-extrabold text-text [overflow-wrap:anywhere]'
                    : 'm-0 text-[15px]/[21px] font-extrabold text-text [overflow-wrap:anywhere]'
                }
              >
                {route && items.length === 1 ? (
                  articleText(item.article.title)
                ) : (
                  <Link
                    scroll={false}
                    href={'/incidents/' + item.article_id}
                    onClick={(event) => {
                      if (
                        !route ||
                        event.defaultPrevented ||
                        event.button !== 0 ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.currentTarget.target === '_blank'
                      )
                        return;

                      event.preventDefault();
                      event.currentTarget.focus({ preventScroll: true });
                      setPreviewId(item.article_id);
                    }}
                  >
                    {articleText(item.article.title)}
                  </Link>
                )}
              </h2>
              <div
                className={
                  single
                    ? 'flex flex-col gap-1'
                    : 'flex flex-wrap items-center gap-x-3 gap-y-1'
                }
              >
                <p className="m-0 text-[13px]/[18px] font-medium text-muted">
                  {single ? (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Image
                        src="/figma/preview-location.svg"
                        alt=""
                        width={16}
                        height={16}
                        unoptimized
                        className="size-4 shrink-0"
                      />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {item.location.label}
                      </span>
                    </span>
                  ) : (
                    <IconText
                      icon="pin"
                      iconClassName="text-brand"
                      textClassName="[overflow-wrap:anywhere]"
                    >
                      {item.location.label}
                    </IconText>
                  )}
                </p>
                <p className="m-0 text-[12px]/4 text-slate-400">
                  {Number.isNaN(publishedAt.getTime()) ? (
                    '발행 시각 미확인'
                  ) : single ? (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Image
                        src="/figma/preview-date.svg"
                        alt=""
                        width={16}
                        height={16}
                        unoptimized
                        className="size-4 shrink-0"
                      />
                      <span>
                        <span className="sr-only">기사 발행 </span>
                        <time dateTime={publishedAt.toISOString()}>
                          {publicationText(publishedAt)}
                        </time>
                      </span>
                    </span>
                  ) : (
                    <>
                      기사 발행{' '}
                      <time dateTime={publishedAt.toISOString()}>
                        {publicationText(publishedAt)}
                      </time>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div
              className={
                single ? 'flex flex-col gap-3' : 'flex items-start gap-3'
              }
            >
              <div className={single ? 'w-full' : 'w-20 shrink-0'}>
                <ArticleImage
                  key={imageUrl}
                  src={imageUrl}
                  showAiCaption
                  wide={single}
                />
              </div>
              <p className="m-0 min-w-0 text-[13px]/[1.5] text-muted [overflow-wrap:anywhere]">
                {articleText(item.article.description)}
              </p>
            </div>
            {single &&
              (sourceUrl ? (
                <div className="flex min-w-0 items-center gap-1.5 py-1 text-[12px]/[15px] text-muted">
                  <span className="shrink-0">출처:</span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`기사 원문 · ${new URL(sourceUrl).hostname}`}
                    className="ui-link inline-flex min-w-0 items-center gap-1.5"
                  >
                    <IconText
                      icon="link"
                      size="compact"
                      position="end"
                      textClassName="truncate underline decoration-slate-300 underline-offset-2"
                    >
                      <span className="sr-only">기사 원문 · </span>
                      {new URL(sourceUrl).hostname}
                    </IconText>
                  </a>
                </div>
              ) : (
                <p className="m-0 py-1 text-[12px]/[15px] text-muted">
                  원문 링크 없음
                </p>
              ))}
            <p className="m-0 text-[11px]/4 text-muted">
              {item.location.precision === 'address'
                ? '기사에 언급된 주소 기준 위치'
                : item.location.precision === 'neighborhood'
                  ? '기사에 언급된 동네 기준 위치 · 실제 발생 지점과 다를 수 있습니다'
                  : '지역 대표 위치 · 실제 발생 지점과 다를 수 있습니다'}
            </p>
            {route && items.length === 1 && (
              <Link
                scroll={false}
                href={'/incidents/' + item.article_id}
                className="ui-control inline-flex min-h-12 items-center justify-center rounded-xl border border-solid border-brand bg-surface px-4 py-3 text-sm font-bold text-brand"
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.currentTarget.target === '_blank'
                  )
                    return;

                  event.preventDefault();
                  event.currentTarget.focus({ preventScroll: true });
                  route.openArticle(item.article_id);
                }}
              >
                자세히 보기
              </Link>
            )}
          </article>
        );
      })}
    </DetailSheet>
  );

  return (
    <>
      {createPortal(sheet, document.body)}
      {preview && (
        <MapArticleSheet
          items={[preview]}
          apiOrigin={apiOrigin}
          active={active}
          onHeightChange={onHeightChange}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  );
}
