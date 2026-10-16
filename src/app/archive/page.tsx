import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import { ArticleList } from '@/features/article-list/ui/article-list/article-list';

import { pageMetadata } from '../site-metadata';

export const dynamic = 'force-dynamic';

const pageSize = 20;

type ArchiveProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function archivePath(page: number) {
  return page === 1 ? '/archive' : `/archive?page=${page}`;
}

async function archivePage(searchParams: ArchiveProps['searchParams']) {
  const { page: raw = '1' } = await searchParams;
  const input = Array.isArray(raw) ? raw[0] : raw;

  if (typeof input !== 'string' || !/^[1-9]\d*$/.test(input)) notFound();
  const page = Number(input);
  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) notFound();

  return { page, offset };
}

const fetchArchive = cache((offset: number) =>
  fetchArticleList(undefined, offset),
);

export async function generateMetadata({
  searchParams,
}: ArchiveProps): Promise<Metadata> {
  const { page, offset } = await archivePage(searchParams);
  const result = await fetchArchive(offset);

  return {
    ...pageMetadata(
      `기사 아카이브 · ${page}페이지`,
      '수집된 사건 사고 기사를 페이지별로 살펴보세요.',
      archivePath(page),
    ),
    ...(!result || result.items.length === 0
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function ArchivePage({ searchParams }: ArchiveProps) {
  const { page, offset } = await archivePage(searchParams);
  const result = await fetchArchive(offset);
  const nextOffset = offset + pageSize;
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
      <Link href="/incidents" className="ui-link text-brand underline">
        최신 기사 목록
      </Link>
      {result ? (
        <ArticleList items={result.items} apiOrigin={result.apiOrigin} />
      ) : (
        <div role="alert" className="py-4">
          기사를 불러오지 못했어요{' '}
          <Link
            href={archivePath(page)}
            className="ui-link text-brand underline"
          >
            다시 시도
          </Link>
        </div>
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
