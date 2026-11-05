// @vitest-environment jsdom
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { MapPeriodFilter } from '../map-period-filter/map-period-filter';
import { MapUnavailableFilter } from '../map-unavailable-filter/map-unavailable-filter';

function visualClasses(element: Element, ignore: (value: string) => boolean) {
  return [...element.classList].filter((value) => !ignore(value)).sort();
}

test('periodAndCategoryShareDropdownStylesAndRetainDisabledChoices', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const change = vi.fn();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          Fragment,
          null,
          createElement(MapPeriodFilter, { value: 'all', onChange: change }),
          createElement(MapUnavailableFilter, { kind: 'category' }),
        ),
      ),
    );
    let panelStyle: string[] | undefined;
    let selectedStyle: string[] | undefined;
    let triggerStyle: string[] | undefined;
    for (const label of ['기간', '카테고리']) {
      const trigger = host.querySelector<HTMLButtonElement>(
        `button[aria-label="${label}"]`,
      );
      if (!trigger) throw new Error('Missing trigger: ' + label);
      await act(async () => trigger.click());
      const panel = host.querySelector(`[aria-label="${label} 선택"]`);
      const selected = panel?.querySelector('button[aria-pressed="true"]');
      if (!panel || !selected)
        throw new Error('Missing panel or selection: ' + label);
      const actualPanel = visualClasses(panel, (value) =>
        value.startsWith('left-'),
      );
      const actualTrigger = visualClasses(trigger, (value) =>
        value.startsWith('w-'),
      );
      panelStyle ??= actualPanel;
      selectedStyle ??= visualClasses(selected, () => false);
      triggerStyle ??= actualTrigger;
      expect(actualPanel, label + ' 패널').toEqual(panelStyle);
      expect(
        visualClasses(selected, () => false),
        label + ' 선택 항목',
      ).toEqual(selectedStyle);
      expect(actualTrigger, label + ' 트리거').toEqual(triggerStyle);
      if (label !== '기간') {
        expect(
          [...panel.querySelectorAll<HTMLButtonElement>('button')]
            .slice(1)
            .every((button) => button.disabled),
        ).toBe(true);
        expect(selected.textContent).toBe('전체');
      }
      await act(async () =>
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
      );
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    }
    expect(change).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
