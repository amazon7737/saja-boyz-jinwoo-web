import Link from 'next/link';

import { siteName, siteOrigin } from '@/app/site-metadata';

export function ServiceIntro() {
  return (
    <section
      aria-label="흉흉 서비스 안내"
      className="bg-surface px-4 pt-6 pb-[calc(110px_+_env(safe-area-inset-bottom))] text-text"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            url: siteOrigin,
          }).replace(/</g, '\\u003c'),
        }}
      />
      <h2 className="m-0 text-base font-bold">흉흉 · 내 주변의 사건 사고</h2>
      <p className="text-sm leading-6 text-muted">
        주변의 사건 사고 기사를 지도와 목록에서 살펴보세요. 지역 대표 좌표는
        실제 현장과 다를 수 있으며, 기사 요약과 원문에서 내용을 확인할 수
        있어요.
      </p>
      <nav aria-label="서비스와 기사 안내" className="flex flex-wrap gap-4">
        <Link href="/about" className="ui-link py-2 text-brand underline">
          서비스 안내
        </Link>
        <Link href="/incidents" className="ui-link py-2 text-brand underline">
          기사 목록
        </Link>
      </nav>
    </section>
  );
}
