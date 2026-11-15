// file: src/features/article-detail/ui/detail-sheet/detail-sheet-return-motion.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { DetailSheet } from './detail-sheet';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ back: vi.fn() }),
}));

test('restoredPreviewDoesNotReplayEntrance', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const render = (active: boolean) =>
    root.render(
      createElement(
        DetailSheet,
        { titleId: 'title', onClose: () => {}, active },
        createElement('h1', { id: 'title' }, '기사 미리보기'),
      ),
    );
  try {
    await act(async () => render(true));
    const panel = host.querySelector('[role="dialog"]');
    expect(panel?.classList.contains('ui-sheet-enter')).toBe(true);
    await act(async () => render(false));
    expect(panel?.hasAttribute('hidden')).toBe(true);
    await act(async () => render(true));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.classList.contains('ui-sheet-enter')).toBe(false);
    expect(panel?.textContent).toContain('기사 미리보기');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
