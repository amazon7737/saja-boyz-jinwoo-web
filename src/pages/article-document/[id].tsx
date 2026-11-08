import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { renderDetail } from '@/app/incidents/[id]/article-content';
import { loadDetail } from '@/app/incidents/[id]/load-detail';
import NotFound from '@/app/not-found';
import {
  siteImage,
  siteName,
  siteOrigin,
  siteTitle,
} from '@/app/site-metadata';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import {
  articleDescription,
  articleTitle,
} from '@/features/article-list/model/article-presentation';

type Result = Awaited<ReturnType<typeof loadDetail>>;
type Props = { id: string; result: Result };

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
  res,
}) => {
  const id = String(params?.id ?? '');
  const loaded = await loadDetail(id);
  // Only fields used by the page are exposed to the browser through Next's page data.
  const result: Result =
    loaded.status === 'success'
      ? {
          status: 'success',
          apiOrigin: loaded.apiOrigin,
          item: {
            article_id: loaded.item.article_id,
            image_status: loaded.item.image_status,
            image_url: loaded.item.image_url,
            article: {
              title: loaded.item.article.title,
              description: loaded.item.article.description,
              pubDate: loaded.item.article.pubDate,
              originallink: loaded.item.article.originallink,
              link: loaded.item.article.link,
            },
          },
        }
      : loaded;

  res.statusCode =
    result.status === 'not-found' ? 404 : result.status === 'error' ? 503 : 200;
  res.setHeader('Cache-Control', 'private, no-store');

  if (result.status === 'error') {
    res.setHeader('Retry-After', '60');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
  }

  return { props: { id, result } };
};

export default function ArticleDocument({ id, result }: Props) {
  const title =
    result.status === 'success'
      ? articleTitle(result.item.article.title)
      : result.status === 'error'
        ? '기사를 불러오지 못했어요'
        : '이 기사는 찾을 수 없어요';
  const description =
    result.status === 'success'
      ? articleDescription(result.item.article.description)
      : '연결을 확인한 뒤 다시 눌러주세요.';
  const url = `${siteOrigin}/incidents/${id}`;
  const image = `${siteOrigin}${siteImage.url}`;

  return (
    <>
      <Head>
        {result.status === 'error' && (
          <script src="/article-detail/error-retry.js" defer />
        )}
        <title>{`${title} · ${siteTitle}`}</title>
        <meta name="description" content={description} />
        {result.status !== 'not-found' && <link rel="canonical" href={url} />}
        {result.status !== 'error' && (
          <meta
            name="robots"
            content={
              result.status === 'success' ? 'index, follow' : 'noindex, follow'
            }
          />
        )}
        <meta
          name="google-site-verification"
          content="IcxmSOOduOPPwcV3PD9YDBJp3EpnuujvxkfxK7ObCyU"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content={String(siteImage.width)} />
        <meta property="og:image:height" content={String(siteImage.height)} />
        <meta property="og:image:alt" content={siteImage.alt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </Head>
      {result.status === 'not-found' ? (
        <NotFound />
      ) : (
        renderDetail(
          id,
          result,
          <a
            href={`/incidents/${id}`}
            aria-label="다시 시도"
            aria-busy="false"
            data-detail-retry
            className="inline-flex items-center gap-2 text-sm font-bold text-brand"
          >
            <span
              className="spinner inline-flex size-4 [&[hidden]]:hidden"
              role="status"
              aria-busy="true"
              hidden
            >
              <LoadingSpinner />
              <span className="sr-only">기사를 다시 불러오는 중이에요</span>
            </span>
            <span className="underline underline-offset-4">다시 시도</span>
          </a>,
        )
      )}
    </>
  );
}
