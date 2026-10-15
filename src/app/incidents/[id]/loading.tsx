export default function ArticleDetailLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mt-6 rounded-card bg-surface p-6 text-sm text-muted"
    >
      기사를 불러오는 중
    </div>
  );
}
