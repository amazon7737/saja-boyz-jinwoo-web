import Link from 'next/link';

export default function ArticleDetailNotFound() {
  return (
    <section className="mt-6 flex flex-col gap-5 rounded-card bg-surface p-6 text-text">
      <h1 className="m-0 text-[22px]/[30px] font-bold">
        기사를 찾을 수 없어요
      </h1>
      <Link
        href="/incidents"
        className="self-start text-sm font-bold text-brand underline underline-offset-4"
      >
        목록으로
      </Link>
    </section>
  );
}
