'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const SearchPromptContext = createContext('');

export function SearchPromptProvider({ children }: { children: ReactNode }) {
  const title = useRollingTitle();

  return createElement(SearchPromptContext, { value: title }, children);
}

export function useRollingSearchPrompt(fallback: string) {
  const title = useContext(SearchPromptContext);

  return title ? `${title} 검색하기` : fallback;
}

function useRollingTitle() {
  const [title, setTitle] = useState('');

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

        if (!response.ok) return;
        const payload: unknown = await response.json();

        if (
          !payload ||
          typeof payload !== 'object' ||
          !('titles' in payload) ||
          !Array.isArray(payload.titles) ||
          !payload.titles.every((value: unknown) => typeof value === 'string')
        )
          return;
        const titles = [
          ...new Set<string>(
            payload.titles.map((value: string) => value.trim()).filter(Boolean),
          ),
        ].slice(0, 3);

        if (!active || controller.signal.aborted || !titles.length) return;

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
  }, []);

  return title;
}
