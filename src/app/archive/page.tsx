import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

import { pageMetadata } from '../site-metadata';
import {
  ArchiveContent,
  archiveDescription,
  archivePath,
  parseArchivePage,
} from './archive-page';

export const dynamic = 'force-dynamic';

type ArchiveProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

async function archivePage(searchParams: ArchiveProps['searchParams']) {
  const { page } = await searchParams;
  const parsed = parseArchivePage(page);

  if (!parsed) notFound();

  return parsed;
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
      archiveDescription,
      archivePath(page),
    ),
    ...(result && result.items.length === 0
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function ArchivePage({ searchParams }: ArchiveProps) {
  const { page, offset } = await archivePage(searchParams);

  return <ArchiveContent page={page} result={await fetchArchive(offset)} />;
}
