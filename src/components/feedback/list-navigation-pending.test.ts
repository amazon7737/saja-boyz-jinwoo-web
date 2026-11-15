// file: src/components/feedback/list-navigation-pending.test.ts
// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { ListNavigationPending } from './list-navigation-pending';

vi.mock('next/link', async () => {
  const React = await import('react');
  const pending = React.createContext(true);

  return {
    default: ({ children, ...props }: ComponentProps<'a'>) =>
      React.createElement(
        pending.Provider,
        { value: false },
        React.createElement('a', props, children),
      ),
    useLinkStatus: () => ({ pending: React.useContext(pending) }),
  };
});

test('listNavigationShowsDestinationShell', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const main = document.createElement('main');
  main.id = 'main-content';
  main.textContent = '지도 화면';
  const previousInert = main.inert;
  document.body.append(main, host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(ListNavigationPending)));
    const pending = document.querySelector('[data-list-navigation-pending]');
    expect(pending).not.toBeNull();
    expect(main.inert).toBe(true);
    expect(pending?.querySelector('[aria-label="주 메뉴"]')).not.toBeNull();
    expect(
      pending?.querySelector('[role="status"][aria-busy="true"]'),
    ).not.toBeNull();
    expect(pending?.querySelector('header')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    const restoredInert = main.inert;
    main.remove();
    host.remove();
    vi.unstubAllGlobals();
    expect(restoredInert).toBe(previousInert);
  }
});

test('listPendingLocksControlsAndPreservesDestinationFocus', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const main = document.createElement('main');
  main.id = 'main-content';
  const opener = document.createElement('button');
  opener.textContent = '목록';
  main.append(opener);
  document.body.append(main, host);
  opener.focus();
  const root = createRoot(host);
  let mounted = true;
  const destination = document.createElement('button');
  destination.textContent = '도착 화면';
  try {
    await act(async () => root.render(createElement(ListNavigationPending)));
    const pending = document.querySelector('[data-list-navigation-pending]');
    expect(pending).not.toBeNull();
    const controls = Array.from(
      pending!.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
        'a[href], button:not(:disabled)',
      ),
    );
    expect(controls.every((control) => control.closest('[inert]'))).toBe(true);
    const statuses = pending!.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].closest('[inert]')).toBeNull();
    expect(pending!.contains(document.activeElement)).toBe(true);

    document.body.append(destination);
    destination.focus();
    await act(async () => root.unmount());
    mounted = false;
    expect(document.activeElement).toBe(destination);
  } finally {
    if (mounted) await act(async () => root.unmount());
    destination.remove();
    main.remove();
    host.remove();
    vi.unstubAllGlobals();
  }
});
