import Link from 'next/link';

import { ListLink } from '@/components/layout/list-link/list-link';
import { Notice } from '@/components/feedback/notice';
import type { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import { ArticleList } from '@/features/article-list/ui/article-list/article-list';

export const archivePageSize = 20;

export const archiveDescription =
  '수집된 사건 사고 기사를 페이지별로 살펴보세요.';

export type ArchiveResult = Awaited<ReturnType<typeof fetchArticleList>>;

export function archivePath(page: number) {
  return page === 1 ? '/archive' : `/archive?page=${page}`;
}

export function parseArchivePage(raw: string | string[] | undefined) {
  const input = Array.isArray(raw) ? raw[0] : (raw ?? '1');

  if (typeof input !== 'string' || !/^[1-9]\d*$/.test(input)) return null;
  const page = Number(input);
  const offset = (page - 1) * archivePageSize;

  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) return null;

  return { page, offset };
}

export function ArchiveContent({
  page,
  result,
}: {
  page: number;
  result: ArchiveResult;
}) {
  const nextOffset = page * archivePageSize;
  const hasNext =
    result &&
    result.items.length > 0 &&
    Number.isSafeInteger(nextOffset) &&
    nextOffset < result.total;

  return (
    <section aria-label="기사 아카이브" className="px-4 py-6 text-text">
      <h1 className="m-0 text-[22px]/[30px] font-extrabold">기사 아카이브</h1>
      <p className="text-sm text-muted">
        수집된 기사를 페이지별로 살펴보세요. 새 기사가 수집되면 페이지의 기사
        위치가 바뀔 수 있어요.
      </p>
      <ListLink className="ui-link text-brand underline">
        최신 기사 목록
      </ListLink>
      {result ? (
        <ArticleList items={result.items} apiOrigin={result.apiOrigin} />
      ) : (
        <Notice
          role="alert"
          title="주변 소식을 다시 이어볼까요?"
          action={
            <a
              href={archivePath(page)}
              className="ui-link text-brand underline"
            >
              다시 시도
            </a>
          }
        >
          기사를 불러오지 못했어요 <p>연결을 확인한 뒤 다시 눌러주세요.</p>
        </Notice>
      )}
      <nav
        aria-label="아카이브 페이지"
        className="flex items-center gap-4 py-4"
      >
        {page > 1 && (
          <Link href={archivePath(page - 1)} className="ui-link text-brand">
            이전 페이지
          </Link>
        )}
        <span aria-current="page">{page}페이지</span>
        {hasNext && (
          <Link href={archivePath(page + 1)} className="ui-link text-brand">
            다음 페이지
          </Link>
        )}
      </nav>
    </section>
  );
}
