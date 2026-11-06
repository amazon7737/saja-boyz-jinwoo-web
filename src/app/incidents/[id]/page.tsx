import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { pageMetadata } from '@/app/site-metadata';
import {
  articleDescription,
  articleTitle,
} from '@/features/article-list/model/article-presentation';

import { loadDetail } from './load-detail';
import { renderDetail } from './article-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'not-found') {
    return {
      title: '이 기사는 찾을 수 없어요',
      robots: { index: false, follow: true },
    };
  }

  if (result.status === 'error') {
    return {
      ...pageMetadata(
        '기사를 불러오지 못했어요',
        '연결을 확인한 뒤 다시 눌러주세요.',
        '/incidents/' + id,
      ),
      robots: { index: false, follow: true },
    };
  }

  const title = articleTitle(result.item.article.title);
  const description = articleDescription(result.item.article.description);

  return {
    ...pageMetadata(title, description, `/incidents/${id}`),
    robots: { index: true, follow: true },
  };
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'not-found') notFound();

  return renderDetail(id, result);
}
