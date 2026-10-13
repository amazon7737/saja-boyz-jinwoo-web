# 제보 입력 폼 테스트 초안 검토

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

이 문서는 `test-header.txt`와 `test-1.txt`부터 `test-6.txt`까지의 실행 블록을 그대로 복사하고, 바로 위에 한국어 `// 검토:` 설명만 삽입한 검토용 문서입니다. 실행 대상은 `src/app/report/report-form.test.ts`입니다. 공통 헤더와 도우미는 아래에서 한 번 설명하며 여섯 테스트 모두 이를 사용합니다.

현재 **UI부터 먼저 만드는 방향(UI-first)은 사용자 선택을 기다리는 제안**입니다. 이 문서는 승인된 제품 사양이나 승인 등록이 아닙니다. 실제 접수 API 없이 입력을 확인하는 동작, 준비 중·미전송 안내, 필수 항목과 오류 문구, 앞뒤 공백 제외 길이(제목 100·장소 200·상세 내용 5000), 선택 사항인 첨부·최대 3개·파일당 10 MiB·허용 MIME 타입 및 묶음 전체 거부 정책은 모두 확인할 초안 정책입니다. 사용자가 이 방향과 정확한 테스트 입력을 승인하기 전에는 구현·승인 등록 기준으로 확정하지 않습니다.

## 전제와 검증 범위

- 실제 페이지 컴포넌트를 jsdom에 렌더링합니다. 화면 배치, 모바일 브라우저, 날짜 선택기, 운영체제 파일 선택 창, 스크린리더의 실제 읽기는 검증하지 않습니다. DOM의 텍스트·속성·포커스를 검사합니다.
- `fetch`를 mock으로 바꾸므로 이 경로에서는 외부 서버에 접속하지 않습니다. 실제 API 호출·업로드·접수·서버 저장 결과를 검증하지 않으며, 미호출 확인도 이 함수 경로만 관찰합니다. `Storage.setItem` spy 역시 localStorage·sessionStorage 경로만 관찰합니다.
- `changeField`는 DOM 기본 setter와 합성 input/change 이벤트를 씁니다. 실제 키보드·한글 조합·붙여넣기나 브라우저 입력 제한을 그대로 재현하지 않습니다. `checkInput`은 submit 이벤트를 직접 보내므로 native constraint validation을 거치지 않습니다. 별도로 `noValidate`와 `required` 속성을 검사하고 모든 `checkInput`에서 `defaultPrevented`를 확인합니다. 이것은 기본 제출 차단의 증거이며 실제 브라우저 페이지 이동을 관찰한 결과는 아닙니다.
- 파일 fixture의 실제 내용은 항상 문자 `x` 하나입니다. 파일명·MIME 타입을 지정하고 `size` 속성만 덮어써 0바이트·10 MiB 경계·초과 크기를 모사합니다. 실제 대용량 파일, 메모리 소비, 이미지·동영상 디코딩, 파일 내용과 MIME의 일치, 악성 파일 검사 결과는 이 테스트로 판단할 수 없습니다. `files`에는 배열 기반 목록과 `item(index)` 호환 함수를 주입하며, 실제 FileList 인스턴스나 파일 선택 창 동작은 아닙니다.
- `categoryLabels`를 공통 기대값으로 재사용하므로 제보 분류와 기존 분류의 일치만 확인합니다. 현재 분류 체계의 제품 적합성은 별도 결정입니다. 예시 일시는 고정 문자열이며 현재 시각을 고정하지 않습니다. 미래 시각 허용 여부, 시간대 변환, 주소 검증·좌표 변환은 이 초안에 없습니다.
- 글자 수 경계에는 한글 완성형 `가`만 반복합니다. 이모지·결합 문자처럼 사용자가 인식하는 한 글자와 문자열 길이가 달라지는 경우의 기준은 검증하지 않습니다.
- 오류 도우미는 `aria-invalid`와 `aria-describedby`로 연결된 설명에 지정한 오류 문구가 포함되는지 검사합니다. 설명 전체 문구의 완전 일치나 실제 시각적 노출은 보장하지 않습니다. 마지막 테스트는 한 HTML 유사 문자열이 입력값으로 남고 그 문자열에 해당하는 `img[src="x"]` 또는 `[onerror]` 요소가 생기지 않는지 확인하며, 포괄적 보안 검증을 대체하지 않습니다.

## 공통 헤더와 지원 코드

원본: `test-header.txt` · 대상: `src/app/report/report-form.test.ts`

