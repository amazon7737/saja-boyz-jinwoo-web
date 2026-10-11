import Image from 'next/image';
import Link from 'next/link';

import {
  categoryLabels,
  statusLabels,
} from '@/features/incidents/model/labels';
import type { Incident } from '@/features/incidents/model/types';

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

function formatRelativeTime(occurredAt: string, now: Date) {
  const minutes = Math.floor(
    (now.getTime() - new Date(occurredAt).getTime()) / 60_000,
  );

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}

export function IncidentList(props: IncidentListProps) {
  if (props.state === 'loading') {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-card border border-solid border-border bg-surface px-4 py-6 text-center"
          role="status"
          aria-busy="true"
        >
          <p className="m-0 text-[14px]/[1.5] font-bold text-text">
            사건을 불러오는 중
          </p>
        </div>
      </div>
    );
  }

  if (props.incidents.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-card border border-solid border-border bg-surface px-4 py-6 text-center"
          role="status"
        >
          <p className="m-0 text-[14px]/[1.5] font-bold text-text">
            조건에 맞는 사건이 없어요
          </p>
          <p className="m-0 text-[12px]/4 text-muted">
            검색어나 필터를 바꿔보세요
          </p>
        </div>
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
              <p className="m-0 flex min-w-0 items-baseline gap-1 text-[11px]/[normal] text-muted">
                <span aria-hidden="true">📍</span>
                <span className="min-w-0 truncate">
                  {incident.location.address}
                </span>
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
