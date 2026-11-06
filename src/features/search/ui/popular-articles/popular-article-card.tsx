import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
import {
  articleText,
  publicationDate,
} from '@/features/article-list/model/article-presentation';

import { ArticlePreviewCard } from '../article-preview-card/article-preview-card';

export function PopularArticleCard({
  item,
  apiOrigin,
  now,
}: {
  item: ArticleCollectionItem;
  apiOrigin: string;
  now: Date | null;
}) {
  const { article_id, article } = item;
  const date = publicationDate(article.pubDate);
  const imageUrl =
    item.image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(article_id) &&
    item.image_url === `/images/${article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <ArticlePreviewCard
      id={article_id}
      title={articleText(article.title)}
      publishedAt={Number.isNaN(date.getTime()) ? null : date.toISOString()}
      imageUrl={imageUrl}
      now={now}
    />
  );
}