```ts
// 검토: 공통 헤더와 여섯 테스트의 실행 대상 파일을 src/app/report/report-form.test.ts로 지정하는 원본 주석입니다.
// file: src/app/report/report-form.test.ts
// 검토: 실제 브라우저 대신 DOM을 모사하는 jsdom에서 실행하도록 지정합니다.
// @vitest-environment jsdom
// 검토: 각 테스트 전후 정리, 전제 조건 검사, 기대값 비교, 테스트 선언과 mock 기능을 Vitest에서 가져옵니다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: React 갱신을 기다릴 act와 JSX 없이 페이지를 만드는 createElement를 사용합니다.
import { act, createElement } from 'react';
// 검토: DOM에 React 페이지를 연결하는 createRoot와 그 인스턴스의 타입을 가져옵니다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 기존 사건 분류 라벨을 기대값으로 사용합니다. 이 값 자체의 제품 적합성은 독립적으로 검증하지 않습니다.
import { categoryLabels } from '../../features/incidents/model/labels';
// 검토: 실제 제보 페이지 컴포넌트를 가져와 화면과 상호작용을 검사합니다.
import ReportPage from './page';

// 검토: 테스트마다 만드는 페이지 DOM의 최상위 div를 보관합니다.
let container: HTMLDivElement;
// 검토: 테스트마다 생성하고 제거할 React 렌더링 루트를 보관합니다.
let root: Root;
// 검토: 전역 fetch를 대신할 호출 기록용 mock입니다. 응답을 제공하지 않으며 외부 API에 실제로 접속하지 않습니다.
const fetchMock = vi.fn<typeof fetch>();
// 검토: 필수 입력과 오류 검사의 공통 대상인 다섯 필드 이름을 정의합니다.
const fieldNames = [
  // 검토: 사건 분류를 category라는 name으로 찾습니다.
  'category',
  // 검토: 발생 일시를 occurredAt이라는 name으로 찾습니다.
  'occurredAt',
  // 검토: 제목을 title이라는 name으로 찾습니다.
  'title',
  // 검토: 발생 장소를 location이라는 name으로 찾습니다.
  'location',
  // 검토: 상세 내용을 description이라는 name으로 찾습니다.
  'description',
];

// 검토: 각 테스트 전에 격리된 DOM과 공통 mock을 준비합니다.
beforeEach(() => {
  // 검토: React에 act를 지원하는 테스트 환경임을 알려 상태 갱신을 테스트 안에서 추적합니다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: 전역 fetch 호출을 mock으로 대체합니다. 미호출 검사는 이 경로의 네트워크 시도만 확인합니다.
  vi.stubGlobal('fetch', fetchMock);
  // 검토: 이 테스트에서만 사용할 빈 div를 생성합니다.
  container = document.createElement('div');
  // 검토: div를 document.body에 붙여 포커스와 문서 전체 ID 조회가 가능하게 합니다.
  document.body.append(container);
  // 검토: 생성한 div에 React 루트를 연결합니다.
  root = createRoot(container);
});

// 검토: 각 테스트 후 React, DOM, mock과 임시 전역 값을 정리합니다.
afterEach(async () => {
  // 검토: React 언마운트와 정리 효과가 끝날 때까지 기다립니다.
  await act(async () => root.unmount());
  // 검토: 테스트의 div를 문서에서 제거해 다음 테스트와 섞이지 않게 합니다.
  container.remove();
  // 검토: fetch mock의 호출 이력과 설정을 초기화합니다.
  fetchMock.mockReset();
  // 검토: 테스트에서 설치한 spy 등 원래 함수의 대체를 복구합니다.
  vi.restoreAllMocks();
  // 검토: 임시 fetch와 React 환경 표시를 포함한 전역 stub을 복구합니다.
  vi.unstubAllGlobals();
});

// 검토: 모든 항목에서 동일한 방식으로 제보 페이지를 렌더링하는 공통 도우미입니다.
async function renderReport() {
  // 검토: 실제 ReportPage를 렌더링하고 관련 React 갱신이 끝날 때까지 기다립니다.
  await act(async () => root.render(createElement(ReportPage)));
}

// 검토: 지정한 name의 필드를 찾아 적절한 DOM 입력 요소임을 확인하는 도우미입니다.
function field(name: string) {
  // 검토: 컨테이너에서 해당 name 속성의 첫 번째 요소를 찾습니다.
  const element = container.querySelector(`[name="${name}"]`);
  // 검토: 찾은 요소가 아래 세 종류의 입력 컨트롤 중 하나인지 검사합니다.
  assert(
    // 검토: 일반 input 요소면 허용합니다.
    element instanceof HTMLInputElement ||
      // 검토: 여러 줄 입력용 textarea 요소도 허용합니다.
      element instanceof HTMLTextAreaElement ||
      // 검토: 분류 선택에 쓰는 select 요소도 허용합니다.
      element instanceof HTMLSelectElement,
    // 검토: 요소가 없거나 허용된 컨트롤이 아니면 어떤 필드가 빠졌는지 오류에 남깁니다.
    `missing report field: ${name}`,
  );
  // 검토: 타입 검사를 통과한 입력 요소를 호출자에게 돌려줍니다.
  return element;
}

// 검토: 키보드를 실제로 조작하지 않고 값을 주입한 뒤 입력 이벤트를 발생시키는 도우미입니다.
async function changeField(name: string, value: string) {
  // 검토: 수정할 필드를 field 도우미로 찾습니다.
  const element = field(name);
  // 검토: 요소 종류에 맞는 DOM 기본 value setter를 찾기 위한 prototype을 선택합니다.
  const prototype =
    // 검토: 대상이 textarea인지 먼저 판단합니다.
    element instanceof HTMLTextAreaElement
      // 검토: textarea면 textarea의 기본 value setter를 사용합니다.
      ? HTMLTextAreaElement.prototype
      // 검토: textarea가 아니면 select인지 판단합니다.
      : element instanceof HTMLSelectElement
        // 검토: select면 select의 기본 value setter를 사용합니다.
        ? HTMLSelectElement.prototype
        // 검토: 두 종류가 아니면 input의 기본 value setter를 사용합니다.
        : HTMLInputElement.prototype;
  // 검토: 선택한 prototype에 정의된 value setter를 꺼내 React가 인스턴스에 둔 값 추적을 직접 쓰지 않도록 합니다.
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  // 검토: value setter가 존재한다는 테스트 환경 전제 조건을 확인합니다.
  assert(setter);
  // 검토: 값 변경과 두 이벤트에 따른 React 갱신이 끝날 때까지 기다립니다.
  await act(async () => {
    // 검토: DOM 기본 setter로 값을 넣습니다. 실제 타이핑·붙여넣기·한글 조합 입력을 모사하지는 않습니다.
    setter.call(element, value);
    // 검토: 상위 요소로 전파되는 input 이벤트를 발생시킵니다.
    element.dispatchEvent(new Event('input', { bubbles: true }));
    // 검토: 상위 요소로 전파되는 change 이벤트도 발생시킵니다. 실제 브라우저의 모든 이벤트 순서를 재현하지는 않습니다.
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

// 검토: 폼 submit 핸들러를 직접 실행하고 기본 제출을 막는지 확인하는 도우미입니다.
async function checkInput() {
  // 검토: 컨테이너에서 첫 번째 form 요소를 찾습니다.
  const form = container.querySelector('form');
  // 검토: form이 있어야 한다는 전제 조건을 확인합니다.
  assert(form, 'report form must exist');
  // 검토: 전파 가능하며 preventDefault로 취소할 수 있는 submit 이벤트를 만듭니다.
  const event = new Event('submit', { bubbles: true, cancelable: true });
  // 검토: 제출 핸들러와 관련 React 상태 갱신이 끝날 때까지 기다립니다.
  await act(async () => {
    // 검토: submit 이벤트를 form에 직접 보냅니다. 클릭이나 requestSubmit을 통한 브라우저 기본 필수값 검사는 거치지 않습니다.
    form.dispatchEvent(event);
  });
  // 검토: 핸들러가 preventDefault로 기본 제출을 막았는지 확인합니다. 실제 페이지 이동을 관찰하는 검사는 아닙니다.
  expect(event.defaultPrevented).toBe(true);
}

// 검토: 다른 필수값 부족이 개별 시나리오에 섞이지 않도록 공통 유효 예시를 채우는 도우미입니다.
async function fillValid() {
  // 검토: 기존 분류 값 society를 고릅니다.
  await changeField('category', 'society');
  // 검토: 2026-10-12 09:30을 고정 예시로 입력합니다. 현재 시각을 고정하지 않으며 미래 시각 허용 여부나 시간대는 검증하지 않습니다.
  await changeField('occurredAt', '2026-10-12T09:30');
  // 검토: 제목에 고정된 한국어 예시를 넣습니다.
  await changeField('title', '도로 점검 제보');
  // 검토: 장소에 부산 남구 용호동이라는 문자열을 넣습니다. 주소 유효성이나 지도 좌표는 검증하지 않습니다.
  await changeField('location', '부산 남구 용호동');
  // 검토: 상세 내용에 비어 있지 않은 제보 예시를 넣습니다.
  await changeField('description', '보행로 일부가 통제되어 확인이 필요합니다.');
}

// 검토: 파일 선택 창을 띄우지 않고 input.files와 change 이벤트를 모사하는 도우미입니다.
async function selectFiles(files: File[]) {
  // 검토: 첫 번째 파일 input을 찾습니다.
  const input = container.querySelector('input[type="file"]');
  // 검토: 파일 선택용 input이 실제로 존재하는지 확인합니다.
  assert(input instanceof HTMLInputElement, 'report file input must exist');
  // 검토: 파일 배열을 복사하고 FileList의 item 메서드와 호환되는 함수를 붙입니다. 실제 FileList 인스턴스는 아닙니다.
  const fileList = Object.assign([...files], {
    // 검토: item(index)가 해당 파일을 돌려주고 범위 밖이면 null을 돌려주도록 모사합니다.
    item: (index: number) => files[index] ?? null,
  });
  // 검토: 파일 input의 files 속성을 테스트용 목록으로 덮어씁니다.
  Object.defineProperty(input, 'files', {
    // 검토: 다음 선택을 모사할 때도 files 속성을 다시 정의할 수 있게 합니다.
    configurable: true,
    // 검토: files 속성 값으로 방금 만든 배열 기반 목록을 사용합니다.
    value: fileList,
  });
  // 검토: 파일 변경 핸들러에 따른 React 갱신이 끝날 때까지 기다립니다.
  await act(async () =>
    // 검토: 파일 input에서 상위로 전파되는 change 이벤트를 보냅니다.
    input.dispatchEvent(new Event('change', { bubbles: true })),
  );
}

// 검토: 이름·MIME 타입·가짜 크기의 파일 fixture를 만듭니다. 크기를 생략하면 1바이트로 취급합니다.
function testFile(name: string, type: string, size = 1) {
  // 검토: 내용은 항상 문자 x 하나인 File을 만듭니다. 유효한 사진·영상 바이트를 생성하지 않습니다.
  const file = new File(['x'], name, { type });
  // 검토: size 속성만 지정한 숫자로 바꿉니다. 대용량 파일 메모리 사용·디코딩·실제 내용 검사는 이 fixture로 검증할 수 없습니다.
  Object.defineProperty(file, 'size', { value: size });
  // 검토: 메타데이터 검사용 파일 fixture를 돌려줍니다.
  return file;
}

// 검토: 필드 오류 상태와 지정한 오류 문구의 설명 ID 연결을 함께 검사하는 도우미입니다.
function expectFieldError(name: string, message: string) {
  // 검토: 검사할 입력 요소를 name으로 찾습니다.
  const element = field(name);
  // 검토: 입력 요소가 aria-invalid="true"로 오류 상태를 알리는지 확인합니다.
  expect(element.getAttribute('aria-invalid')).toBe('true');
  // 검토: aria-describedby의 공백으로 구분된 ID 목록을 읽습니다. 속성이 없으면 빈 목록으로 취급합니다.
  const ids = element.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  // 검토: 연결된 설명 중 적어도 하나가 요청한 오류 문구를 포함하는지 검사합니다.
  expect(
    // 검토: 연결 설명 하나 이상이 조건을 만족해야 합니다. 모든 설명이 같을 필요는 없습니다.
    ids.some(
      // 검토: 각 설명 ID를 하나씩 검사 대상으로 받습니다.
      (id) =>
        // 검토: 해당 ID 요소의 텍스트에 지정 문구가 포함되는지 확인하고 요소나 텍스트가 없으면 실패로 취급합니다. 문구의 정확한 전체 일치나 시각적 가시성은 검사하지 않습니다.
        document.getElementById(id)?.textContent?.includes(message) ?? false,
    ),
  // 검토: 지정 문구를 포함한 연결 설명을 최소 하나 찾았어야 통과합니다.
  ).toBe(true);
}
```

