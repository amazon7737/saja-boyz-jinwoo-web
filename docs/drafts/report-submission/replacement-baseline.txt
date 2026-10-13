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

const receipt = {
  report_id: 'a'.repeat(32),
  status: 'pending',
  received_at: '2026-10-13T05:00:00Z',
};

function receiptResponse(status = 201) {
  return new Response(JSON.stringify(receipt), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', 'https://reports.example.test');
  fetchMock.mockImplementation(async () => receiptResponse());
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
  vi.unstubAllEnvs();
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

// Shared draft helpers are referenced here because early plan entries use only a subset.
void [
  renderReport,
  field,
  changeField,
  checkInput,
  fillValid,
  selectFiles,
  testFile,
  expectFieldError,
];

test('reportAttachments: valid files can be selected removed and selected again', async () => {
  await renderReport();
  const image = testFile('road.jpg', 'image/jpeg', 10 * 1024 * 1024);
  const video = testFile('road.mp4', 'video/mp4');
  await selectFiles([image, video]);
  expect(container.textContent).toContain('road.jpg');
  expect(container.textContent).toContain('road.mp4');
  const remove = container.querySelector('button[aria-label="road.jpg 삭제"]');
  assert(remove instanceof HTMLButtonElement);
  await act(async () => remove.click());
  expect(container.textContent).not.toContain('road.jpg');
  expect(container.textContent).toContain('road.mp4');
  await selectFiles([image]);
  expect(
    container.querySelectorAll('button[aria-label="road.jpg 삭제"]'),
  ).toHaveLength(1);
  expect(
    container
      .querySelector('input[type="file"]')
      ?.getAttribute('accept')
      ?.split(/,/)
      .map((value) => value.trim())
      .sort(),
  ).toEqual(
    ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].sort(),
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('reportAttachmentLimits: invalid batches preserve previous selection', async () => {
  await renderReport();
  await selectFiles([testFile('kept.png', 'image/png')]);
  for (const rejected of [
    testFile('large.webp', 'image/webp', 10 * 1024 * 1024 + 1),
    testFile('empty.png', 'image/png', 0),
    testFile('unsafe.svg', 'image/svg+xml'),
    testFile('unknown.jpg', ''),
  ]) {
    await selectFiles([rejected, testFile('batch.webm', 'video/webm')]);
    expect(
      container.querySelector('[role="alert"]')?.textContent?.trim(),
    ).toBeTruthy();
    expect(
      container.querySelector('button[aria-label="kept.png 삭제"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('button[aria-label="batch.webm 삭제"]'),
    ).toBeNull();
    expect(
      container.querySelector(`button[aria-label="${rejected.name} 삭제"]`),
    ).toBeNull();
  }
  await selectFiles([
    testFile('two.webp', 'image/webp'),
    testFile('three.webm', 'video/webm'),
  ]);
  expect(
    container.querySelector('button[aria-label="two.webp 삭제"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('button[aria-label="three.webm 삭제"]'),
  ).not.toBeNull();
  await selectFiles([testFile('four.jpg', 'image/jpeg')]);
  expect(
    container.querySelector('button[aria-label="four.jpg 삭제"]'),
  ).toBeNull();
  expect(
    container.querySelector('[role="alert"]')?.textContent?.trim(),
  ).toBeTruthy();
  expect(
    container.querySelector('button[aria-label="kept.png 삭제"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('button[aria-label="two.webp 삭제"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('button[aria-label="three.webm 삭제"]'),
  ).not.toBeNull();
  expect(
    container.querySelectorAll('button[aria-label$=" 삭제"]'),
  ).toHaveLength(3);
  expect(fetchMock).not.toHaveBeenCalled();
});
