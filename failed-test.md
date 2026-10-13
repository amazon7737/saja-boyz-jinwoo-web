# 실제 제보 접수 테스트 초안

승인 전. 4·5번 첨부 회귀는 `replacement-baseline.txt`에 그대로 보존하며, 아래에는 새 동작 9개만 둔다.

## 실제 제보 접수

```ts
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
```

- [x] reportSubmissionFields — 실제 접수 계약 검증 (1번 검토 블록)

```ts
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
```

- [x] reportSubmissionRequiredFields — 실제 접수 계약 검증 (2번 검토 블록)

```ts
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
    '제보가 접수됐어요',
  );
  expect(field('title').value).toBe('도로 점검 제보');
});
```

- [x] reportSubmissionTextLimits — 실제 접수 계약 검증 (3번 검토 블록)

```ts
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
    expect(container.textContent).not.toContain('제보가 접수됐어요');
    expect(container.textContent).not.toContain(receipt.report_id);
    await changeField(name, `  ${'가'.repeat(limit)}  `);
    await checkInput();
    completed += 1;
    expect(fetchMock).toHaveBeenCalledTimes(completed);
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      '제보가 접수됐어요',
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
```

- [x] reportSubmissionPayload — 실제 접수 계약 검증 (6번 검토 블록)

```ts
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
```

- [x] reportSubmissionPending — 실제 접수 계약 검증 (7번 검토 블록)

```ts
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
    '제보가 접수됐어요',
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
```

- [x] reportSubmissionRetry — 실제 접수 계약 검증 (8번 검토 블록)

```ts
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
```

- [x] reportSubmissionFailures — 실제 접수 계약 검증 (9번 검토 블록)

```ts
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
    expect(container.textContent).not.toContain('제보가 접수됐어요');
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
```

- [x] reportSubmissionConfiguration — 실제 접수 계약 검증 (10번 검토 블록)

```ts
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
    expect(container.textContent).not.toContain('제보가 접수됐어요');
    expect(fetchMock).not.toHaveBeenCalled();
  }
});
```

- [x] reportSubmissionEditedRetry — 실제 접수 계약 검증 (11번 검토 블록)

```ts
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
  expect(container.textContent).not.toContain('제보가 접수됐어요');
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
```