## 1. reportFormFields

원본: `test-1.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportFormFields: 기본 폼 구조·필수값 표시·공통 분류·준비 상태 안내를 검증합니다.
test('reportFormFields: labels and shared categories are available', async () => {
  // 검토: 공통 renderReport로 실제 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 첫 번째 h1에 제보하기 문구가 포함되는지 확인합니다.
  expect(container.querySelector('h1')?.textContent).toContain('제보하기');
  // 검토: 분류·일시·제목·장소·내용 다섯 필드를 각각 검사합니다.
  for (const name of fieldNames) {
    // 검토: 이번에 검사할 필드를 name으로 찾습니다.
    const element = field(name);
    // 검토: label 연결에 쓸 입력 ID가 비어 있지 않아야 합니다.
    expect(element.id).not.toBe('');
    // 검토: 입력 ID를 가리키는 label에 읽을 수 있는 문구가 있는지 검사합니다.
    expect(
      // 검토: 검사 대상을 현재 페이지 컨테이너로 한정합니다.
      container
        // 검토: 입력 ID와 for 속성이 일치하는 label을 찾습니다.
        .querySelector(`label[for="${element.id}"]`)
        // 검토: label의 앞뒤 공백을 제거한 텍스트를 읽습니다.
        ?.textContent?.trim(),
    // 검토: label 문구가 존재하고 비어 있지 않아야 합니다. 정확한 라벨 문구는 고정하지 않습니다.
    ).toBeTruthy();
    // 검토: 각 필드의 required 속성이 true인지 확인합니다. 브라우저 기본 검증 실행 여부를 검사하지는 않습니다.
    expect(element.required).toBe(true);
  }
  // 검토: 분류 필드를 별도로 찾습니다.
  const category = field('category');
  // 검토: 분류가 HTML select 요소인지 확인합니다.
  assert(category instanceof HTMLSelectElement);
  // 검토: 빈 안내 선택지를 제외한 분류 값과 라벨이 공통 분류와 같은지 검사합니다.
  expect(
    // 검토: select의 모든 option을 배열로 만듭니다.
    Array.from(category.options)
      // 검토: value가 빈 선택지는 비교에서 제외합니다.
      .filter((option) => option.value)
      // 검토: 각 option을 value와 화면 텍스트 쌍으로 바꿉니다.
      .map((option) => [option.value, option.textContent]),
  // 검토: 분류의 값·라벨·순서가 categoryLabels의 Object.entries 결과와 정확히 같아야 합니다.
  ).toEqual(Object.entries(categoryLabels));
  // 검토: 발생 일시가 datetime-local 타입인지 확인합니다.
  expect(field('occurredAt').getAttribute('type')).toBe('datetime-local');
  // 검토: 발생 일시가 처음에는 비어 있어 사용자가 직접 지정해야 하는지 확인합니다.
  expect(field('occurredAt').value).toBe('');
  // 검토: 파일 첨부 input을 찾습니다.
  const fileInput = container.querySelector('input[type="file"]');
  // 검토: 파일 첨부 input이 존재하는지 확인합니다.
  assert(fileInput instanceof HTMLInputElement);
  // 검토: 여러 파일을 선택하도록 multiple 속성이 켜져 있어야 합니다.
  expect(fileInput.multiple).toBe(true);
  // 검토: 첨부는 필수가 아니어야 한다는 초안 정책을 확인합니다.
  expect(fileInput.required).toBe(false);
  // 검토: noValidate가 켜져 기본 브라우저 검증 대신 앱의 검증 흐름을 사용하도록 설정됐는지 확인합니다.
  expect(container.querySelector('form')?.noValidate).toBe(true);
  // 검토: 제출 버튼이 실제 접수 대신 입력 확인이라는 동작을 안내하는지 검사합니다.
  expect(
    // 검토: submit 타입 버튼의 텍스트를 읽습니다.
    container.querySelector('button[type="submit"]')?.textContent,
  // 검토: 버튼 텍스트에 입력 확인이 포함되어야 합니다.
  ).toContain('입력 확인');
  // 검토: 페이지 텍스트에 제보 접수 준비 중 안내가 포함되어야 합니다.
  expect(container.textContent).toContain('제보 접수 준비 중');
  // 검토: 닫기 링크가 홈으로 향하는지 검사합니다.
  expect(
    // 검토: 제보 닫기라는 접근성 이름을 가진 링크의 href를 읽습니다.
    container.querySelector('a[aria-label="제보 닫기"]')?.getAttribute('href'),
  // 검토: href가 정확히 /이어야 합니다. 클릭 후 라우팅 결과는 이 테스트 범위가 아닙니다.
  ).toBe('/');
  // 검토: 초기 렌더링 동안 mock으로 대체한 전역 fetch가 호출되지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 2. reportRequiredFields

원본: `test-2.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportRequiredFields: 공백 오류의 문구 연결·첫 오류 포커스·수정 후 확인 상태를 검증합니다.
test('reportRequiredFields: whitespace errors are linked and corrected', async () => {
  // 검토: 공통 도우미로 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 제목·장소·상세 내용 세 필드에 같은 공백 사례를 적용합니다.
  for (const name of ['title', 'location', 'description']) {
    // 검토: 공백 세 개를 넣어 비어 있지 않은 문자열도 유효한 내용으로 오인하지 않는지 준비합니다.
    await changeField(name, '   ');
  }
  // 검토: 분류와 일시는 비운 채 submit 이벤트를 보내고 기본 제출 차단도 확인합니다.
  await checkInput();
  // 검토: 다섯 필수 필드의 오류 상태를 각각 검사합니다.
  for (const name of fieldNames) {
    // 검토: 각 필드가 오류 상태이고 연결 설명에 필수 항목이에요가 포함되는지 확인합니다.
    expectFieldError(name, '필수 항목이에요');
  }
  // 검토: 첫 번째 오류인 분류 필드에 DOM 포커스가 있어야 합니다.
  expect(document.activeElement).toBe(field('category'));
  // 검토: 필수값 오류가 있을 때 페이지 텍스트에 입력 확인 완료가 없어야 합니다.
  expect(container.textContent).not.toContain('입력 확인 완료');
  // 검토: 잘못된 입력을 확인해도 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
  // 검토: 공통 유효 예시로 다섯 필드를 모두 수정합니다.
  await fillValid();
  // 검토: 수정한 입력으로 다시 확인하고 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: 다섯 필드에 남은 오류 표시가 있는지 각각 검사합니다.
  for (const name of fieldNames) {
    // 검토: aria-invalid가 더 이상 true가 아니어야 합니다. 속성 제거와 false 표기 모두 허용합니다.
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
  }
  // 검토: 수정 후 페이지 텍스트에 입력 확인 완료가 포함되어야 합니다.
  expect(container.textContent).toContain('입력 확인 완료');
  // 검토: 확인 뒤에도 제목에 도로 점검 제보가 그대로 남아 있어야 합니다.
  expect(field('title').value).toBe('도로 점검 제보');
});
```

## 3. reportTextLimits

원본: `test-3.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportTextLimits: 앞뒤 공백을 제외한 길이의 초과 거부와 정확한 경계값 허용을 검증합니다.
test('reportTextLimits: trimmed field limits reject overflow and allow boundaries', async () => {
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 다른 필수값 오류가 섞이지 않도록 공통 유효 예시를 채웁니다.
  await fillValid();
  // 검토: 아래 세 필드와 최대 길이에 같은 초과·경계 시나리오를 반복합니다.
  for (const [name, limit] of [
    // 검토: 제목 최대 길이 100을 제안한 초안입니다.
    ['title', 100],
    // 검토: 장소 최대 길이 200을 제안한 초안입니다.
    ['location', 200],
    // 검토: 상세 내용 최대 길이 5000을 제안한 초안입니다.
    ['description', 5000],
  // 검토: 필드 이름과 길이 쌍을 상수 타입으로 고정해 각 반복에서 사용합니다.
  ] as const) {
    // 검토: 가를 제한보다 한 글자 더 반복해 해당 필드를 초과 상태로 만듭니다.
    await changeField(name, '가'.repeat(limit + 1));
    // 검토: 입력 확인을 실행하고 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: 필드 오류 상태와 해당 제한 숫자를 포함한 초과 안내가 연결되어 있어야 합니다.
    expectFieldError(name, `${limit}자를 초과했어요`);
    // 검토: 길이 초과 상태에서는 입력 확인 완료 문구가 없어야 합니다.
    expect(container.textContent).not.toContain('입력 확인 완료');
    // 검토: 제한 길이의 가 앞뒤에 공백 두 개씩을 넣어 공백 제외 길이가 경계값인 입력으로 바꿉니다.
    await changeField(name, `  ${'가'.repeat(limit)}  `);
    // 검토: 경계값으로 다시 확인하고 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: 경계값 입력의 aria-invalid가 true가 아니어야 합니다.
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
    // 검토: 경계값을 허용해 입력 확인 완료 문구가 표시되어야 합니다.
    expect(container.textContent).toContain('입력 확인 완료');
    // 검토: 입력값을 trim한 결과가 제한 길이의 가와 같아야 합니다. 원래 앞뒤 공백을 그대로 보존하거나 제거하는 정책은 고정하지 않습니다.
    expect(field(name).value.trim()).toBe('가'.repeat(limit));
  }
  // 검토: 모든 길이 검증 과정에서 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 4. reportAttachments

원본: `test-4.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportAttachments: 허용 파일 선택·삭제·같은 파일 재선택과 accept 목록을 검증합니다.
test('reportAttachments: valid files can be selected removed and selected again', async () => {
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: JPEG MIME 타입과 정확히 10 MiB인 가짜 size를 가진 road.jpg를 만듭니다. 실제 내용은 x 하나입니다.
  const image = testFile('road.jpg', 'image/jpeg', 10 * 1024 * 1024);
  // 검토: MP4 MIME 타입과 기본 크기 1바이트의 road.mp4를 만듭니다.
  const video = testFile('road.mp4', 'video/mp4');
  // 검토: 두 파일을 한 번에 선택한 change 이벤트를 모사합니다.
  await selectFiles([image, video]);
  // 검토: 페이지 텍스트에 road.jpg가 포함되어야 합니다.
  expect(container.textContent).toContain('road.jpg');
  // 검토: 페이지 텍스트에 road.mp4도 포함되어야 합니다.
  expect(container.textContent).toContain('road.mp4');
  // 검토: road.jpg 삭제라는 접근성 이름을 가진 버튼을 찾습니다.
  const remove = container.querySelector('button[aria-label="road.jpg 삭제"]');
  // 검토: 삭제 컨트롤이 실제 button인지 확인합니다.
  assert(remove instanceof HTMLButtonElement);
  // 검토: 삭제 버튼을 클릭하고 React 갱신을 기다립니다.
  await act(async () => remove.click());
  // 검토: 삭제 뒤 페이지 텍스트에서 road.jpg 이름이 사라져야 합니다.
  expect(container.textContent).not.toContain('road.jpg');
  // 검토: 다른 파일 road.mp4 이름은 남아 있어야 합니다.
  expect(container.textContent).toContain('road.mp4');
  // 검토: 동일한 image 객체를 다시 고르는 change 이벤트를 모사합니다. 운영체제 파일 선택 창의 동일 파일 이벤트 동작은 검증하지 않습니다.
  await selectFiles([image]);
  // 검토: 다시 고른 JPEG의 삭제 버튼이 정확히 하나인지 검사합니다.
  expect(
    // 검토: road.jpg 삭제 버튼을 모두 찾습니다.
    container.querySelectorAll('button[aria-label="road.jpg 삭제"]'),
  // 검토: 버튼 개수가 1이어야 하므로 표시가 돌아오되 중복되지 않아야 합니다.
  ).toHaveLength(1);
  // 검토: 파일 input의 accept 목록이 아래 다섯 MIME 타입인지 검사합니다.
  expect(
    // 검토: 현재 페이지 컨테이너 안에서 검사합니다.
    container
      // 검토: 파일 선택 input을 가져옵니다.
      .querySelector('input[type="file"]')
      // 검토: 파일 선택 창에 제공하는 형식 힌트인 accept 속성을 읽습니다.
      ?.getAttribute('accept')
      // 검토: 쉼표 정규식으로 MIME 타입 문자열을 분리합니다.
      ?.split(/,/)
      // 검토: 각 MIME 타입 앞뒤 공백을 제거합니다.
      .map((value) => value.trim())
      // 검토: 목록 순서에 영향을 받지 않도록 실제 목록을 정렬합니다.
      .sort(),
  // 검토: 정렬한 실제 목록을 아래 정렬한 기대 목록과 비교합니다.
  ).toEqual(
    // 검토: 허용 형식을 JPEG·PNG·WebP·MP4·WebM으로 제안합니다. accept 속성만으로 파일 내용이 안전하다는 뜻은 아닙니다.
    ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].sort(),
  );
  // 검토: 선택·삭제·재선택 과정에서 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 5. reportAttachmentLimits

원본: `test-5.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportAttachmentLimits: 잘못된 묶음 전체 거부·기존 선택 보존·최대 세 개 제한을 검증합니다.
test('reportAttachmentLimits: invalid batches preserve previous selection', async () => {
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 기존 선택 보존을 확인할 kept.png 파일을 먼저 고릅니다.
  await selectFiles([testFile('kept.png', 'image/png')]);
  // 검토: 아래 거부 대상을 각각 유효한 파일 하나와 묶어 선택합니다.
  for (const rejected of [
    // 검토: 허용 타입이지만 가짜 size가 10 MiB보다 1바이트 큰 파일을 준비합니다.
    testFile('large.webp', 'image/webp', 10 * 1024 * 1024 + 1),
    // 검토: 허용 타입이지만 가짜 size가 0인 파일을 준비합니다.
    testFile('empty.png', 'image/png', 0),
    // 검토: 허용 목록 밖의 SVG MIME 타입 파일을 준비합니다. 실제 SVG 내용을 검사하는 사례는 아닙니다.
    testFile('unsafe.svg', 'image/svg+xml'),
    // 검토: 확장자는 jpg지만 MIME 타입이 빈 파일을 준비합니다.
    testFile('unknown.jpg', ''),
  // 검토: 각 거부 대상에 동일한 묶음 거부 시나리오를 반복합니다.
  ]) {
    // 검토: 거부 파일과 유효한 batch.webm을 함께 골라 일부만 받아들이지 않는지 확인합니다.
    await selectFiles([rejected, testFile('batch.webm', 'video/webm')]);
    // 검토: DOM에 비어 있지 않은 경고 문구가 있는지 검사합니다.
    expect(
      // 검토: 첫 번째 role="alert" 요소에서 앞뒤 공백을 제외한 텍스트를 읽습니다.
      container.querySelector('[role="alert"]')?.textContent?.trim(),
    // 검토: 경고 텍스트가 있어야 합니다. 이유별 정확한 문구는 고정하지 않습니다.
    ).toBeTruthy();
    // 검토: 기존 kept.png가 계속 선택되어 표시되는지 검사합니다.
    expect(
      // 검토: kept.png 삭제 버튼을 찾습니다.
      container.querySelector('button[aria-label="kept.png 삭제"]'),
    // 검토: 기존 파일 삭제 버튼이 남아 있어야 합니다.
    ).not.toBeNull();
    // 검토: 잘못된 묶음에 동반된 유효 파일도 추가되지 않았는지 검사합니다.
    expect(
      // 검토: batch.webm 삭제 버튼을 찾습니다.
      container.querySelector('button[aria-label="batch.webm 삭제"]'),
    // 검토: batch.webm 삭제 버튼이 없어야 합니다.
    ).toBeNull();
    // 검토: 거부 대상 파일도 추가되지 않았는지 검사합니다.
    expect(
      // 검토: 이번에 거부한 파일 이름의 삭제 버튼을 찾습니다.
      container.querySelector(`button[aria-label="${rejected.name} 삭제"]`),
    // 검토: 거부 파일의 삭제 버튼이 없어야 합니다.
    ).toBeNull();
  }
  // 검토: 기존 한 개에 더해 아래 두 파일을 함께 선택합니다.
  await selectFiles([
    // 검토: 두 번째 파일로 WebP 타입 two.webp를 준비합니다.
    testFile('two.webp', 'image/webp'),
    // 검토: 세 번째 파일로 WebM 타입 three.webm을 준비합니다.
    testFile('three.webm', 'video/webm'),
  ]);
  // 검토: 두 번째 파일이 받아들여졌는지 검사합니다.
  expect(
    // 검토: two.webp 삭제 버튼을 찾습니다.
    container.querySelector('button[aria-label="two.webp 삭제"]'),
  // 검토: two.webp 삭제 버튼이 있어야 합니다.
  ).not.toBeNull();
  // 검토: 세 번째 파일이 받아들여졌는지 검사합니다.
  expect(
    // 검토: three.webm 삭제 버튼을 찾습니다.
    container.querySelector('button[aria-label="three.webm 삭제"]'),
  // 검토: three.webm 삭제 버튼이 있어야 합니다.
  ).not.toBeNull();
  // 검토: 세 개가 선택된 상태에서 네 번째 유효 JPEG를 더 고릅니다.
  await selectFiles([testFile('four.jpg', 'image/jpeg')]);
  // 검토: 개수 제한으로 네 번째 파일이 추가되지 않았는지 검사합니다.
  expect(
    // 검토: four.jpg 삭제 버튼을 찾습니다.
    container.querySelector('button[aria-label="four.jpg 삭제"]'),
  // 검토: four.jpg 삭제 버튼이 없어야 합니다.
  ).toBeNull();
  // 검토: 개수 초과 후에도 비어 있지 않은 경고가 있는지 검사합니다.
  expect(
    // 검토: 첫 번째 role="alert" 요소의 공백을 제외한 텍스트를 읽습니다.
    container.querySelector('[role="alert"]')?.textContent?.trim(),
  // 검토: 경고 문구가 있어야 합니다. 이 비교는 문구가 정확히 개수 초과를 설명하는지 구별하지 않습니다.
  ).toBeTruthy();
  // 검토: 네 번째 파일 거부 후 첫 번째 파일의 보존을 검사합니다.
  expect(
    // 검토: kept.png 삭제 버튼을 다시 찾습니다.
    container.querySelector('button[aria-label="kept.png 삭제"]'),
  // 검토: kept.png 삭제 버튼이 남아 있어야 합니다.
  ).not.toBeNull();
  // 검토: 네 번째 파일 거부 후 두 번째 파일의 보존도 검사합니다.
  expect(
    // 검토: two.webp 삭제 버튼을 다시 찾습니다.
    container.querySelector('button[aria-label="two.webp 삭제"]'),
  // 검토: two.webp 삭제 버튼이 남아 있어야 합니다.
  ).not.toBeNull();
  // 검토: 네 번째 파일 거부 후 세 번째 파일의 보존도 검사합니다.
  expect(
    // 검토: three.webm 삭제 버튼을 다시 찾습니다.
    container.querySelector('button[aria-label="three.webm 삭제"]'),
  // 검토: three.webm 삭제 버튼이 남아 있어야 합니다.
  ).not.toBeNull();
  // 검토: 표시된 전체 파일 삭제 버튼이 세 개인지도 확인합니다.
  expect(
    // 검토: aria-label이 공백과 삭제로 끝나는 모든 버튼을 찾습니다.
    container.querySelectorAll('button[aria-label$=" 삭제"]'),
  // 검토: 전체 삭제 버튼 수가 정확히 3이어야 합니다.
  ).toHaveLength(3);
  // 검토: 첨부 검증·거부 과정에서 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 6. reportLocalConfirmation

원본: `test-6.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 함께 사용합니다.

```ts
// 검토: reportLocalConfirmation: 입력 확인이 실제 접수를 주장하지 않고 값을 유지하며 새 오류를 반영하는지 검증합니다.
test('reportLocalConfirmation: valid input is retained without claiming receipt', async () => {
  // 검토: Storage.setItem 호출을 관찰합니다. localStorage·sessionStorage는 포함하지만 IndexedDB나 쿠키 쓰기는 관찰하지 않습니다.
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 공통 유효 예시로 필수값을 채웁니다.
  await fillValid();
  // 검토: HTML처럼 보이는 내용도 사용자 문자열로 남는지 확인할 입력을 설정합니다.
  await changeField(
    // 검토: 변경 대상은 상세 내용 필드입니다.
    'description',
    // 검토: img 태그와 onerror 속성을 닮은 문자열에 한국어 사용자 내용을 붙여 넣습니다.
    '<img src=x onerror=alert(1)> 사용자가 적은 내용',
  );
  // 검토: 입력 확인을 실행하고 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: 확인 결과를 알리는 첫 번째 role="status" 요소를 찾습니다.
  const status = container.querySelector('[role="status"]');
  // 검토: status 요소가 존재해야 합니다.
  assert(status);
  // 검토: status에 입력 확인 완료가 포함되어야 합니다.
  expect(status.textContent).toContain('입력 확인 완료');
  // 검토: status에 입력한 내용은 전송되지 않았어요라는 안내가 포함되어야 합니다.
  expect(status.textContent).toContain('입력한 내용은 전송되지 않았어요');
  // 검토: 페이지 텍스트에 접수 완료나 접수번호라는 표현이 없어야 합니다.
  expect(container.textContent).not.toMatch(/접수 완료|접수번호/);
  // 검토: 확인 뒤 상세 내용이 아래 원문 그대로 남아 있는지 비교합니다.
  expect(field('description').value).toBe(
    // 검토: HTML처럼 보이는 부분까지 포함한 원래 입력 문자열을 기대합니다.
    '<img src=x onerror=alert(1)> 사용자가 적은 내용',
  );
  // 검토: 분류 society가 확인 뒤에도 유지되어야 합니다.
  expect(field('category').value).toBe('society');
  // 검토: 고정 예시 발생 일시가 확인 뒤에도 유지되어야 합니다.
  expect(field('occurredAt').value).toBe('2026-10-12T09:30');
  // 검토: 컨테이너에 src가 x인 img 또는 onerror 속성을 가진 요소가 없어야 합니다. 이 입력 사례의 HTML 해석만 검사하며 모든 XSS 경로를 검증하지는 않습니다.
  expect(container.querySelector('img[src="x"], [onerror]')).toBeNull();
  // 검토: 렌더링부터 유효 입력 확인까지 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
  // 검토: 이 시점까지 Storage.setItem을 호출하지 않았는지 확인합니다. 새로고침 후 값 유지 여부는 검사하지 않습니다.
  expect(storageWrite).not.toHaveBeenCalled();
  // 검토: 한 번 확인한 뒤 제목을 빈 문자열로 바꿉니다.
  await changeField('title', '');
  // 검토: 다시 입력 확인을 실행하고 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: 제목이 오류 상태이며 연결 설명에 필수 항목이에요가 포함되어야 합니다.
  expectFieldError('title', '필수 항목이에요');
  // 검토: 새 오류 뒤에는 이전 입력 확인 완료 문구가 남아 있지 않아야 합니다.
  expect(container.textContent).not.toContain('입력 확인 완료');
  // 검토: 상세 내용에는 사용자가 적은 내용이 계속 남아 있어야 합니다.
  expect(field('description').value).toContain('사용자가 적은 내용');
});
```

## 원본 대조 결과

일곱 코드 블록에서 새로 넣은 `// 검토:` 설명 줄만 제거했을 때 각 원본 파일과 바이트 단위로 일치하는지 확인했습니다. 빈 줄·들여쓰기·원래 주석·순서·마지막 줄바꿈을 보존했습니다. 아래 해시는 대조한 원본 기준입니다. 이 검사는 복사 정확성의 증거이며 테스트 실행 성공이나 제품 정책 승인을 뜻하지 않습니다.

- `test-header.txt`: SHA-256 `5eb3db81be8b69be6d7c65908522c4cbd117cbf446c79c3c02aa943e8e923ac4`
- `test-1.txt`: SHA-256 `cd9d992f15b067220ad658d6cffbd9f032a8eebfccb65c31688a6a851f045202`
- `test-2.txt`: SHA-256 `33a4538bb3c120d7a0214d95006b39c273d14fe8a744c07dd7a50c54d180b678`
- `test-3.txt`: SHA-256 `3d2609fb2496b55d1e4a0aa67e7e65dabf283d544c42b42aad9911945e66301c`
- `test-4.txt`: SHA-256 `4995888cff4a587eda35c6beb70b29094bc892ba2a39e1e497d48c76cdd1d52f`
- `test-5.txt`: SHA-256 `b1ae78cbcdce8cf3f756e4297b1069f97fc9169ad52c1eae87ceb8e4f9385951`
- `test-6.txt`: SHA-256 `acef656107d3fed4815ae2bfe7820c239fb0ebf814eede5a31102821bb8c64c6`
