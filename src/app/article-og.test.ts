import { afterEach, expect, test, vi } from 'vitest';

import { generateMetadata } from './incidents/[id]/page';
import {
  articleOgDetails,
  articleOgTitleLines,
} from '@/features/article-detail/model/article-og';

const id = 'a'.repeat(64);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('articleMetadataProvidesSpecificPngAndBrandFallback', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://api.example.test');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        article_id: id,
        image_status: 'disabled',
        image_url: null,
        article: {
          title: '서울 안전 <b>안내</b>',
          description: '기사 요약입니다.',
          pubDate: '2026-11-20T00:00:00Z',
          originallink: 'https://news.example.test/article',
          link: '',
        },
      }),
    ),
  );
  const metadata = await generateMetadata({ params: Promise.resolve({ id }) });
  const openGraph = metadata.openGraph as { images: Array<{ url: string }> };
  const twitter = metadata.twitter as { images: Array<{ url: string }> };
  expect(openGraph.images[0].url).toMatch(
    new RegExp(`/og/incidents/${id}\\.png\\?v=[a-f0-9]{16}$`),
  );
  expect(openGraph.images[1].url).toBe('/og/site-v2.png');
  expect(twitter.images[0].url).toBe(openGraph.images[0].url);
});

test('articleOgWrapsLongTitlesAtWordBoundariesAndLimitsLines', () => {
  expect(articleOgTitleLines('서울 중구 도로 통제, 우회 안내')).toEqual([
    '서울 중구 도로 통제,',
    '우회 안내',
  ]);
  const lines = articleOgTitleLines(
    '기상 악화로 여러 지역의 도로가 통제되어 우회가 필요하다는 안내가 이어지고 있습니다. 안전한 이동을 위해 원문을 확인하세요.',
  );
  expect(lines).toHaveLength(4);
  expect(lines[3]).toMatch(/…$/);
  expect(lines.every((line) => Array.from(line).length <= 14)).toBe(true);
});

test('articleOgVersionTracksSafeDisplayedFactsOnly', () => {
  const item = {
    article_id: id,
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '서울 <b>안전</b> &amp; 안내',
      description: '요약',
      pubDate: '2026-11-20T00:00:00Z',
      originallink: 'https://publisher.example.test/a?token=PRIVATE_TOKEN',
      link: '',
    },
  };
  const first = articleOgDetails(item, 'https://api.example.test');
  expect(first?.title).toBe('서울 안전 & 안내');
  expect(first?.hostname).toBe('publisher.example.test');
  expect(first?.image.url).not.toContain('PRIVATE_TOKEN');
  expect(first?.image.url).not.toContain('publisher');
  const changed = articleOgDetails(
    { ...item, article: { ...item.article, title: '다른 안전 안내' } },
    'https://api.example.test',
  );
  expect(changed?.version).not.toBe(first?.version);
  const privateSource = articleOgDetails(
    {
      ...item,
      article: {
        ...item.article,
        originallink: 'https://api.example.test/private',
      },
    },
    'https://api.example.test',
  );
  expect(privateSource?.hostname).toBeNull();
  expect(
    articleOgDetails(
      { ...item, article: { ...item.article, title: ' <b> </b> ' } },
      'https://api.example.test',
    ),
  ).toBeNull();
});

test('articleOgMarksTruncatedSourceHostnameWithoutChangingSource', () => {
  const host = 'news-regional-information.long-publisher.example.co.kr';
  const source = `https://${host}/article`;
  const item = {
    article_id: id,
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '지역 기사',
      description: '요약',
      pubDate: '2026-11-20T00:00:00Z',
      originallink: source,
      link: '',
    },
  };
  const details = articleOgDetails(item, 'https://api.example.test');

  expect(details).toMatchObject({
    hostname: host,
    displayHostname: `${host.slice(0, 11)}…${host.slice(-16)}`,
  });
  expect(item.article.originallink).toBe(source);
  const short = articleOgDetails(
    {
      ...item,
      article: {
        ...item.article,
        originallink: 'https://news.example.kr/article',
      },
    },
    'https://api.example.test',
  );
  expect(short).toMatchObject({ displayHostname: 'news.example.kr' });
});
