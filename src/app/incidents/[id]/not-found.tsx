import { ListLink } from '@/components/layout/list-link/list-link';
import { Notice } from '@/components/feedback/notice';
import { DetailSheet } from '@/features/article-detail/ui/detail-sheet/detail-sheet';

export default function ArticleDetailNotFound() {
  return (
    <DetailSheet titleId="missing-article-sheet">
      <h1
        id="missing-article-sheet"
        className="m-0 text-[18px]/6 font-extrabold"
      >
        기사를 찾을 수 없어요
      </h1>
      <Notice
        title="다른 소식도 살펴볼까요?"
        action={<ListLink>목록으로</ListLink>}
      >
        링크를 확인하거나 목록에서 다른 소식을 살펴보세요.
      </Notice>
    </DetailSheet>
  );
}
