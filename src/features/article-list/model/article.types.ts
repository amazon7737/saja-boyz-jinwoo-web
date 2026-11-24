import type { IncidentCategory } from '@/features/incidents/model/types';

export type ArticleCollectionItem = {
  article_id: string;
  image_status: string;
  image_url: string | null;
  category: IncidentCategory | null;
  article: {
    title: string;
    description: string;
    originallink: string;
    link: string;
    pubDate: string;
  };
};
