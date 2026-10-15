import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

export type LocatedArticle = ArticleCollectionItem & {
  collection_id: string;
  location_status: 'resolved';
  location_reason: null;
  location: {
    latitude: number;
    longitude: number;
    label: string;
    precision: 'address' | 'neighborhood' | 'region';
    evidence: { field: 'title' | 'description'; text: string };
  };
};

export type MapArticleResult = {
  total: number;
  items: LocatedArticle[];
  apiOrigin: string;
};
