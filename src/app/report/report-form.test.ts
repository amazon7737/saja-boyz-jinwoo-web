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

test('reportImagePreviewRemainsForRetryAndReleasesAfterConfirmedReceipt', async () => {
  const create = vi.fn(() => 'blob:local-preview');
  const revoke = vi.fn();
  const NativeURL = URL;
  class MockURL extends NativeURL {
    static createObjectURL = create;
    static revokeObjectURL = revoke;
  }
  vi.stubGlobal('URL', MockURL);
  fetchMock.mockRejectedValueOnce(new TypeError('network'));
  fetchMock.mockResolvedValueOnce(receiptResponse(200));
  await renderReport();
  await fillValid();
  const photo = testFile('현장.png', 'image/png');
  await selectFiles([photo]);
  const image = () => container.querySelector('img[src="blob:local-preview"]');
  expect(create).toHaveBeenCalledWith(photo);
  expect(image()).not.toBeNull();

  await checkInput();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '접수 여부를 확인하지 못했어요',
  );
  expect(field('title').value).toBe('도로 점검 제보');
  expect(
    container.querySelector('button[aria-label="현장.png 삭제"]'),
  ).not.toBeNull();
  expect(image()).not.toBeNull();
  expect(revoke).not.toHaveBeenCalledWith('blob:local-preview');
  const first = fetchMock.mock.calls[0][1];
  assert(first?.body instanceof FormData);
  expect(first.body.getAll('attachments')).toEqual([photo]);
  const requestKey = new Headers(first.headers).get('Idempotency-Key');
  expect(requestKey).toBeTruthy();

  await checkInput();
  const retry = fetchMock.mock.calls[1][1];
  assert(retry?.body instanceof FormData);
  expect(retry.body.getAll('attachments')).toEqual([photo]);
  expect(new Headers(retry.headers).get('Idempotency-Key')).toBe(requestKey);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    receipt.report_id,
  );
  expect(image()).toBeNull();
  expect(revoke).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledWith('blob:local-preview');
});

test('reportImagePreviewReleasesItsObjectUrlWhenRemoved', async () => {
  const create = vi.fn(() => 'blob:local-preview');
  const revoke = vi.fn();
  const NativeURL = URL;
  class MockURL extends NativeURL {
    static createObjectURL = create;
    static revokeObjectURL = revoke;
  }
  vi.stubGlobal('URL', MockURL);
  await renderReport();
  const photo = testFile('현장.png', 'image/png');
  await selectFiles([photo]);
  expect(create).toHaveBeenCalledWith(photo);
  expect(
    container.querySelector('img[src="blob:local-preview"]'),
  ).not.toBeNull();
  expect(container.textContent).toContain('현장.png');
  expect(fetchMock).not.toHaveBeenCalled();
  const remove = container.querySelector('button[aria-label="현장.png 삭제"]');
  assert(remove instanceof HTMLButtonElement);
  await act(async () => remove.click());
  expect(container.querySelector('img[src="blob:local-preview"]')).toBeNull();
  expect(revoke).toHaveBeenCalledWith('blob:local-preview');
  expect(fetchMock).not.toHaveBeenCalled();
});

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

test('reportSubmissionFields: labels and shared categories are available', async () => {
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
  ).toContain('제보 접수');
  expect(container.textContent).toContain('한국시간');
  expect(container.textContent).toContain('비공개');
  expect(
    container.querySelector('a[aria-label="제보 닫기"]')?.getAttribute('href'),
  ).toBe('/');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('reportSubmissionRequiredFields: whitespace errors are linked and corrected', async () => {
  await renderReport();
  for (const name of ['title', 'location', 'description']) {
    await changeField(name, '   ');
  }
  await checkInput();
  for (const name of fieldNames) {
    expectFieldError(name, '필수 항목이에요');
  }
  expect(document.activeElement).toBe(field('category'));
  expect(container.textContent).not.toContain('입력 확인 완료');
  expect(fetchMock).not.toHaveBeenCalled();
  await fillValid();
  await checkInput();
  for (const name of fieldNames) {
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
  }
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '제보가 완료되었습니다',
  );
  expect(field('title').value).toBe('도로 점검 제보');
});

