'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { IconText } from '@/components/ui/icon-text/icon-text';
import { Notice } from '@/components/feedback/notice';
import { KeywordLinkStatus } from '@/features/search/ui/keyword-link-status/keyword-link-status';

function normalizeKeywords(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const keywords = values
    .filter((value): value is string => typeof value === 'string')
    .map((keyword) => keyword.trim())
    // Unicode 모드에서는 정상 surrogate 쌍을 하나의 코드 포인트로 처리한다.
    .filter(
      (keyword) => keyword.length > 0 && !/[\uD800-\uDFFF]/u.test(keyword),
    );

  return [...new Set(keywords)].slice(0, 10);
}

function readKeywords(): string[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem('hh:recent-searches:v1') ?? '[]',
    );

    return normalizeKeywords(stored);
  } catch {
    return [];
  }
}

function writeKeywords(keywords: string[]) {
  try {
    localStorage.setItem('hh:recent-searches:v1', JSON.stringify(keywords));
  } catch {
    // 저장소를 사용할 수 없어도 기사 검색은 유지한다.
  }
}

export function RecentSearches({ executedKeyword = '' }) {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    const storedKeywords = readKeywords();
    const nextKeywords = normalizeKeywords([
      executedKeyword,
      ...storedKeywords,
    ]);

    if (executedKeyword) {
      writeKeywords(nextKeywords);
    }

    // 서버와 첫 렌더를 일치시키고 마운트 후 브라우저 저장소를 복원한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeywords(nextKeywords);
  }, [executedKeyword]);

  function removeKeyword(keyword: string) {
    const nextKeywords = normalizeKeywords(keywords).filter(
      (stored) => stored !== keyword,
    );

    setKeywords(nextKeywords);
    writeKeywords(nextKeywords);
  }

  if (executedKeyword) return null;

  return (
    <section aria-label="최근 검색" className="flex flex-col gap-3">
      <h2 className="m-0 text-[12px]/[15px] font-bold text-muted">
        <IconText icon="clock" size="action" spacing="compact">
          최근 검색
        </IconText>
      </h2>
      {keywords.length === 0 ? (
        <Notice title="최근 검색어가 없어요">
          첫 검색으로 동네 소식을 찾아보세요.
        </Notice>
      ) : (
        <ul className="m-0 flex w-full list-none items-center gap-2 overflow-x-auto overscroll-x-contain px-1 py-1">
          {keywords.map((keyword, index) => (
            <li
              key={`${keyword}-${index}`}
              className="flex max-w-full shrink-0 items-center rounded-md border-[1.5px] border-solid border-border bg-slate-100 text-[12px]/[15px]"
            >
              <Link
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="ui-control relative flex min-h-8 min-w-0 flex-1 items-center px-[9px] font-semibold text-muted"
              >
                <span className="truncate">{keyword}</span>
                <KeywordLinkStatus />
              </Link>
              <button
                type="button"
                aria-label={`${keyword} 삭제`}
                onClick={() => removeKeyword(keyword)}
                className="ui-control grid size-8 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-muted"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
