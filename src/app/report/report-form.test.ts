// file: src/app/report/report-form.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { categoryLabels } from '../../features/incidents/model/labels';
import ReportPage from './page';

let container: HTMLDivElement;
let root: Root;
const fetchMock = vi.fn<typeof fetch>();
const fieldNames = [
  'category',
  'occurredAt',
  'title',
  'location',
  'description',
];

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', fetchMock);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  fetchMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderReport() {
  await act(async () => root.render(createElement(ReportPage)));
}

function field(name: string) {
  const element = container.querySelector(`[name="${name}"]`);
  assert(
    element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement,
    `missing report field: ${name}`,
  );
  return element;
}

async function changeField(name: string, value: string) {
  const element = field(name);
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  assert(setter);
  await act(async () => {
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function checkInput() {
  const form = container.querySelector('form');
  assert(form, 'report form must exist');
  const event = new Event('submit', { bubbles: true, cancelable: true });
  await act(async () => {
    form.dispatchEvent(event);
  });
  expect(event.defaultPrevented).toBe(true);
}

async function fillValid() {
  await changeField('category', 'society');
  await changeField('occurredAt', '2026-10-12T09:30');
  await changeField('title', '도로 점검 제보');
  await changeField('location', '부산 남구 용호동');
  await changeField('description', '보행로 일부가 통제되어 확인이 필요합니다.');
}

async function selectFiles(files: File[]) {
  const input = container.querySelector('input[type="file"]');
  assert(input instanceof HTMLInputElement, 'report file input must exist');
  const fileList = Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  });
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: fileList,
  });
  await act(async () =>
    input.dispatchEvent(new Event('change', { bubbles: true })),
  );
}

function testFile(name: string, type: string, size = 1) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function expectFieldError(name: string, message: string) {
  const element = field(name);
  expect(element.getAttribute('aria-invalid')).toBe('true');
  const ids = element.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  expect(
    ids.some(
      (id) =>
        document.getElementById(id)?.textContent?.includes(message) ?? false,
    ),
  ).toBe(true);
}

test('reportFormFields: labels and shared categories are available', async () => {
  await renderReport();
  expect(container.querySelector('h1')?.textContent).toContain('제보하기');
  for (const name of fieldNames) {
    const element = field(name);
    expect(element.id).not.toBe('');
    expect(
      container
        .querySelector(`label[for="${element.id}"]`)
        ?.textContent?.trim(),
    ).toBeTruthy();
    expect(element.required).toBe(true);
  }
  const category = field('category');
  assert(category instanceof HTMLSelectElement);
  expect(
    Array.from(category.options)
      .filter((option) => option.value)
      .map((option) => [option.value, option.textContent]),
  ).toEqual(Object.entries(categoryLabels));
  expect(field('occurredAt').getAttribute('type')).toBe('datetime-local');
  expect(field('occurredAt').value).toBe('');
  const fileInput = container.querySelector('input[type="file"]');
  assert(fileInput instanceof HTMLInputElement);
  expect(fileInput.multiple).toBe(true);
  expect(fileInput.required).toBe(false);
  expect(container.querySelector('form')?.noValidate).toBe(true);
  expect(
    container.querySelector('button[type="submit"]')?.textContent,
  ).toContain('입력 확인');
  expect(container.textContent).toContain('제보 접수 준비 중');
  expect(
    container.querySelector('a[aria-label="제보 닫기"]')?.getAttribute('href'),
  ).toBe('/');
  expect(fetchMock).not.toHaveBeenCalled();
});