test('reportSubmissionTextLimits: trimmed field limits reject overflow and allow boundaries', async () => {
  await renderReport();
  await fillValid();
  let completed = 0;
  for (const [name, limit] of [
    ['title', 100],
    ['location', 200],
    ['description', 5000],
  ] as const) {
    await changeField(name, '가'.repeat(limit + 1));
    await checkInput();
    expectFieldError(name, `${limit}자를 초과했어요`);
    expect(fetchMock).toHaveBeenCalledTimes(completed);
    expect(container.textContent).not.toContain('제보가 완료되었습니다');
    expect(container.textContent).not.toContain(receipt.report_id);
    await changeField(name, `  ${'가'.repeat(limit)}  `);
    await checkInput();
    completed += 1;
    expect(fetchMock).toHaveBeenCalledTimes(completed);
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      '제보가 완료되었습니다',
    );
    expect(field(name).value.trim()).toBe('가'.repeat(limit));
    const restart = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('새 제보 작성'),
    );
    assert(restart);
    await act(async () => restart.click());
    await fillValid();
  }
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('reportSubmissionPayload: trimmed fields Korean time and retained attachments are sent', async () => {
  vi.stubEnv('TZ', 'UTC');
  await renderReport();
  await fillValid();
  await changeField('title', '  도로 점검 제보  ');
  await changeField('location', '  부산 남구 용호동  ');
  await changeField(
    'description',
    '  <img src=x onerror=alert(1)> 보행로 확인  ',
  );
  await selectFiles([
    testFile('kept.png', 'image/png'),
    testFile('removed.mp4', 'video/mp4'),
  ]);
  const remove = container.querySelector(
    'button[aria-label="removed.mp4 삭제"]',
  );
  assert(remove instanceof HTMLButtonElement);
  await act(async () => remove.click());
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('https://reports.example.test/reports');
  expect(init?.method).toBe('POST');
  expect(init?.credentials).toBe('omit');
  const headers = new Headers(init?.headers);
  expect(headers.get('Idempotency-Key')).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(headers.has('Content-Type')).toBe(false);
  expect(headers.has('Authorization')).toBe(false);
  assert(init?.body instanceof FormData);
  expect(init.body.get('category')).toBe('society');
  expect(init.body.get('occurred_at')).toBe('2026-10-12T00:30:00.000Z');
  expect(init.body.get('title')).toBe('도로 점검 제보');
  expect(init.body.get('location')).toBe('부산 남구 용호동');
  expect(init.body.get('description')).toBe(
    '<img src=x onerror=alert(1)> 보행로 확인',
  );
  const files = init.body.getAll('attachments');
  expect(files).toHaveLength(1);
  assert(files[0] instanceof File);
  expect([files[0].name, files[0].type, files[0].size]).toEqual([
    'kept.png',
    'image/png',
    1,
  ]);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    receipt.report_id,
  );
  expect(container.querySelector('img[src="x"], [onerror]')).toBeNull();
});

test('reportSubmissionPending: double submit is locked until a real receipt arrives', async () => {
  let release!: (response: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  await renderReport();
  await fillValid();
  await selectFiles([testFile('road.png', 'image/png')]);
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('접수 중');
  expect(container.textContent).not.toContain(receipt.report_id);
  for (const element of container.querySelectorAll(
    'input, textarea, select, button[type="submit"], button[aria-label$=" 삭제"]',
  )) {
    expect(element.matches(':disabled')).toBe(true);
  }
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => release(receiptResponse()));
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '제보가 완료되었습니다',
  );
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    receipt.report_id,
  );
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const restart = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.includes('새 제보 작성'),
  );
  assert(restart);
  await act(async () => restart.click());
  expect(field('title').value).toBe('');
  expect(
    container.querySelectorAll('button[aria-label$=" 삭제"]'),
  ).toHaveLength(0);
  expect(container.textContent).not.toContain(receipt.report_id);
});

