'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type PopularItem = { article_id: string; title: string; views_today: number };
type Ranking = { status: 'loading' | 'ready' | 'error'; items: PopularItem[] };
type PromptState = Ranking & { title: string; retry(): void };

const SearchPromptContext = createContext<PromptState>({
  title: '',
  status: 'loading',
  items: [],
  retry: () => {},
});

export function SearchPromptProvider({ children }: { children: ReactNode }) {
  const value = useRollingTitle();

  return createElement(SearchPromptContext, { value }, children);
}

export function useRollingSearchPrompt(fallback: string) {
  const { title } = useContext(SearchPromptContext);

  return title ? `${title} 검색하기` : fallback;
}

export function usePopularRanking() {
  return useContext(SearchPromptContext);
}

function useRollingTitle(): PromptState {
  const [title, setTitle] = useState('');
  const [ranking, setRanking] = useState<Ranking>({
    status: 'loading',
    items: [],
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let active = true;
    let rotation: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const response = await fetch('/api/search-headlines', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('ranking unavailable');
        const payload: unknown = await response.json();

        if (
          !payload ||
          typeof payload !== 'object' ||
          !('titles' in payload) ||
          !Array.isArray(payload.titles) ||
          !payload.titles.every((value: unknown) => typeof value === 'string')
        ) {
          if (active) setRanking({ status: 'error', items: [] });

          return;
        }

        const titles = [
          ...new Set<string>(
            payload.titles.map((value: string) => value.trim()).filter(Boolean),
          ),
        ].slice(0, 3);

        if (!active || controller.signal.aborted) return;

        if (
          'items' in payload &&
          Array.isArray(payload.items) &&
          payload.items.length <= 3 &&
          payload.items.every(
            (item: unknown) =>
              item !== null &&
              typeof item === 'object' &&
              'article_id' in item &&
              typeof item.article_id === 'string' &&
              /^[a-f0-9]{64}$/.test(item.article_id) &&
              'title' in item &&
              typeof item.title === 'string' &&
              'views_today' in item &&
              Number.isSafeInteger(item.views_today) &&
              (item.views_today as number) > 0,
          )
        ) {
          setRanking({
            status: 'ready',
            items: payload.items as PopularItem[],
          });
        } else {
          setRanking({ status: 'error', items: [] });
        }

        if (!titles.length) return;

        for (let i = titles.length - 1; i > 0; i--) {
          const other = Math.floor(Math.random() * (i + 1));

          [titles[i], titles[other]] = [titles[other], titles[i]];
        }

        let index = 0;

        setTitle(titles[index]);

        if (
          titles.length > 1 &&
          !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ) {
          rotation = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            index = (index + 1) % titles.length;
            setTitle(titles[index]);
          }, 5000);
        }
      } catch {
        if (active) setRanking({ status: 'error', items: [] });
        // Keep the usable search entry when rankings are unavailable.
      } finally {
        clearTimeout(timeout);
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
      clearInterval(rotation);
    };
  }, [attempt]);

  return {
    ...ranking,
    title,
    retry: () => {
      setRanking({ status: 'loading', items: [] });
      setAttempt((value) => value + 1);
    },
  };
}
