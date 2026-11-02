'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';

import { Icon } from '@/components/ui/icon/icon';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';

import { useRollingSearchPrompt } from '../../model/use-rolling-search-prompt';
import { SearchLoading } from '../search-loading/search-loading';

export function SearchForm({
  keyword,
  children,
}: {
  keyword: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const prompt = useRollingSearchPrompt('기사 키워드 검색');
  const [pending, startTransition] = useTransition();
  const [revision, setRevision] = useState(0);

  return (
    <div className="flex flex-col gap-5 pb-5 text-sm [&_article_a]:scroll-mt-3 [&_article_a]:scroll-mb-[calc(84px_+_env(safe-area-inset-bottom))]">
      <div className="flex h-[37px] items-center gap-3">
        <Link
          href="/"
          aria-label="지도로 돌아가기"
          className="ui-control relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-solid border-border bg-surface text-[14px]/[17px] font-bold shadow-[0_4px_8px_rgb(0_0_0/5%)] after:absolute after:-inset-1 after:content-['']"
        >
          ←
        </Link>
        <form
          action="/search"
          method="get"
          aria-busy={pending}
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            const params = new URLSearchParams();

            for (const [name, value] of new FormData(event.currentTarget))
              if (typeof value === 'string') params.append(name, value);
            const href = '/search?' + params.toString();

            startTransition(() => {
              setRevision((value) => value + 1);
              if (window.location.pathname + window.location.search === href)
                router.refresh();
              else router.push(href);
            });
          }}
          className="flex h-[37px] min-w-0 flex-1 items-center rounded-card border-[1.5px] border-solid border-brand bg-surface pl-0 pr-0 shadow-[0_4px_8px_rgb(0_0_0/5%)]"
        >
          <button
            type="submit"
            aria-label="검색"
            aria-busy={pending}
            disabled={pending}
            className="-ml-2 flex size-11 shrink-0 cursor-pointer items-center justify-end rounded-xl border-0 bg-transparent p-0 pr-2 text-muted hover:opacity-80 active:opacity-60 motion-safe:transition-opacity"
          >
            {pending ? (
              <span aria-hidden="true" className="size-3.5">
                <LoadingSpinner />
              </span>
            ) : (
              <Icon name="search" />
            )}
          </button>
          <input
            key={keyword}
            type="search"
            name="q"
            defaultValue={keyword}
            readOnly={pending}
            aria-label="기사 키워드 검색"
            placeholder={prompt}
            className="h-full min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px]/[17px] font-semibold text-text placeholder:font-normal"
          />
          {keyword && (
            <Link
              href="/search"
              aria-label="검색어 초기화"
              className="ui-control grid size-11 shrink-0 place-items-center text-muted"
            >
              ✕
            </Link>
          )}
        </form>
      </div>
      {pending && <SearchLoading initial={false} />}
      <div
        key={revision}
        hidden={pending}
        inert={pending || undefined}
        className={pending ? 'hidden' : 'flex flex-col gap-5'}
      >
        {children}
      </div>
    </div>
  );
}
