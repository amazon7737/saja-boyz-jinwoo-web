# 제보 폼 실패 테스트 초안

승인 전. 이 파일은 failed-test.md가 아니며 승인 baseline에 등록하지 않았다.

## 제보 입력 및 확인

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
```

- [x] reportFormFields — 접근 가능한 필드·기존 카테고리·미접수 안내

```ts
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
```

- [ ] reportRequiredFields — 공백 필수값 오류·포커스·수정 후 확인

```ts
test('reportRequiredFields: whitespace errors are linked and corrected', async () => {
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
  expect(container.textContent).toContain('입력 확인 완료');
  expect(field('title').value).toBe('도로 점검 제보');
});
```

- [ ] reportTextLimits — 문자 수 초과와 앞뒤 공백을 제외한 경계값

```ts
test('reportTextLimits: trimmed field limits reject overflow and allow boundaries', async () => {
  await renderReport();
  await fillValid();
  for (const [name, limit] of [
    ['title', 100],
    ['location', 200],
    ['description', 5000],
  ] as const) {
    await changeField(name, '가'.repeat(limit + 1));
    await checkInput();
    expectFieldError(name, `${limit}자를 초과했어요`);
    expect(container.textContent).not.toContain('입력 확인 완료');
    await changeField(name, `  ${'가'.repeat(limit)}  `);
    await checkInput();
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
    expect(container.textContent).toContain('입력 확인 완료');
    expect(field(name).value.trim()).toBe('가'.repeat(limit));
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
```

- [ ] reportAttachments — 허용 첨부 선택·삭제·재선택 이벤트

```ts
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
```

- [ ] reportAttachmentLimits — 잘못된 첨부 묶음 거부와 기존 3개 보존

```ts
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
```

- [ ] reportLocalConfirmation — 기본 제출 차단·값 보존·접수 미완료 상태

```ts
test('reportLocalConfirmation: valid input is retained without claiming receipt', async () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  await renderReport();
  await fillValid();
  await changeField(
    'description',
    '<img src=x onerror=alert(1)> 사용자가 적은 내용',
  );
  await checkInput();
  const status = container.querySelector('[role="status"]');
  assert(status);
  expect(status.textContent).toContain('입력 확인 완료');
  expect(status.textContent).toContain('입력한 내용은 전송되지 않았어요');
  expect(container.textContent).not.toMatch(/접수 완료|접수번호/);
  expect(field('description').value).toBe(
    '<img src=x onerror=alert(1)> 사용자가 적은 내용',
  );
  expect(field('category').value).toBe('society');
  expect(field('occurredAt').value).toBe('2026-10-12T09:30');
  expect(container.querySelector('img[src="x"], [onerror]')).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(storageWrite).not.toHaveBeenCalled();
  await changeField('title', '');
  await checkInput();
  expectFieldError('title', '필수 항목이에요');
  expect(container.textContent).not.toContain('입력 확인 완료');
  expect(field('description').value).toContain('사용자가 적은 내용');
});
```
