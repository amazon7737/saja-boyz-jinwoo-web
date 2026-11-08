import Image from 'next/image';
import Link from 'next/link';

import { IconText } from '@/components/ui/icon-text/icon-text';
import { Notice } from '@/components/feedback/notice';
import { ArticleSkeleton } from '@/components/feedback/article-skeleton';
import {
  categoryLabels,
  statusLabels,
} from '@/features/incidents/model/labels';
import type { Incident } from '@/features/incidents/model/types';
import { formatRelativeTime } from '@/lib/relative-time';

import styles from './incident-list.module.css';

type IncidentListProps =
  | { state: 'loading'; now: Date }
  | { state: 'ready'; incidents: readonly Incident[]; now: Date };

function getIncidentHref(id: string): string | null {
  if (id === '' || id === '.' || id === '..') return null;

  try {
    return `/incidents/${encodeURIComponent(id)}`;
  } catch (error) {
    if (error instanceof URIError) return null;
    throw error;
  }
}

export function IncidentList(props: IncidentListProps) {
  if (props.state === 'loading') {
    return <ArticleSkeleton label="사건을 불러오는 중" initial />;
  }

  if (props.incidents.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        <Notice title="조건에 맞는 사건이 없어요">
          검색어나 필터를 바꿔보세요
        </Notice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {props.incidents.map((incident) => {
        const href = getIncidentHref(incident.id);
        const content = (
          <>
            {incident.imageUrl ? (
              <Image
                className="block size-20 rounded-lg object-cover"
                src={incident.imageUrl}
                alt=""
                width={80}
                height={80}
                unoptimized
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-lg bg-background text-[11px] text-muted">
                사진 없음
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap gap-1">
                <span
                  className={styles.badge}
                  data-category={incident.category}
                >
                  {categoryLabels[incident.category]}
                </span>
                <span className={styles.badge} data-status={incident.status}>
                  {statusLabels[incident.status]}
                </span>
              </div>
              <h2 className="m-0 truncate text-[14px]/[normal] font-extrabold text-text">
                {incident.title}
              </h2>
              <p className="m-0 flex min-w-0 items-center gap-1.5 text-[11px]/[normal] text-muted">
                <IconText icon="pin" size="compact" textClassName="truncate">
                  {incident.location.address}
                </IconText>
                <span aria-hidden="true">·</span>
                <time
                  className="shrink-0 whitespace-nowrap"
                  dateTime={incident.occurredAt}
                >
                  {formatRelativeTime(incident.occurredAt, props.now)}
                </time>
              </p>
              <p className="m-0 line-clamp-2 text-[12px]/4 text-muted [overflow-wrap:anywhere]">
                {incident.summary}
              </p>
              {href === null && (
                <p className="m-0 text-[12px]/4 text-muted">상세 정보 없음</p>
              )}
            </div>
          </>
        );

        return (
          <article className="min-w-0" key={incident.id}>
            {href === null ? (
              <div className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-3 rounded-card border border-solid border-border bg-surface p-3 shadow-[0_4px_8px_rgb(0_0_0/3%)]">
                {content}
              </div>
            ) : (
              <Link
                className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-3 rounded-card border border-solid border-border bg-surface p-3 shadow-[0_4px_8px_rgb(0_0_0/3%)]"
                href={href}
              >
                {content}
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