test('reportSubmissionRetry: an ambiguous failure keeps values files and the same request key', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  fetchMock.mockImplementationOnce(async () => receiptResponse(200));
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  await renderReport();
  await fillValid();
  await selectFiles([testFile('road.png', 'image/png')]);
  const originalValues = Object.fromEntries(
    fieldNames.map((name) => [name, field(name).value]),
  );
  await checkInput();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '접수 여부를 확인하지 못했어요',
  );
  expect(container.textContent).not.toContain(receipt.report_id);
  for (const name of fieldNames) {
    expect(field(name).value).toBe(originalValues[name]);
    expect(field(name).matches(':disabled')).toBe(false);
  }
  expect(
    container.querySelector('button[type="submit"]')?.matches(':disabled'),
  ).toBe(false);
  expect(
    container.querySelector('button[aria-label="road.png 삭제"]'),
  ).not.toBeNull();
  const firstKey = new Headers(fetchMock.mock.calls[0][1]?.headers).get(
    'Idempotency-Key',
  );
  expect(firstKey).toBeTruthy();
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const secondKey = new Headers(fetchMock.mock.calls[1][1]?.headers).get(
    'Idempotency-Key',
  );
  expect(secondKey).toBe(firstKey);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    receipt.report_id,
  );
  expect(storageWrite).not.toHaveBeenCalled();
});

test('reportSubmissionFailures: rejected or malformed responses never claim receipt or erase the draft', async () => {
  await renderReport();
  await fillValid();
  await selectFiles([testFile('road.png', 'image/png')]);
  const originalValues = Object.fromEntries(
    fieldNames.map((name) => [name, field(name).value]),
  );
  for (const [status, body] of [
    [422, { detail: 'private-internal-error' }],
    [429, { detail: 'private-internal-error' }],
    [507, { detail: 'private-internal-error' }],
    [500, { detail: 'private-internal-error' }],
    [201, {}],
    [201, { ...receipt, report_id: '../../private' }],
    [201, { ...receipt, status: 'published' }],
    [201, { ...receipt, received_at: 'not-a-date' }],
    [202, receipt],
    [201, '<html>private-internal-error</html>'],
  ] as const) {
    fetchMock.mockResolvedValueOnce(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await checkInput();
    expect(
      container.querySelector('[role="alert"]')?.textContent?.trim(),
    ).toBeTruthy();
    expect(container.textContent).not.toContain('private-internal-error');
    expect(container.textContent).not.toContain('제보가 완료되었습니다');
    for (const name of fieldNames) {
      expect(field(name).value).toBe(originalValues[name]);
      expect(field(name).matches(':disabled')).toBe(false);
    }
    expect(
      container.querySelector('button[type="submit"]')?.matches(':disabled'),
    ).toBe(false);
    expect(
      container.querySelector('button[aria-label="road.png 삭제"]'),
    ).not.toBeNull();
  }
  expect(fetchMock).toHaveBeenCalledTimes(10);
});

test('reportSubmissionConfiguration: missing or unsafe public endpoint does not send the report', async () => {
  for (const endpoint of [
    '',
    'javascript:alert(1)',
    'https://user:secret@example.test',
    'http://reports.example.test',
  ]) {
    vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', endpoint);
    await act(async () =>
      root.render(createElement(ReportPage, { key: endpoint })),
    );
    await fillValid();
    await checkInput();
    expect(container.textContent).toContain(
      '제보 접수 연결이 준비되지 않았어요',
    );
    expect(container.textContent).not.toContain('제보가 완료되었습니다');
    expect(fetchMock).not.toHaveBeenCalled();
  }
});

test('reportSubmissionEditedRetry: changed content uses a new request key after an uncertain attempt', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await renderReport();
  await fillValid();
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const previousKey = new Headers(fetchMock.mock.calls[0][1]?.headers).get(
    'Idempotency-Key',
  );
  expect(previousKey).toBeTruthy();
  await changeField('title', '수정한 제보 제목');
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const nextRequest = fetchMock.mock.calls[1][1];
  const nextKey = new Headers(nextRequest?.headers).get('Idempotency-Key');
  expect(nextKey).toBeTruthy();
  expect(nextKey).not.toBe(previousKey);
  assert(nextRequest?.body instanceof FormData);
  expect(nextRequest.body.get('title')).toBe('수정한 제보 제목');
  expect(container.textContent).not.toContain('제보가 완료되었습니다');
  await selectFiles([testFile('added.png', 'image/png')]);
  await checkInput();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  const attachmentRequest = fetchMock.mock.calls[2][1];
  const attachmentKey = new Headers(attachmentRequest?.headers).get(
    'Idempotency-Key',
  );
  expect(attachmentKey).toBeTruthy();
  expect(attachmentKey).not.toBe(nextKey);
  assert(attachmentRequest?.body instanceof FormData);
  expect(attachmentRequest.body.get('title')).toBe('수정한 제보 제목');
  expect(attachmentRequest.body.getAll('attachments')).toHaveLength(1);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    receipt.report_id,
  );
});

