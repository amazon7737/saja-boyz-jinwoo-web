export type ArticleCollectionItem = {
  article_id: string;
  image_status: string;
  image_url: string | null;
  article: {
    title: string;
    description: string;
    originallink: string;
    link: string;
    pubDate: string;
  };
};
