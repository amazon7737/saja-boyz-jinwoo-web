// @vitest-environment jsdom
import {
  act,
  createElement,
  type ComponentProps,
  type MouseEvent,
} from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

vi.mock('next/compat/router', () => ({
  useRouter: () => ({ events: { on: vi.fn(), off: vi.fn() } }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    useLinkStatus: () => ({ pending: false }),
    default: ({ children, href, onClick, ...props }: ComponentProps<'a'>) =>
      createElement(
        'a',
        {
          ...props,
          href,
          onClick: (event: MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            event.preventDefault();
          },
        },
        children,
      ),
  };
});
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: (props: ComponentProps<'img'>) => createElement('img', props),
  };
});

test('directDetailListReturnShowsPendingOnlyForUnmodifiedClick', async () => {
  const { DetailInline } = await import('./detail-inline');
  const main = document.createElement('main');
  main.id = 'main-content';
  document.body.append(main);
  const root = createRoot(main);
  try {
    await act(async () =>
      root.render(createElement(DetailInline, { titleId: 'heading' })),
    );
    const link = main.querySelector<HTMLAnchorElement>(
      'a[aria-label="목록으로"]',
    )!;
    expect(link.getAttribute('href')).toBe('/incidents');
    await act(async () =>
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        }),
      ),
    );
    expect(document.querySelector('[data-list-navigation-pending]')).toBeNull();
    await act(async () =>
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      ),
    );
    expect(
      document.querySelector('[data-list-navigation-pending]'),
    ).not.toBeNull();
    expect(main.inert).toBe(true);
  } finally {
    await act(async () => root.unmount());
    main.remove();
  }
});
