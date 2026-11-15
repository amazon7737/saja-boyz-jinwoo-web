// file: src/app/report/report-focus.test.ts
// @vitest-environment jsdom
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import postcss, { type Root } from 'postcss';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import ReportPage from './page';

function focusDeclarations(css: Root, element: Element) {
  const result = new Map<string, string>();
  const layers = ['base', 'components', 'utilities'];
  for (const layer of layers) {
    css.walkRules((rule) => {
      if (rule.parent?.type !== 'atrule' || rule.parent.params !== layer)
        return;
      try {
        if (!element.matches(rule.selector)) return;
      } catch {
        return;
      }
      rule.walkDecls((decl) => {
        result.set(decl.prop, decl.value);
      });
    });
  }
  return result;
}

test('reportInputFocusStaysOnFieldBoundary', async () => {
  const path = join(process.cwd(), 'src/app/globals.css');
  const output = await postcss([tailwindcss()]).process(
    await readFile(path, 'utf8'),
    {
      from: path,
    },
  );
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(createElement(ReportPage));
  document.body.append(container);

  try {
    for (const name of [
      'category',
      'occurredAt',
      'title',
      'location',
      'description',
    ]) {
      const field = container.querySelector<HTMLElement>(`[name="${name}"]`);
      expect(field, name).not.toBeNull();
      field!.focus();
      expect(field!.matches(':focus-visible'), name).toBe(true);
      const focus = focusDeclarations(output.root, field!);
      expect(focus.get('outline'), name).toContain('solid');
      expect(focus.get('outline-style'), name).not.toBe('none');
      expect(focus.get('outline-offset'), name).toBe('0px');
      expect(focus.get('border-color'), name).toBe('#ea1a2d');
      expect(focus.get('--tw-ring-offset-width') ?? '0px', name).toBe('0px');
      expect(focus.get('--tw-ring-shadow') ?? '', name).not.toMatch(
        /(?:[4-9]|[1-9]\d+)px/,
      );
    }

    const attachment = container.querySelector<HTMLInputElement>(
      '[name="attachments"]',
    )!;
    attachment.focus();
    const uploadFocus = focusDeclarations(
      output.root,
      attachment.parentElement!,
    );
    expect(uploadFocus.get('outline-style')).toBe('solid');
    expect(uploadFocus.get('outline-width')).toBe('3px');
    expect(uploadFocus.get('outline-offset')).toBe('0px');
    expect(uploadFocus.get('border-color')).toBe('#ea1a2d');
    expect(uploadFocus.get('--tw-ring-offset-width') ?? '0px').toBe('0px');
    expect(uploadFocus.get('--tw-ring-shadow') ?? '').not.toMatch(
      /(?:[4-9]|[1-9]\d+)px/,
    );
  } finally {
    container.remove();
  }
}, 60000);
