'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from 'react';

import { Icon } from '@/components/ui/icon/icon';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';

import { useRollingSearchPrompt } from '../../model/use-rolling-search-prompt';
import { SearchLoading } from '../search-loading/search-loading';
import { SearchSuggestions } from '../search-suggestions/search-suggestions';

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
  const composingRef = useRef(false);
  const [lastKeyword, setLastKeyword] = useState(keyword);
  const [query, setQuery] = useState(keyword);

  if (lastKeyword !== keyword) {
    setLastKeyword(keyword);
    setQuery(keyword);
  }

  const [composing, setComposing] = useState(false);
  const isEditing = query.trim() !== keyword.trim();

  return (
    <div className="flex flex-col gap-5 pb-5 text-sm [&_article_a]:scroll-mt-3 [&_article_a]:scroll-mb-3">
      <div className="flex h-11 items-center gap-3">
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
            if (pending || composingRef.current) return;
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
          className={`flex h-11 min-w-0 flex-1 items-center rounded-card border-[1.5px] border-solid border-brand bg-surface pl-0 pr-0 shadow-[0_4px_8px_rgb(0_0_0/5%)] has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-brand`}
        >
          <button
            type="submit"
            aria-label="검색"
            aria-busy={pending}
            disabled={pending}
            className="flex h-11 w-[46px] shrink-0 cursor-pointer items-center justify-end rounded-xl border-0 bg-transparent p-0 pr-2 text-text hover:opacity-80 active:opacity-60 motion-safe:transition-opacity"
          >
            {pending ? (
              <span aria-hidden="true" className="size-3.5">
                <LoadingSpinner />
              </span>
            ) : (
              <Icon name="search" className="size-6!" />
            )}
          </button>
          <SearchInput
            key={keyword}
            keyword={keyword}
            prompt={prompt}
            pending={pending}
            composingRef={composingRef}
            setQuery={setQuery}
            setComposing={setComposing}
          />
        </form>
      </div>
      {!pending && (
        <SearchSuggestions
          query={query}
          keyword={keyword}
          composing={composing}
        />
      )}
      {pending && <SearchLoading initial={false} />}
      <div
        key={revision}
        hidden={pending || isEditing}
        inert={pending || isEditing || undefined}
        className={pending || isEditing ? 'hidden' : 'flex flex-col gap-5'}
      >
        {children}
      </div>
    </div>
  );
}

function SearchInput({
  keyword,
  prompt,
  pending,
  composingRef,
  setQuery,
  setComposing,
}: {
  keyword: string;
  prompt: string;
  pending: boolean;
  composingRef: RefObject<boolean>;
  setQuery: (value: string) => void;
  setComposing: (value: boolean) => void;
}) {
  const [hasValue, setHasValue] = useState(Boolean(keyword));
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      composingRef.current = false;
    };
  }, [composingRef]);

  return (
    <>
      <input
        ref={input}
        type="search"
        name="q"
        defaultValue={keyword}
        onChange={(event) => {
          setHasValue(Boolean(event.currentTarget.value));
          setQuery(event.currentTarget.value);
        }}
        onCompositionStart={() => {
          composingRef.current = true;
          setComposing(true);
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          setComposing(false);
          setQuery(event.currentTarget.value);
        }}
        onBlur={() => {
          composingRef.current = false;
          setComposing(false);
        }}
        readOnly={pending}
        aria-label="기사 키워드 검색"
        placeholder={prompt}
        className={`h-full min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px]/[17px] font-semibold text-text placeholder:font-normal focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none`}
      />
      {keyword ? (
        <Link
          href="/search"
          aria-label="검색어 초기화"
          className="ui-control grid size-11 shrink-0 place-items-center text-muted"
        >
          ✕
        </Link>
      ) : hasValue ? (
        <button
          type="button"
          aria-label="검색어 초기화"
          disabled={pending}
          onClick={() => {
            if (input.current) {
              input.current.value = '';
              input.current.focus();
            }

            setHasValue(false);
            setQuery('');
          }}
          className="ui-control grid size-11 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-muted"
        >
          ✕
        </button>
      ) : null}
    </>
  );
}
