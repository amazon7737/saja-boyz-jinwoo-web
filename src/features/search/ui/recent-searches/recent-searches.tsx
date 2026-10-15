'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { KeywordLinkStatus } from '@/app/search/keyword-link-status';

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
      <h2 className="m-0 text-xs font-bold text-muted">최근 검색</h2>
      {keywords.length === 0 ? (
        <p className="m-0 text-sm text-muted">최근 검색어가 없어요</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0 p-0">
          {keywords.map((keyword, index) => (
            <li
              key={`${keyword}-${index}`}
              className="flex items-center justify-between gap-2 border-0 border-b border-solid border-border py-0 text-[14px]/[17px]"
            >
              <Link
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="ui-control flex min-h-10 min-w-0 flex-1 items-center gap-2 font-medium"
              >
                <span aria-hidden="true" className="shrink-0 text-muted">
                  🕒
                </span>
                <span className="min-w-0 truncate">{keyword}</span>
                <KeywordLinkStatus />
              </Link>
              <button
                type="button"
                aria-label={`${keyword} 삭제`}
                onClick={() => removeKeyword(keyword)}
                className="ui-control grid size-10 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-muted"
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