test('reportCompletionScreenRequiresValidReceiptAndKeepsRecovery', async () => {
  await renderReport();
  await fillValid();
  const attachment = testFile('road.png', 'image/png');
  await selectFiles([attachment]);
  const form = container.querySelector('form');
  assert(form);
  const values = Object.fromEntries(
    fieldNames.map((name) => [name, field(name).value]),
  );

  for (const [status, body] of [
    [202, receipt],
    [201, { ...receipt, status: 'published' }],
    [201, { ...receipt, report_id: '../../private' }],
    [200, { ...receipt, received_at: 'not-a-date' }],
  ] as const) {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await checkInput();
    const request = fetchMock.mock.lastCall?.[1];
    assert(request?.body instanceof FormData);
    expect(
      request.body.getAll('attachments'),
      '선택한 실제 파일로 재시도',
    ).toEqual([attachment]);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain('제보가 완료되었습니다');
    expect(container.textContent).not.toContain(receipt.report_id);
    expect(container.querySelector('form'), '실패 시 같은 폼 유지').toBe(form);
    for (const name of fieldNames) {
      expect(field(name).value, `${name} 입력 유지`).toBe(values[name]);
      expect(field(name).disabled).toBe(false);
    }
    expect(
      container.querySelector('button[aria-label="road.png 삭제"]'),
      '실패 시 선택한 첨부 유지',
    ).not.toBeNull();
  }

  for (const status of [201, 200]) {
    fetchMock.mockResolvedValueOnce(receiptResponse(status));
    await checkInput();
    const message = container.querySelector('[role="status"]');
    expect(message?.textContent).toContain('제보가 완료되었습니다');
    expect(message?.textContent).toContain(receipt.report_id);
    const heading = [...container.querySelectorAll('h1, h2, h3')].find(
      (element) => element.textContent?.includes('제보가 완료되었습니다'),
    );
    assert(heading, '완료 화면에 제목 제공');
    expect(document.activeElement, '완료 화면으로 포커스 이동').toBe(heading);
    const visibleForm = container.querySelector('form');
    const formIsHidden =
      !visibleForm ||
      [
        ...(function* () {
          for (
            let element: HTMLElement | null = visibleForm;
            element && element !== container;
            element = element.parentElement
          )
            yield element;
        })(),
      ].some(
        (element) =>
          element.hidden || getComputedStyle(element).display === 'none',
      );
    expect(formIsHidden, '접수 완료 화면에서 입력 폼을 감춤').toBe(true);
    const close = [
      ...container.querySelectorAll<HTMLAnchorElement>('a[href="/"]'),
    ].find((link) => link.textContent?.trim() === '닫기');
    expect(close, '닫기는 지도 주소로 이동하는 실제 링크').toBeDefined();
    expect(close?.getAttribute('href')).toBe('/');
    expect(close?.tabIndex).toBeGreaterThanOrEqual(0);

    const restart = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '새 제보 작성',
    );
    assert(restart, '새 제보 작성으로 다시 시작할 수 있음');
    const requests = fetchMock.mock.calls.length;
    await act(async () => restart.click());
    expect(fetchMock).toHaveBeenCalledTimes(requests);
    expect(field('title').value).toBe('');
    expect(document.activeElement, '새 제보 첫 항목으로 포커스 복귀').toBe(
      field('category'),
    );
    expect(
      container.querySelector('button[aria-label="road.png 삭제"]'),
    ).toBeNull();
    expect(container.textContent).not.toContain(receipt.report_id);
    if (status === 201) {
      await fillValid();
      await selectFiles([attachment]);
    }
  }
  expect(fetchMock).toHaveBeenCalledTimes(6);
});
