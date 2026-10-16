import { ArticleSkeleton } from '@/components/feedback/article-skeleton';

export default function SearchLoading() {
  return (
    <ArticleSkeleton
      label="검색 결과를 불러오는 중이에요"
      variant="search"
      initial
    />
  );
}
