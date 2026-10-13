# 제보 요청 제한 시간·오류 복구 테스트 초안

승인 전. 기존 75개 테스트와 승인 계약은 보존하고 독립 테스트 파일에 6개 항목을 추가한다. 정책은 proposal.ko.md, 설명을 붙인 인간 검토본은 review.ko.md를 참조한다.

## 제보 오류 복구

```ts
// file: src/app/report/report-recovery.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ReportPage from './page';

const { boundaryErrors } = vi.hoisted(() => ({ boundaryErrors: vi.fn() }));

vi.mock('@suspensive/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@suspensive/react')>();
  const { useMemo } = await import('react');
  return {
    ...actual,
    useErrorBoundary: function useObservedErrorBoundary() {
      const boundary = actual.useErrorBoundary();
      return useMemo(
        () => ({
          ...boundary,
          setError(error: Error) {
            boundaryErrors(error);
            boundary.setError(error);
          },
        }),
        [boundary],
      );
    },
  };
});

let container: HTMLDivElement;
let root: Root;
let mounted: boolean;
const fetchMock = vi.fn<typeof fetch>();
const fieldNames = [
  'category',
  'occurredAt',
  'title',
  'location',
  'description',
];
const uncertainMessage = '접수 여부를 확인하지 못했어요';
const receipt = {
  report_id: 'b'.repeat(32),
  status: 'pending',
  received_at: '2026-10-13T05:00:00Z',
};

function receiptResponse() {
  return new Response(JSON.stringify(receipt), { status: 201 });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function abortable<T>(pending: Promise<T>, signal?: AbortSignal | null) {
  if (!signal) return pending;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    pending.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: Error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

function delayedRequest() {
  const headers = deferred<Response>();
  const body = deferred<unknown>();
  let signal: AbortSignal | null | undefined;
  const response = new Response(null, { status: 201 });
  const readBody = vi
    .spyOn(response, 'json')
    .mockImplementation(() => abortable(body.promise, signal));
  fetchMock.mockImplementationOnce((_input, init) => {
    signal = init?.signal;
    return abortable(headers.promise, signal);
  });
  return {
    headers,
    body,
    response,
    readBody,
    get signal() {
      return signal;
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', 'https://reports.example.test');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async () => receiptResponse());
  boundaryErrors.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  mounted = true;
});

afterEach(async () => {
  if (mounted) await act(async () => root.unmount());
  container.remove();
  fetchMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllTimers();
  vi.useRealTimers();
});

async function renderReport() {
  await act(async () => root.render(createElement(ReportPage)));
}

function field(name: string) {
  const element = container.querySelector(`form [name="${name}"]`);
  assert(
    element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement,
    `missing field: ${name}`,
  );
  return element;
}

async function changeField(name: string, value: string) {
  const element = field(name);
  const prototype = Object.getPrototypeOf(element);
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  assert(setter);
  await act(async () => {
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function fillValid() {
  await changeField('category', 'society');
  await changeField('occurredAt', '2026-10-12T09:30');
  await changeField('title', '도로 점검 제보');
  await changeField('location', '부산 남구 용호동');
  await changeField('description', '보행로 일부가 통제되어 확인이 필요합니다.');
}

async function selectFile(file: File) {
  const input = container.querySelector('input[type="file"]');
  assert(input instanceof HTMLInputElement);
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([file], {
      item: (index: number) => [file][index] ?? null,
    }),
  });
  await act(async () =>
    input.dispatchEvent(new Event('change', { bubbles: true })),
  );
}

async function submit() {
  const form = container.querySelector('form');
  assert(form);
  const event = new Event('submit', { bubbles: true, cancelable: true });
  await act(async () => form.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
}

async function advance(milliseconds: number) {
  await act(async () => vi.advanceTimersByTimeAsync(milliseconds));
}

function submitButton() {
  const button = container.querySelector('button[type="submit"]');
  assert(button instanceof HTMLButtonElement);
  return button;
}

function closeErrorButton() {
  const button = Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === '오류 닫기',
  );
  assert(
    button instanceof HTMLButtonElement,
    'local error reset must be visible',
  );
  return button;
}

function expectDraft(values: string[], file: File) {
  expect(fieldNames.map((name) => field(name).value)).toEqual(values);
  const removeButton = container.querySelector(
    `button[aria-label="${file.name} 삭제"]`,
  );
  assert(removeButton instanceof HTMLButtonElement);
  expect(removeButton.disabled).toBe(false);
  const fileInput = container.querySelector('input[type="file"]');
  assert(fileInput instanceof HTMLInputElement);
  expect(fileInput.disabled).toBe(false);
  for (const name of fieldNames) expect(field(name).disabled).toBe(false);
  expect(submitButton().disabled).toBe(false);
}

function requestKey(index: number) {
  const init = fetchMock.mock.calls[index]?.[1];
  assert(init, `missing request: ${index}`);
  const key = new Headers(init.headers).get('Idempotency-Key');
  expect(key).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  return key;
}

function requestBody(index: number) {
  const body = fetchMock.mock.calls[index]?.[1]?.body;
  assert(body instanceof FormData);
  return body;
}

// Shared helpers remain available to each independently probed plan entry.
void [
  renderReport,
  fillValid,
  selectFile,
  submit,
  advance,
  submitButton,
  closeErrorButton,
  expectDraft,
  requestKey,
  requestBody,
  delayedRequest,
];
```

