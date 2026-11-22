import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import {
  ArchiveContent,
  archiveDescription,
  archivePath,
  parseArchivePage,
  type ArchiveResult,
} from '@/app/archive/archive-page';
import {
  siteImage,
  siteName,
  siteOrigin,
  siteTitle,
} from '@/app/site-metadata';

type Props = { page: number; result: ArchiveResult };

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
  res,
}) => {
  const parsed = parseArchivePage(query.page);

  if (!parsed) return { notFound: true };

  res.setHeader('Cache-Control', 'private, no-store');
  res.statusCode = 503;
  res.setHeader('Retry-After', '60');

  return { props: { page: parsed.page, result: null } };
};

export default function ArchiveDocument({ page, result }: Props) {
  const title = `기사 아카이브 · ${page}페이지`;
  const url = `${siteOrigin}${archivePath(page)}`;
  const image = `${siteOrigin}${siteImage.url}`;

  return (
    <>
      <Head>
        <title>{`${title} · ${siteTitle}`}</title>
        <meta name="description" content={archiveDescription} />
        <link rel="canonical" href={url} />
        {result && result.items.length === 0 && (
          <meta name="robots" content="noindex, follow" />
        )}
        <meta
          name="google-site-verification"
          content="IcxmSOOduOPPwcV3PD9YDBJp3EpnuujvxkfxK7ObCyU"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={archiveDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content={String(siteImage.width)} />
        <meta property="og:image:height" content={String(siteImage.height)} />
        <meta property="og:image:alt" content={siteImage.alt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={archiveDescription} />
        <meta name="twitter:image" content={image} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </Head>
      <ArchiveContent page={page} result={result} />
    </>
  );
}
