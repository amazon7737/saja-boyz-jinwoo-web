import Link from 'next/link';

export function FoundationPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mt-6 rounded-card border border-solid border-border bg-surface p-6">
      <p className="text-xs leading-[1.7] font-bold text-brand">
        개발 준비 화면
      </p>
      <h1 className="mt-0 mb-3 text-2xl leading-[1.4]">{title}</h1>
      <p className="text-muted leading-[1.7]">{description}</p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link
          className="rounded-xl border border-solid border-border bg-background px-3.5 py-2.5"
          href="/"
        >
          지도 홈
        </Link>
        <Link
          className="rounded-xl border border-solid border-border bg-background px-3.5 py-2.5"
          href="/search"
        >
          검색
        </Link>
        <Link
          className="rounded-xl border border-solid border-border bg-background px-3.5 py-2.5"
          href="/incidents"
        >
          사건 목록
        </Link>
        <Link
          className="rounded-xl border border-solid border-border bg-background px-3.5 py-2.5"
          href="/report"
        >
          제보
        </Link>
      </div>
    </section>
  );
}