- [ ] reportRequestDeadline — 요청이 계속 대기하면 60초에 중단하고 입력을 보존한다

```ts
test('reportRequestDeadline: a pending upload aborts at 60000ms and unlocks the preserved form', async () => {
  const request = delayedRequest();
  await renderReport();
  await fillValid();
  const file = new File(['fixture'], 'road.png', { type: 'image/png' });
  await selectFile(file);
  const values = fieldNames.map((name) => field(name).value);
  await submit();
  await advance(59999);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(submitButton().disabled).toBe(true);
  expect(container.textContent).not.toContain(uncertainMessage);
  expect(request.signal?.aborted).toBe(false);
  await advance(1);
  expect(request.signal?.aborted).toBe(true);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    uncertainMessage,
  );
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  expectDraft(values, file);
  expect(container.textContent).not.toContain(receipt.report_id);
  expect(vi.getTimerCount()).toBe(0);
  await advance(120000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] reportBodyDeadline — 헤더 수신이 전체 60초 제한을 다시 시작하지 않는다

```ts
test('reportBodyDeadline: headers at 45000ms do not restart the deadline for the response body', async () => {
  const request = delayedRequest();
  await renderReport();
  await fillValid();
  await submit();
  await advance(45000);
  await act(async () => request.headers.resolve(request.response));
  expect(request.readBody).toHaveBeenCalledTimes(1);
  await advance(14999);
  expect(submitButton().disabled).toBe(true);
  expect(request.signal?.aborted).toBe(false);
  expect(container.textContent).not.toContain(uncertainMessage);
  await advance(1);
  expect(request.signal?.aborted).toBe(true);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    uncertainMessage,
  );
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  expect(submitButton().disabled).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => request.body.resolve(receipt));
  expect(container.textContent).not.toContain(receipt.report_id);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] reportBoundaryReset — 로컬 오류 닫기 후 DOM·파일·미변경 요청 키가 유지된다

```ts
test('reportBoundaryReset: closing a local fallback preserves form DOM files and the unchanged retry key', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await renderReport();
  await fillValid();
  const file = new File(['fixture'], 'kept.png', { type: 'image/png' });
  await selectFile(file);
  const form = container.querySelector('form');
  const nodes = fieldNames.map((name) => field(name));
  const values = nodes.map((element) => element.value);
  await submit();
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    uncertainMessage,
  );
  const key = requestKey(0);
  await act(async () => closeErrorButton().click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector('form')).toBe(form);
  fieldNames.forEach((name, index) => expect(field(name)).toBe(nodes[index]));
  expectDraft(values, file);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(requestKey(1)).toBe(key);
  expect(requestBody(1).get('attachments')).toBe(file);
  expect(container.textContent).toContain(receipt.report_id);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(submitButton().disabled).toBe(true);
});
```

- [ ] reportFallbackEdits — 직접 재시도·재실패·필드 및 첨부 변경 시 키가 올바르다

