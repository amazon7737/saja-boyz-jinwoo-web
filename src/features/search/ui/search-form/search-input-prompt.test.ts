// file: src/features/search/ui/search-form/search-input-prompt.test.ts
// @vitest-environment jsdom
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchPromptProvider } from '@/features/search/model/use-rolling-search-prompt';
import { DetailShare } from '@/app/incidents/[id]/detail-share';
import { SearchForm } from './search-form';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('../search-suggestions/search-suggestions', () => ({
  SearchSuggestions: () => null,
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('searchPromptAndShareFallbackPreserveInputUsability', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(Response.json({ titles: ['서울 소식', '부산 소식'] })),
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(
        createElement(
          SearchPromptProvider,
          null,
          createElement(
            SearchForm,
            { keyword: '' } as Parameters<typeof SearchForm>[0],
            null,
          ),
          createElement(DetailShare, { id: 'article-1', title: '기사' }),
        ),
      );
    });
    const input = host.querySelector<HTMLInputElement>('input[name="q"]')!;
    expect(input.getAttribute('aria-label')).toBe('기사 키워드 검색');
    const first = host.querySelector('[data-search-input-prompt]');
    expect(first?.textContent).toMatch(/소식 검색하기/);
    expect(first?.getAttribute('aria-hidden')).toBe('true');
    expect(first?.classList.contains('ui-sheet-enter')).toBe(true);
    await act(async () => vi.advanceTimersByTime(5000));
    const second = host.querySelector('[data-search-input-prompt]');
    expect(second).not.toBe(first);
    expect(second?.textContent).not.toBe(first?.textContent);
    const path = join(process.cwd(), 'src/app/globals.css');
    const css = await postcss([tailwindcss()]).process(
      await readFile(path, 'utf8'),
      { from: path },
    );
    function displayOf(element: Element | null) {
      if (!element || element.hasAttribute('hidden')) return 'none';
      let display = '';
      for (const layer of ['base', 'components', 'utilities']) {
        css.root.walkRules((rule) => {
          if (rule.parent?.type !== 'atrule' || rule.parent.params !== layer)
            return;
          try {
            if (!element.matches(rule.selector)) return;
          } catch {
            return;
          }
          rule.walkDecls('display', (decl) => {
            display = decl.value;
          });
        });
      }
      return display;
    }
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, '자동완성');
    expect(displayOf(host.querySelector('[data-search-input-prompt]'))).toBe(
      'none',
    );
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, '');
    await act(async () => {
      input.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true }),
      );
    });
    expect(displayOf(host.querySelector('[data-search-input-prompt]'))).toBe(
      'none',
    );
    await act(async () => {
      input.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true }),
      );
    });
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, '서울 화재');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.value).toBe('서울 화재');
    expect(host.querySelector('[data-search-input-prompt]')).toBeNull();
    const clear = host.querySelector<HTMLButtonElement>(
      'button[aria-label="검색어 초기화"]',
    )!;
    await act(async () => clear.click());
    expect(input.value).toBe('');
    expect(host.querySelector('[data-search-input-prompt]')).not.toBeNull();
    const share = Array.from(host.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('기사 공유하기'),
    )!;
    await act(async () => share.click());
    const shareInput = host.querySelector<HTMLInputElement>(
      'input[aria-label="공유 링크"]',
    )!;
    expect(shareInput.readOnly).toBe(true);
    expect(shareInput.value).toContain('/incidents/article-1');
    shareInput.focus();
    expect(shareInput.matches(':focus-visible')).toBe(true);
    let offset = '';
    for (const layer of ['base', 'components', 'utilities']) {
      css.root.walkRules((rule) => {
        if (rule.parent?.type !== 'atrule' || rule.parent.params !== layer)
          return;
        try {
          if (!shareInput.matches(rule.selector)) return;
        } catch {
          return;
        }
        rule.walkDecls('outline-offset', (decl) => {
          offset = decl.value;
        });
      });
    }
    expect(offset).toBe('0px');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
}, 60000);
