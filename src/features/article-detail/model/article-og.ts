import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
import {
  articleTitle,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';

export function articleOgTitleLines(title: string) {
  const visible: string[] = [];
  let hasMore = false;

  for (const { segment } of new Intl.Segmenter('ko', {
    granularity: 'grapheme',
  }).segment(title)) {
    if (visible.length === 56) {
      hasMore = true;
      break;
    }

    visible.push(segment);
  }

  const lines: string[] = [];
  let index = 0;

  while (index < visible.length && lines.length < 4) {
    while (index < visible.length && /^\s+$/u.test(visible[index])) index++;
    if (index >= visible.length) break;
    let end = Math.min(index + 14, visible.length);

    if (end < visible.length) {
      const space = visible
        .slice(index, end)
        .findLastIndex((part) => /^\s+$/u.test(part));

      if (space >= 6) end = index + space;
    }

    const parts = visible.slice(index, end);

    index = end;

    if (lines.length === 3 && (index < visible.length || hasMore)) {
      if (parts.length === 14) parts.pop();
      lines.push(
        parts
          .join('')
          .trimEnd()
          .replace(/[.…]+$/u, '') + '…',
      );
    } else {
      lines.push(parts.join('').trimEnd());
    }
  }

  return lines;
}

export function articleOgDetails(
  item: ArticleCollectionItem,
  apiOrigin: string,
) {
  const title = articleTitle(item.article.title);

  if (!title || !/^[a-f0-9]{64}$/.test(item.article_id)) return null;

  const source =
    safeSourceUrl(item.article.originallink) ??
    safeSourceUrl(item.article.link);
  let hostname: string | null = null;

  if (source) {
    const candidate = new URL(source).hostname;
    const apiHost = new URL(apiOrigin).hostname;

    if (
      candidate !== apiHost &&
      candidate.includes('.') &&
      !isIP(candidate) &&
      !/(?:^|\.)(?:localhost|local|internal)$/.test(candidate)
    ) {
      hostname = candidate;
    }
  }

  const version = createHash('sha256')
    .update(JSON.stringify(['v1', title, hostname]))
    .digest('hex')
    .slice(0, 16);
  const url = `/og/incidents/${item.article_id}.png?v=${version}`;
  const displayHostname =
    hostname && hostname.length > 28
      ? `${hostname.slice(0, 11)}…${hostname.slice(-16)}`
      : hostname;

  return {
    title,
    hostname,
    displayHostname,
    version,
    image: { url, width: 1200, height: 630, alt: `${title} · 흉흉 기사` },
  };
}