```ts
test('reportFallbackEdits: direct resubmission and field or attachment edits keep correct request identities', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('first outage'));
  const retry = delayedRequest();
  fetchMock.mockRejectedValueOnce(new TypeError('third outage'));
  await renderReport();
  await fillValid();
  const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
  const secondFile = new File(['second'], 'second.png', { type: 'image/png' });
  await selectFile(firstFile);
  await submit();
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  const firstKey = requestKey(0);
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(requestKey(1)).toBe(firstKey);
  expect(submitButton().disabled).toBe(true);
  await act(async () => retry.headers.reject(new TypeError('second outage')));
  expect(boundaryErrors).toHaveBeenCalledTimes(2);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    uncertainMessage,
  );
  expect(submitButton().disabled).toBe(false);
  await act(async () => closeErrorButton().click());
  await changeField('title', '수정한 도로 점검 제보');
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(boundaryErrors).toHaveBeenCalledTimes(3);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    uncertainMessage,
  );
  expect(submitButton().disabled).toBe(false);
  const editedKey = requestKey(2);
  expect(editedKey).not.toBe(firstKey);
  expect(requestBody(2).get('title')).toBe('수정한 도로 점검 제보');
  await selectFile(secondFile);
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(requestKey(3)).not.toBe(editedKey);
  expect(requestBody(3).get('title')).toBe('수정한 도로 점검 제보');
  expect(requestBody(3).getAll('attachments')).toEqual([firstFile, secondFile]);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain(receipt.report_id);
  expect(submitButton().disabled).toBe(true);
});
```

- [ ] reportFailureCleanup — 비동기 오류 분류와 완료된 요청의 타이머 정리가 유지된다

```ts
test('reportFailureCleanup: async failures enter the real local boundary and settled attempts leave no deadline', async () => {
  const bodyFailure = new Response(null, { status: 201 });
  vi.spyOn(bodyFailure, 'json').mockRejectedValue(
    new TypeError('body interrupted'),
  );
  const cases = [
    { response: bodyFailure, message: uncertainMessage },
    { response: new Response('{', { status: 201 }), message: uncertainMessage },
    {
      response: new Response(
        JSON.stringify({ ...receipt, report_id: 'invalid' }),
        { status: 201 },
      ),
      message: uncertainMessage,
    },
    {
      response: new Response('{}', { status: 503 }),
      message: uncertainMessage,
    },
    {
      response: new Response('{}', { status: 413 }),
      message: '제보를 접수하지 못했어요',
    },
  ];
  await renderReport();
  await fillValid();
  const file = new File(['fixture'], 'retained.png', { type: 'image/png' });
  await selectFile(file);
  const values = fieldNames.map((name) => field(name).value);
  for (const [index, failure] of cases.entries()) {
    fetchMock.mockResolvedValueOnce(failure.response);
    await submit();
    expect(boundaryErrors).toHaveBeenCalledTimes(index + 1);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      failure.message,
    );
    expectDraft(values, file);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => closeErrorButton().click());
    await advance(60001);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(index + 1);
  }
  await submit();
  expect(container.textContent).toContain(receipt.report_id);
  expect(vi.getTimerCount()).toBe(0);
  await advance(60001);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(submitButton().disabled).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(cases.length + 1);
});
```

- [ ] reportAttemptIsolation — 취소된 이전 요청과 언마운트가 현재 상태를 오염시키지 않는다

```ts
test('reportAttemptIsolation: abandoned responses cannot finish a newer attempt and unmount aborts active work', async () => {
  const oldRequest = delayedRequest();
  const newRequest = delayedRequest();
  await renderReport();
  await fillValid();
  await submit();
  await advance(60000);
  expect(oldRequest.signal?.aborted).toBe(true);
  expect(submitButton().disabled).toBe(false);
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(requestKey(1)).toBe(requestKey(0));
  expect(submitButton().disabled).toBe(true);
  await act(async () => {
    oldRequest.headers.resolve(oldRequest.response);
    oldRequest.body.resolve(receipt);
  });
  expect(container.textContent).not.toContain(receipt.report_id);
  expect(submitButton().disabled).toBe(true);
  expect(newRequest.signal?.aborted).toBe(false);
  await advance(59999);
  expect(submitButton().disabled).toBe(true);
  const relayedErrors = boundaryErrors.mock.calls.length;
  await act(async () => root.unmount());
  mounted = false;
  expect(boundaryErrors).toHaveBeenCalledTimes(relayedErrors);
  expect(newRequest.signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => {
    newRequest.headers.resolve(newRequest.response);
    newRequest.body.resolve(receipt);
  });
  await advance(60001);
  expect(boundaryErrors).toHaveBeenCalledTimes(relayedErrors);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
```
