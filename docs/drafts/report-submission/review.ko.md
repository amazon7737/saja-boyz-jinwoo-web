# 실제 제보 접수 연결 — 테스트 교체안 검토

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

이 문서는 `docs/drafts/report-submission/header.txt`와 `test-1.txt`부터 `test-11.txt`의 실행 블록을 그대로 보존하고 한국어 `// 검토:` 설명 줄만 추가한 검토용 사본입니다. 최종 실행 대상은 `src/app/report/report-form.test.ts`입니다. 공통 헤더는 한 번 설명하며 모든 항목이 같은 도우미를 사용합니다.

## 왜 교체하는가

기존 제보 폼의 여섯 테스트는 **서버로 전송하지 않는 로컬 입력 확인**을 기준으로 삼았습니다. 이번 제안은 **익명·비공개 Go 제보 접수 API에 multipart로 실제 제출**하는 기능을 연결하므로, 기존의 미전송·로컬 확인 성공 기준과 충돌하는 네 항목을 교체하고 새로운 동작을 포함한 아홉 항목을 도입하려는 것입니다. 기존 첨부 회귀 테스트 두 개를 더하면 최종적으로 열한 테스트가 됩니다.

- `test-4.txt`와 `test-5.txt`는 이미 구현되어 통과하는 기존 첨부 회귀 테스트입니다. 원문 바이트를 그대로 보존하며 새 미구현 과제로 취급하지 않습니다.
- 새 계획 항목은 `test-1.txt`·`test-2.txt`·`test-3.txt`·`test-6.txt`부터 `test-11.txt`까지 총 아홉 개입니다. 아래 번호는 파일 번호이며 실행 계획의 연속 번호와 다를 수 있습니다.
- 공통 헤더와 유지하는 두 회귀 항목은 명시적인 승인 후 교체 기준에 포함되고, 아홉 새 항목이 그 위에서 개발 기준이 됩니다. **이 정확한 헤더·기존 테스트 교체·새 테스트 본문은 사람의 승인이 필요합니다.** 이 문서를 만든 것만으로 승인 등록이나 기존 승인 테스트 변경이 이루어지지는 않습니다.

## 전제와 검증 범위

- 이 문서의 대상은 프런트엔드 테스트입니다. 실제 페이지를 jsdom에 렌더링하지만 전역 `fetch`는 mock입니다. Go 서버, 운영 API, 파일 저장소에 접속하지 않으며 실제 접수·비공개 접근 통제·서버의 중복 제거·CORS·multipart 직렬화 바이트는 검증하지 않습니다. 비공개 안내와 익명 요청 옵션은 검사하지만 그것만으로 서버 정책이 증명되지는 않습니다.
- 정상 접수증은 고정 예시입니다. ID는 `a` 32개, 상태는 `pending`, 접수 시각은 고정 UTC 값입니다. 새 접수 201과 동일 내용 재시도 200을 정상으로 취급하고, 202·오류 응답·계약 밖의 본문은 접수 성공으로 표시하지 않는 교체안을 제시합니다.
- 입력 시각을 **한국시간**으로 안내하고 테스트의 `TZ`를 UTC로 설정한 뒤 예시 `2026-10-12T09:30`을 `2026-10-12T00:30:00.000Z`로 전송하는 한 사례를 검사합니다. 현재 시각을 고정하지 않으며 미래 시각 정책이나 모든 날짜 경계를 검사하지 않습니다.
- 입력은 DOM setter와 합성 input/change 이벤트로 바꿉니다. submit도 직접 발생시켜 native constraint validation을 우회합니다. `required`·`noValidate` 속성과 매 submit의 `defaultPrevented`를 확인하지만 실제 브라우저의 키보드·한글 조합·폼 이동·날짜 선택기·파일 선택 창까지 재현하지는 않습니다.
- 파일 내용은 언제나 문자 `x` 하나이며 이름·MIME 타입과 `size` 속성만 지정하거나 덮어씁니다. PNG·JPEG·동영상 시그니처가 유효한 파일이 아닙니다. 큰 파일 메모리 사용, 실제 디코딩, 시그니처 검사, MIME 위장·악성 파일 검사, 업로드 결과는 검증하지 않습니다. 파일 목록도 배열에 `item(index)`를 붙인 모사 객체이며 실제 FileList가 아닙니다.
- 기존 글자 수·첨부 정책은 회귀로 유지합니다. 글자 수 경계는 완성형 한글 `가`로만 검사하며 이모지·결합 문자 기준은 별도로 검증하지 않습니다. 분류 기대값은 기존 `categoryLabels`를 재사용합니다.
- 재시도 테스트는 요청 키의 유지·변경 및 화면의 값·첨부 표시를 확인합니다. 서버가 실제 중복 저장을 막았는지, 새로고침 후 키가 유지되는지까지 검사하지 않습니다. `Storage.setItem` 미호출 검사도 해당 경로만 관찰하며 IndexedDB·쿠키는 관찰하지 않습니다.
- 오류 도우미는 `aria-invalid`와 `aria-describedby`로 연결된 문구를 검사합니다. 화면 배치·시각적 노출·스크린리더 실제 읽기는 별도 확인이 필요합니다. HTML 유사 문자열 한 사례의 DOM 생성을 검사하며 포괄적 보안 검증을 대체하지 않습니다.

## 공통 헤더와 지원 코드

원본: `header.txt` · 대상: `src/app/report/report-form.test.ts`

```ts
// 검토: 공통 헤더와 최종 열한 테스트의 실행 대상 파일을 src/app/report/report-form.test.ts로 지정하는 원본 주석입니다.
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
// 검토: 실제 전역 fetch를 대체해 요청을 기록할 mock을 만듭니다. 각 테스트 전 기본 성공 응답을 설정하며 외부 서버에는 접속하지 않습니다.
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

// 검토: 서버가 돌려줄 정상 접수증의 고정 예시를 정의합니다. 실제 접수 기록이 아닙니다.
const receipt = {
  // 검토: 접수 ID 예시는 a를 32번 반복한 소문자 16진수 문자열입니다. 요청 중복 방지용 UUID와 다른 값입니다.
  report_id: 'a'.repeat(32),
  // 검토: 접수 후 공개되지 않은 검토 대기 상태를 pending으로 표현한 응답 예시입니다.
  status: 'pending',
  // 검토: 접수 시각은 고정 UTC 문자열입니다. 테스트의 현재 시각을 고정하는 코드가 아닙니다.
  received_at: '2026-10-13T05:00:00Z',
};

// 검토: 정상 접수증을 담은 모의 HTTP 응답을 만드는 도우미입니다. 상태를 생략하면 신규 접수 201을 사용합니다.
function receiptResponse(status = 201) {
  // 검토: 접수증 객체를 JSON 문자열로 직렬화해 Response 객체의 본문으로 넣습니다.
  return new Response(JSON.stringify(receipt), {
    // 검토: 호출자가 지정한 HTTP 상태 코드를 적용합니다. 재시도 테스트에서는 200도 사용합니다.
    status,
    // 검토: 응답이 JSON이라고 표시하는 Content-Type 헤더를 설정합니다.
    headers: { 'Content-Type': 'application/json' },
  });
}

// 검토: 각 테스트 전에 격리된 DOM과 공통 mock을 준비합니다.
beforeEach(() => {
  // 검토: 공개 접수 API 기준 주소를 테스트 전용 HTTPS 호스트로 임시 설정합니다. 실제 주소나 비밀 키가 아닙니다.
  vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', 'https://reports.example.test');
  // 검토: 별도 지정이 없는 fetch 호출은 비동기로 정상 201 접수증을 받도록 설정합니다.
  fetchMock.mockImplementation(async () => receiptResponse());
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
  // 검토: 테스트에서 바꾼 공개 API 주소와 TZ를 포함한 임시 환경변수를 원래 값으로 복구합니다.
  vi.unstubAllEnvs();
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

// 검토: 폼 submit 핸들러를 직접 실행하고 기본 제출을 막는지 확인하는 공통 도우미입니다. 함수 이름은 기존 checkInput을 유지합니다.
async function checkInput() {
  // 검토: 컨테이너에서 첫 번째 form 요소를 찾습니다.
  const form = container.querySelector('form');
  // 검토: form이 있어야 한다는 전제 조건을 확인합니다.
  assert(form, 'report form must exist');
  // 검토: 전파 가능하며 preventDefault로 취소할 수 있는 submit 이벤트를 만듭니다.
  const event = new Event('submit', { bubbles: true, cancelable: true });
  // 검토: 이벤트 처리에 따른 React 갱신을 act 안에서 반영합니다. 대기 중인 네트워크 Promise를 자동으로 완료시키지는 않습니다.
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
  // 검토: 한국시간 2026-10-12 09:30을 고정 입력 예시로 사용합니다. UTC 변환은 test-6에서 확인하며 현재 시각은 고정하지 않습니다.
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

// 검토: 초기 계획 항목에서는 일부 공통 도우미만 사용하므로 아래에서 전체 도우미를 참조한다는 원본 주석입니다.
// Shared draft helpers are referenced here because early plan entries use only a subset.
// 검토: 도우미 참조 배열을 평가하고 결과를 버립니다. 미사용 판정을 피하기 위한 참조이며 도우미를 실행하지 않습니다.
void [
  // 검토: 페이지 렌더링 도우미를 참조합니다.
  renderReport,
  // 검토: 필드 검색 도우미를 참조합니다.
  field,
  // 검토: 입력 변경 도우미를 참조합니다.
  changeField,
  // 검토: submit 이벤트 도우미를 참조합니다.
  checkInput,
  // 검토: 공통 유효값 입력 도우미를 참조합니다.
  fillValid,
  // 검토: 파일 선택 모사 도우미를 참조합니다.
  selectFiles,
  // 검토: 파일 fixture 생성 도우미를 참조합니다.
  testFile,
  // 검토: 필드 오류 연결 검사 도우미를 참조합니다.
  expectFieldError,
];
```

## 1. reportSubmissionFields

원본: `test-1.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionFields: 기존 입력 구조를 유지하면서 실제 접수 버튼·한국시간·비공개 안내를 제공하는지 확인하는 새 계획 항목입니다.
test('reportSubmissionFields: labels and shared categories are available', async () => {
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
  // 검토: 기존과 같이 첨부는 필수가 아니어야 합니다.
  expect(fileInput.required).toBe(false);
  // 검토: noValidate가 켜져 기본 브라우저 검증 대신 앱의 검증 흐름을 사용하도록 설정됐는지 확인합니다.
  expect(container.querySelector('form')?.noValidate).toBe(true);
  // 검토: 제출 버튼이 실제 제보 접수라는 동작을 안내하는지 검사합니다.
  expect(
    // 검토: submit 타입 버튼의 텍스트를 읽습니다.
    container.querySelector('button[type="submit"]')?.textContent,
  // 검토: 버튼 문구에 제보 접수가 포함되어야 합니다.
  ).toContain('제보 접수');
  // 검토: 페이지 텍스트에 한국시간 안내가 포함되어야 합니다. 이 줄만으로 시간 변환이 증명되지는 않습니다.
  expect(container.textContent).toContain('한국시간');
  // 검토: 페이지 텍스트에 비공개 안내가 포함되어야 합니다. 서버의 실제 접근 통제를 검사하는 것은 아닙니다.
  expect(container.textContent).toContain('비공개');
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

## 2. reportSubmissionRequiredFields

원본: `test-2.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionRequiredFields: 기존 필수값 오류·수정 흐름을 유지하되 수정 후에는 모의 접수 API를 호출하고 접수 결과를 알리는지 검사합니다.
test('reportSubmissionRequiredFields: whitespace errors are linked and corrected', async () => {
  // 검토: 공통 도우미로 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 제목·장소·상세 내용 세 필드에 같은 공백 사례를 적용합니다.
  for (const name of ['title', 'location', 'description']) {
    // 검토: 공백 세 개를 넣어 비어 있지 않은 문자열도 유효한 내용으로 오인하지 않는지 준비합니다.
    await changeField(name, '   ');
  }
  // 검토: 분류와 일시는 빈 상태로 submit 이벤트를 보내 기본 제출 차단과 필수값 오류를 검사할 준비를 합니다.
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
  // 검토: 수정한 입력을 제출하고 기본 제출 차단도 검사합니다. 기본 mock은 정상 접수증을 반환합니다.
  await checkInput();
  // 검토: 다섯 필드에 남은 오류 표시가 있는지 각각 검사합니다.
  for (const name of fieldNames) {
    // 검토: aria-invalid가 더 이상 true가 아니어야 합니다. 속성 제거와 false 표기 모두 허용합니다.
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
  }
  // 검토: 유효한 값으로 고친 뒤 전체 fetch 호출이 정확히 한 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: role="status" 요소에 접수 성공 문구가 포함되어 있는지 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 단순 로컬 입력 확인 대신 제보가 접수됐어요라는 결과를 기대합니다.
    '제보가 접수됐어요',
  );
  // 검토: 확인 뒤에도 제목에 도로 점검 제보가 그대로 남아 있어야 합니다.
  expect(field('title').value).toBe('도로 점검 제보');
});
```

## 3. reportSubmissionTextLimits

원본: `test-3.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionTextLimits: 기존 공백 제외 길이 제한을 유지하고 초과값은 전송하지 않으며 경계값만 접수하는지 검사합니다.
test('reportSubmissionTextLimits: trimmed field limits reject overflow and allow boundaries', async () => {
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 다른 필수값 오류가 섞이지 않도록 공통 유효 예시를 채웁니다.
  await fillValid();
  // 검토: 지금까지 정상 경계값으로 제출한 횟수를 0에서 시작합니다.
  let completed = 0;
  // 검토: 아래 세 필드와 각 제한에 같은 초과·경계 시나리오를 반복합니다.
  for (const [name, limit] of [
    // 검토: 기존 제목 최대 길이 100을 계속 검사합니다.
    ['title', 100],
    // 검토: 기존 장소 최대 길이 200을 계속 검사합니다.
    ['location', 200],
    // 검토: 기존 상세 내용 최대 길이 5000을 계속 검사합니다.
    ['description', 5000],
  // 검토: 필드·제한 쌍을 상수 타입으로 유지해 순서대로 검사합니다.
  ] as const) {
    // 검토: 가를 제한보다 한 글자 더 반복해 이번 필드의 길이를 초과시킵니다.
    await changeField(name, '가'.repeat(limit + 1));
    // 검토: 초과값으로 제출을 시도하고 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: 필드 오류 상태와 해당 제한 숫자를 포함한 초과 안내가 연결되어야 합니다.
    expectFieldError(name, `${limit}자를 초과했어요`);
    // 검토: 호출 수가 이전 정상 제출 횟수 그대로여야 하므로 이번 초과값은 fetch로 전송되면 안 됩니다.
    expect(fetchMock).toHaveBeenCalledTimes(completed);
    // 검토: 초과값을 제출한 화면에 접수 성공 문구가 없어야 합니다.
    expect(container.textContent).not.toContain('제보가 접수됐어요');
    // 검토: 초과값을 제출한 화면에 모의 접수 ID도 없어야 합니다.
    expect(container.textContent).not.toContain(receipt.report_id);
    // 검토: 제한 길이의 가 앞뒤에 공백 두 개씩을 넣어 공백 제외 길이가 경계값인 입력으로 바꿉니다.
    await changeField(name, `  ${'가'.repeat(limit)}  `);
    // 검토: 경계값으로 제출하고 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: 이번 정상 제출에 맞춰 기대 요청 횟수를 하나 늘립니다.
    completed += 1;
    // 검토: 경계값 제출로 fetch 호출이 정확히 한 번 늘어야 합니다.
    expect(fetchMock).toHaveBeenCalledTimes(completed);
    // 검토: 경계값 필드의 aria-invalid가 true가 아니어야 합니다.
    expect(field(name).getAttribute('aria-invalid')).not.toBe('true');
    // 검토: role="status" 요소에서 접수 결과 안내를 검사합니다.
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      // 검토: 정상 경계값은 제보가 접수됐어요라는 결과를 보여야 합니다.
      '제보가 접수됐어요',
    );
    // 검토: 입력값을 trim한 결과가 경계 길이의 가와 같아야 합니다. 입력칸 자체의 앞뒤 공백 보존 정책은 고정하지 않습니다.
    expect(field(name).value.trim()).toBe('가'.repeat(limit));
    // 검토: 새 제보 작성 버튼을 찾기 위해 버튼 목록을 순회합니다.
    const restart = Array.from(container.querySelectorAll('button')).find(
      // 검토: 버튼 텍스트에 새 제보 작성이 포함된 첫 버튼을 고릅니다.
      (button) => button.textContent?.includes('새 제보 작성'),
    );
    // 검토: 새 제보 작성 버튼이 존재해야 합니다.
    assert(restart);
    // 검토: 클릭 후 갱신을 기다려 다음 필드 검사를 새 제보로 시작합니다.
    await act(async () => restart.click());
    // 검토: 다음 반복을 위해 공통 유효 예시를 다시 채웁니다.
    await fillValid();
  }
  // 검토: 세 필드의 정상 경계값마다 한 번씩 전체 fetch 호출이 정확히 세 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
```

## 4. reportAttachments — 기존 회귀 유지

원본: `test-4.txt` · 대상: `src/app/report/report-form.test.ts` · 기존 통과 회귀, 새 계획 항목 아님 · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportAttachments: 이미 구현되어 통과하는 기존 첨부 선택·삭제·재선택 회귀 테스트를 원문 그대로 유지합니다. 새 미구현 항목이 아닙니다.
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
    // 검토: 기존 허용 형식인 JPEG·PNG·WebP·MP4·WebM과 일치해야 합니다. accept 속성만으로 파일 내용이 안전하다는 뜻은 아닙니다.
    ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].sort(),
  );
  // 검토: 선택·삭제·재선택 과정에서 전역 fetch를 호출하지 않았는지 확인합니다.
  expect(fetchMock).not.toHaveBeenCalled();
});
```

## 5. reportAttachmentLimits — 기존 회귀 유지

원본: `test-5.txt` · 대상: `src/app/report/report-form.test.ts` · 기존 통과 회귀, 새 계획 항목 아님 · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportAttachmentLimits: 이미 구현되어 통과하는 기존 묶음 거부·선택 보존·개수 제한 회귀 테스트를 원문 그대로 유지합니다. 새 미구현 항목이 아닙니다.
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

## 6. reportSubmissionPayload

원본: `test-6.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionPayload: 전송 URL·익명 요청 옵션·중복 방지 키·정리한 값·한국시간 변환·남은 첨부 파일을 FormData에서 검사합니다.
test('reportSubmissionPayload: trimmed fields Korean time and retained attachments are sent', async () => {
  // 검토: 테스트의 TZ 환경변수를 UTC로 바꿉니다. 실행 환경의 기본 시간대가 한국시간이라고 가정하지 않고 한국시간 입력 변환을 검사하려는 설정입니다.
  vi.stubEnv('TZ', 'UTC');
  // 검토: 공통 도우미로 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 유효한 필수값 예시를 채웁니다.
  await fillValid();
  // 검토: 제목 앞뒤에 공백을 추가해 전송 시 제거되는지 준비합니다.
  await changeField('title', '  도로 점검 제보  ');
  // 검토: 장소 앞뒤에도 공백을 추가합니다.
  await changeField('location', '  부산 남구 용호동  ');
  // 검토: 내용의 앞뒤 공백 제거와 HTML 유사 문자열 보존을 확인할 입력을 설정합니다.
  await changeField(
    // 검토: 변경 대상은 상세 내용 필드입니다.
    'description',
    // 검토: 앞뒤 공백과 img 태그·onerror 속성을 닮은 문자열을 입력합니다.
    '  <img src=x onerror=alert(1)> 보행로 확인  ',
  );
  // 검토: 유지할 이미지와 나중에 지울 영상을 함께 선택합니다.
  await selectFiles([
    // 검토: 유지할 kept.png는 PNG MIME 타입, 실제 내용 x 한 글자의 파일 fixture입니다.
    testFile('kept.png', 'image/png'),
    // 검토: 제거할 removed.mp4는 MP4 MIME 타입의 같은 방식 fixture입니다.
    testFile('removed.mp4', 'video/mp4'),
  ]);
  // 검토: 영상 삭제 컨트롤을 찾습니다.
  const remove = container.querySelector(
    // 검토: 접근성 이름이 removed.mp4 삭제인 버튼을 지정합니다.
    'button[aria-label="removed.mp4 삭제"]',
  );
  // 검토: 그 컨트롤이 실제 button인지 확인합니다.
  assert(remove instanceof HTMLButtonElement);
  // 검토: 영상 삭제 버튼을 클릭하고 React 갱신을 기다립니다.
  await act(async () => remove.click());
  // 검토: 제보를 제출하는 submit 이벤트를 보내고 기본 제출 차단도 확인합니다.
  await checkInput();
  // 검토: fetch 호출이 정확히 한 번 있어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 기록된 첫 fetch 호출에서 URL과 요청 옵션을 꺼냅니다.
  const [url, init] = fetchMock.mock.calls[0];
  // 검토: 요청 주소가 설정한 기준 주소 아래 /reports 경로와 정확히 일치해야 합니다.
  expect(String(url)).toBe('https://reports.example.test/reports');
  // 검토: HTTP 메서드가 POST이어야 합니다.
  expect(init?.method).toBe('POST');
  // 검토: credentials가 omit이어야 하므로 브라우저 자격 증명을 포함하지 않도록 요청해야 합니다. 서버의 익명 접수 허용을 직접 검사하지는 않습니다.
  expect(init?.credentials).toBe('omit');
  // 검토: 전송 옵션의 헤더를 대소문자 구분 없이 조회 가능한 Headers로 만듭니다.
  const headers = new Headers(init?.headers);
  // 검토: Idempotency-Key가 아래 UUID v4 형식에 맞는지 확인합니다.
  expect(headers.get('Idempotency-Key')).toMatch(
    // 검토: 16진수 구획과 버전 4·variant 비트를 검사합니다. 형식 일치가 키의 무작위성이나 서버 중복 제거를 증명하지는 않습니다.
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  // 검토: Content-Type을 직접 지정하지 않아 브라우저가 multipart 경계값을 붙일 수 있어야 합니다. 실제 직렬화 바이트는 검사하지 않습니다.
  expect(headers.has('Content-Type')).toBe(false);
  // 검토: Authorization 헤더를 보내지 않아야 합니다.
  expect(headers.has('Authorization')).toBe(false);
  // 검토: 요청 본문이 FormData 인스턴스인지 확인합니다.
  assert(init?.body instanceof FormData);
  // 검토: 분류가 category 필드의 society로 전송되어야 합니다.
  expect(init.body.get('category')).toBe('society');
  // 검토: 한국시간 2026-10-12 09:30이 UTC 00:30으로 바뀌어 occurred_at에 들어가야 합니다.
  expect(init.body.get('occurred_at')).toBe('2026-10-12T00:30:00.000Z');
  // 검토: title에는 앞뒤 공백을 제거한 제목이 들어가야 합니다.
  expect(init.body.get('title')).toBe('도로 점검 제보');
  // 검토: location에는 앞뒤 공백을 제거한 장소가 들어가야 합니다.
  expect(init.body.get('location')).toBe('부산 남구 용호동');
  // 검토: description의 전송 문자열을 아래 값과 비교합니다.
  expect(init.body.get('description')).toBe(
    // 검토: 앞뒤 공백만 제거하고 HTML처럼 보이는 사용자 문자열 자체는 그대로 전송해야 합니다.
    '<img src=x onerror=alert(1)> 보행로 확인',
  );
  // 검토: attachments라는 반복 필드에 담긴 모든 값을 꺼냅니다.
  const files = init.body.getAll('attachments');
  // 검토: 선택 후 삭제하지 않은 파일 하나만 들어 있어야 합니다.
  expect(files).toHaveLength(1);
  // 검토: 첨부 값이 실제 File 객체 형태인지 확인합니다.
  assert(files[0] instanceof File);
  // 검토: 남은 파일의 이름·MIME 타입·size를 순서대로 비교합니다.
  expect([files[0].name, files[0].type, files[0].size]).toEqual([
    // 검토: 파일 이름은 kept.png이어야 합니다.
    'kept.png',
    // 검토: 파일의 MIME 타입은 image/png이어야 합니다. 실제 PNG 파일 시그니처 검증은 아닙니다.
    'image/png',
    // 검토: fixture의 크기 값은 1바이트이어야 합니다.
    1,
  ]);
  // 검토: role="status" 요소가 응답으로 받은 접수 ID를 보여 주는지 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 임의로 만든 번호 대신 모의 응답 receipt.report_id가 포함되어야 합니다.
    receipt.report_id,
  );
  // 검토: 사용자 문자열을 HTML로 해석한 img[src="x"] 또는 onerror 속성 요소가 없어야 합니다. 포괄적 XSS 검증은 아닙니다.
  expect(container.querySelector('img[src="x"], [onerror]')).toBeNull();
});
```

## 7. reportSubmissionPending

원본: `test-7.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionPending: 응답 대기 중 중복 제출·입력 변경을 막고 정상 접수증 뒤 완료 처리와 새 제보 초기화를 하는지 검사합니다. 제목의 real receipt도 테스트에서는 mock입니다.
test('reportSubmissionPending: double submit is locked until a real receipt arrives', async () => {
  // 검토: 응답을 원하는 시점에 완료시킬 Promise resolve 함수를 보관할 변수를 준비합니다.
  let release!: (response: Response) => void;
  // 검토: 다음 한 번의 fetch 호출만 즉시 응답하지 않는 mock으로 바꿉니다.
  fetchMock.mockImplementationOnce(
    // 검토: fetch 호출 시 아래 Promise를 반환하도록 설정합니다.
    () =>
      // 검토: Response를 받을 때까지 대기하는 Promise를 만듭니다.
      new Promise<Response>((resolve) => {
        // 검토: 나중에 테스트가 응답을 전달할 수 있도록 resolve를 release에 보관합니다.
        release = resolve;
      }),
  );
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 유효한 필수값 예시를 채웁니다.
  await fillValid();
  // 검토: 대기 중 파일 변경도 막는지 볼 수 있도록 road.png를 선택합니다.
  await selectFiles([testFile('road.png', 'image/png')]);
  // 검토: 제출을 시작하되 모의 응답은 아직 완료시키지 않습니다. 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: 대기 상태의 fetch 요청은 정확히 한 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 페이지 텍스트에 접수 중 안내가 포함되어야 합니다.
  expect(container.textContent).toContain('접수 중');
  // 검토: 서버 응답 전에는 모의 접수 ID를 먼저 보여 주면 안 됩니다.
  expect(container.textContent).not.toContain(receipt.report_id);
  // 검토: 대기 중 변경을 막아야 하는 아래 입력·버튼 요소를 모두 순회합니다.
  for (const element of container.querySelectorAll(
    // 검토: 텍스트·파일 input, textarea, select, 제출 버튼, 파일 삭제 버튼을 검사 대상으로 지정합니다.
    'input, textarea, select, button[type="submit"], button[aria-label$=" 삭제"]',
  // 검토: 찾은 컨트롤 각각에 다음 비활성 검사를 적용합니다.
  )) {
    // 검토: 각 컨트롤이 :disabled에 해당해야 합니다. 직접 disabled 설정과 비활성 fieldset의 영향 모두 허용합니다.
    expect(element.matches(':disabled')).toBe(true);
  }
  // 검토: 대기 중 버튼 상태와 별도로 submit 이벤트를 다시 직접 보냅니다.
  await checkInput();
  // 검토: 두 번째 이벤트가 추가 요청을 만들지 않아 호출 수가 여전히 한 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 정상 201 접수증으로 대기 중 Promise를 완료시키고 React 갱신을 기다립니다.
  await act(async () => release(receiptResponse()));
  // 검토: 정상 응답 뒤 role="status"에서 접수 성공 안내를 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 제보가 접수됐어요라는 문구가 포함되어야 합니다.
    '제보가 접수됐어요',
  );
  // 검토: 완료 안내에 모의 서버 접수 ID가 포함되는지 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 응답으로 받은 receipt.report_id를 기대합니다.
    receipt.report_id,
  );
  // 검토: 접수 완료 상태에서 submit 이벤트를 한 번 더 직접 보냅니다.
  await checkInput();
  // 검토: 완료한 제보를 다시 보내지 않아 fetch 호출 수는 한 번 그대로여야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 새 제보 작성 버튼을 찾기 위해 버튼 목록을 순회합니다.
  const restart = Array.from(container.querySelectorAll('button')).find(
    // 검토: 텍스트에 새 제보 작성이 포함된 버튼을 고릅니다.
    (button) => button.textContent?.includes('새 제보 작성'),
  );
  // 검토: 새 제보 작성 버튼이 존재해야 합니다.
  assert(restart);
  // 검토: 그 버튼을 클릭하고 초기화 상태가 반영될 때까지 기다립니다.
  await act(async () => restart.click());
  // 검토: 새 제보를 시작하면 제목 입력값은 빈 문자열이어야 합니다. 모든 다른 필드의 초기화까지 직접 검사하지는 않습니다.
  expect(field('title').value).toBe('');
  // 검토: 선택 파일의 삭제 버튼이 남아 있는지 검사합니다.
  expect(
    // 검토: 접근성 이름이 공백과 삭제로 끝나는 모든 버튼을 찾습니다.
    container.querySelectorAll('button[aria-label$=" 삭제"]'),
  // 검토: 삭제 버튼이 0개여야 하므로 선택한 파일 표시가 사라져야 합니다.
  ).toHaveLength(0);
  // 검토: 이전 제보의 접수 ID도 페이지 텍스트에서 사라져야 합니다.
  expect(container.textContent).not.toContain(receipt.report_id);
});
```

## 8. reportSubmissionRetry

원본: `test-8.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionRetry: 접수 여부가 불명확한 통신 실패 뒤 값·첨부를 보존하고 다시 수정·제출할 수 있으며 같은 요청 키로 재시도하는지 검사합니다.
test('reportSubmissionRetry: an ambiguous failure keeps values files and the same request key', async () => {
  // 검토: 첫 fetch를 Failed to fetch TypeError로 거절해 응답을 받지 못한 상황을 모사합니다. 서버에 실제 저장됐는지는 알 수 없습니다.
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  // 검토: 두 번째 fetch는 같은 접수증의 HTTP 200으로 성공하도록 설정합니다. 서버 중복 제거를 실제 실행하는 것은 아닙니다.
  fetchMock.mockImplementationOnce(async () => receiptResponse(200));
  // 검토: Storage.setItem 호출을 감시합니다. localStorage·sessionStorage 경로만 대상으로 하며 IndexedDB·쿠키는 포함하지 않습니다.
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 유효한 필수값 예시를 채웁니다.
  await fillValid();
  // 검토: 실패 뒤 보존을 확인할 road.png를 선택합니다.
  await selectFiles([testFile('road.png', 'image/png')]);
  // 검토: 실패 전 다섯 필드의 값을 이름별 객체로 저장합니다.
  const originalValues = Object.fromEntries(
    // 검토: 분류·일시·제목·장소·내용 각각을 이름과 현재 값의 쌍으로 만듭니다.
    fieldNames.map((name) => [name, field(name).value]),
  );
  // 검토: 첫 제출을 실행해 모의 통신 실패를 받습니다. 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: role="alert"에서 접수 여부가 불명확하다는 안내를 검사합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 접수 여부를 확인하지 못했어요라는 문구가 포함되어야 합니다.
    '접수 여부를 확인하지 못했어요',
  );
  // 검토: 접수증을 받지 않았으므로 접수 ID를 표시하면 안 됩니다.
  expect(container.textContent).not.toContain(receipt.report_id);
  // 검토: 다섯 필드 모두의 실패 뒤 상태를 확인합니다.
  for (const name of fieldNames) {
    // 검토: 각 필드 값이 제출 전 저장한 값과 같아야 합니다.
    expect(field(name).value).toBe(originalValues[name]);
    // 검토: 각 필드가 더 이상 비활성 상태가 아니어서 수정할 수 있어야 합니다.
    expect(field(name).matches(':disabled')).toBe(false);
  }
  // 검토: 다시 제출할 버튼의 활성 상태도 검사합니다.
  expect(
    // 검토: submit 버튼이 :disabled에 해당하는지 읽습니다.
    container.querySelector('button[type="submit"]')?.matches(':disabled'),
  // 검토: false여야 하므로 제출 버튼도 다시 사용할 수 있어야 합니다.
  ).toBe(false);
  // 검토: 실패 뒤 첨부 선택 표시가 남아 있는지 검사합니다.
  expect(
    // 검토: road.png 삭제 버튼을 찾습니다.
    container.querySelector('button[aria-label="road.png 삭제"]'),
  // 검토: 삭제 버튼이 있어야 합니다. 이 줄은 재요청 파일의 실제 바이트를 비교하지 않습니다.
  ).not.toBeNull();
  // 검토: 첫 요청의 헤더에서 중복 방지용 키를 읽습니다.
  const firstKey = new Headers(fetchMock.mock.calls[0][1]?.headers).get(
    // 검토: 조회할 헤더는 Idempotency-Key입니다.
    'Idempotency-Key',
  );
  // 검토: 첫 요청 키가 존재하고 비어 있지 않아야 합니다.
  expect(firstKey).toBeTruthy();
  // 검토: 내용을 변경하지 않고 다시 제출합니다.
  await checkInput();
  // 검토: 재시도를 포함한 fetch 호출 수가 정확히 두 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 두 번째 요청의 헤더에서도 키를 읽습니다.
  const secondKey = new Headers(fetchMock.mock.calls[1][1]?.headers).get(
    // 검토: 같은 Idempotency-Key 헤더를 조회합니다.
    'Idempotency-Key',
  );
  // 검토: 내용이 같으므로 두 번째 요청 키가 첫 요청 키와 정확히 같아야 합니다.
  expect(secondKey).toBe(firstKey);
  // 검토: 200 재시도 응답도 정상 접수증으로 처리해 status에 접수 ID를 표시하는지 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 모의 응답의 receipt.report_id를 기대합니다.
    receipt.report_id,
  );
  // 검토: 전체 과정에서 Storage.setItem을 호출하지 않아야 합니다. 다른 저장 경로까지 검사하지는 않습니다.
  expect(storageWrite).not.toHaveBeenCalled();
});
```

## 9. reportSubmissionFailures

원본: `test-9.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionFailures: 거부 상태·잘못된 접수증·JSON이 아닌 본문에서 성공을 주장하지 않고 다섯 필드와 첨부를 유지하며 다시 제출할 수 있는지 검사합니다.
test('reportSubmissionFailures: rejected or malformed responses never claim receipt or erase the draft', async () => {
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 유효한 필수값 예시를 채웁니다.
  await fillValid();
  // 검토: 실패마다 보존할 road.png를 선택합니다.
  await selectFiles([testFile('road.png', 'image/png')]);
  // 검토: 실패 전 다섯 필드 값을 이름별 객체로 저장합니다.
  const originalValues = Object.fromEntries(
    // 검토: 분류·일시·제목·장소·내용의 이름과 현재 값을 짝지어 기록합니다.
    fieldNames.map((name) => [name, field(name).value]),
  );
  // 검토: 아래 HTTP 상태와 응답 본문 조합을 차례대로 적용합니다.
  for (const [status, body] of [
    // 검토: 422 유효성 거부와 내부 오류 문자열을 포함한 응답을 모사합니다.
    [422, { detail: 'private-internal-error' }],
    // 검토: 429 요청 제한 응답과 내부 오류 문자열을 모사합니다.
    [429, { detail: 'private-internal-error' }],
    // 검토: 507 저장 공간 부족 응답과 내부 오류 문자열을 모사합니다.
    [507, { detail: 'private-internal-error' }],
    // 검토: 500 서버 오류 응답과 내부 오류 문자열을 모사합니다.
    [500, { detail: 'private-internal-error' }],
    // 검토: HTTP 201이지만 필수 접수증 정보가 전혀 없는 본문을 모사합니다.
    [201, {}],
    // 검토: 나머지는 정상이나 접수 ID가 경로처럼 생긴 잘못된 값인 본문을 모사합니다.
    [201, { ...receipt, report_id: '../../private' }],
    // 검토: 나머지는 정상이나 상태가 pending이 아닌 published인 본문을 모사합니다.
    [201, { ...receipt, status: 'published' }],
    // 검토: 나머지는 정상이나 접수 시각을 날짜로 해석할 수 없는 본문을 모사합니다.
    [201, { ...receipt, received_at: 'not-a-date' }],
    // 검토: 본문은 정상이지만 확정 접수 계약의 상태 코드가 아닌 202인 응답을 모사합니다.
    [202, receipt],
    // 검토: 성공 상태 코드 201이지만 본문은 JSON 대신 HTML 문자열인 응답을 모사합니다.
    [201, '<html>private-internal-error</html>'],
  // 검토: 상태·본문 쌍을 상수 타입으로 유지하며 각 조합을 반복 검사합니다.
  ] as const) {
    // 검토: 다음 fetch 한 번만 이번 조합의 응답을 받도록 설정합니다.
    fetchMock.mockResolvedValueOnce(
      // 검토: 문자열 본문은 그대로 쓰고 객체 본문만 JSON으로 직렬화합니다. HTML 사례가 실제 JSON 파싱 실패를 일으키도록 합니다.
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        // 검토: 이번에 검사할 HTTP 상태 코드를 적용합니다.
        status,
        // 검토: 모든 응답 헤더는 JSON이라고 표시합니다. HTML 사례는 헤더와 실제 본문이 맞지 않는 상황입니다.
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    // 검토: 현재 작성 내용을 제출해 이번 모의 응답을 받습니다. 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: role="alert"에 오류 안내가 있는지 검사합니다.
    expect(
      // 검토: 첫 오류 안내에서 앞뒤 공백을 제거한 텍스트를 읽습니다.
      container.querySelector('[role="alert"]')?.textContent?.trim(),
    // 검토: 안내 문구가 비어 있지 않아야 합니다. 상태별 정확한 문구는 고정하지 않습니다.
    ).toBeTruthy();
    // 검토: 서버 내부용 private-internal-error 문자열을 페이지에 그대로 노출하지 않아야 합니다.
    expect(container.textContent).not.toContain('private-internal-error');
    // 검토: 제보가 접수됐어요라는 성공 안내가 나오면 안 됩니다.
    expect(container.textContent).not.toContain('제보가 접수됐어요');
    // 검토: 실패 뒤 다섯 필드를 모두 검사합니다.
    for (const name of fieldNames) {
      // 검토: 각 필드 값이 최초 제출 전에 저장한 값과 같아야 합니다.
      expect(field(name).value).toBe(originalValues[name]);
      // 검토: 각 필드가 비활성 상태가 아니어서 사용자가 수정할 수 있어야 합니다.
      expect(field(name).matches(':disabled')).toBe(false);
    }
    // 검토: 실패 뒤 제출 버튼도 다시 사용할 수 있는지 검사합니다.
    expect(
      // 검토: submit 버튼이 :disabled에 해당하는지 확인합니다.
      container.querySelector('button[type="submit"]')?.matches(':disabled'),
    // 검토: false여야 하므로 버튼이 다시 활성화되어야 합니다.
    ).toBe(false);
    // 검토: 실패 뒤에도 첨부 선택 표시가 유지되는지 검사합니다.
    expect(
      // 검토: road.png 삭제 버튼을 찾습니다.
      container.querySelector('button[aria-label="road.png 삭제"]'),
    // 검토: 이 삭제 버튼이 계속 남아 있어야 합니다.
    ).not.toBeNull();
  }
  // 검토: 열 가지 응답 조합마다 요청이 실행되어 전체 fetch 호출 수가 정확히 열 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(10);
});
```

## 10. reportSubmissionConfiguration

원본: `test-10.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionConfiguration: 비어 있거나 위험한 네 가지 기준 주소 예시에서 내용을 전송하지 않는지 검사합니다.
test('reportSubmissionConfiguration: missing or unsafe public endpoint does not send the report', async () => {
  // 검토: 아래 네 주소 후보를 차례대로 적용합니다.
  for (const endpoint of [
    // 검토: 주소가 아예 없는 빈 문자열을 검사합니다.
    '',
    // 검토: HTTP API 주소가 아닌 javascript 스킴 문자열을 검사합니다. 실제 스크립트를 실행하지 않습니다.
    'javascript:alert(1)',
    // 검토: 사용자명·비밀번호가 URL에 들어 있는 HTTPS 주소를 검사합니다. 실제 자격 증명이 아닌 테스트 예시입니다.
    'https://user:secret@example.test',
    // 검토: 루프백이 아닌 원격 호스트의 암호화되지 않은 HTTP 주소도 거부 대상으로 검사합니다.
    'http://reports.example.test',
  // 검토: 각 주소에 동일한 접수 차단 시나리오를 적용합니다.
  ]) {
    // 검토: 공개 접수 API 기준 주소를 이번 값으로 임시 바꿉니다.
    vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', endpoint);
    // 검토: 새 컴포넌트 마운트와 React 갱신이 끝날 때까지 기다립니다.
    await act(async () =>
      // 검토: 주소마다 서로 다른 key로 ReportPage를 렌더링해 이전 반복의 컴포넌트 상태가 이어지지 않게 합니다.
      root.render(createElement(ReportPage, { key: endpoint })),
    );
    // 검토: 유효한 필수값을 채워 입력 오류로 차단되는 경우와 구별합니다.
    await fillValid();
    // 검토: 제출을 시도하고 기본 제출 차단도 검사합니다.
    await checkInput();
    // 검토: 페이지 텍스트에서 접수 연결 오류 안내를 검사합니다.
    expect(container.textContent).toContain(
      // 검토: 제보 접수 연결이 준비되지 않았어요라는 문구가 포함되어야 합니다.
      '제보 접수 연결이 준비되지 않았어요',
    );
    // 검토: 잘못된 주소에서는 접수 성공을 표시하면 안 됩니다.
    expect(container.textContent).not.toContain('제보가 접수됐어요');
    // 검토: 네 주소 검사 모두에서 전역 fetch가 한 번도 호출되지 않아야 합니다.
    expect(fetchMock).not.toHaveBeenCalled();
  }
});
```

## 11. reportSubmissionEditedRetry

원본: `test-11.txt` · 대상: `src/app/report/report-form.test.ts` · 위 공통 헤더와 도우미를 사용합니다.

```ts
// 검토: reportSubmissionEditedRetry: 불확실한 요청 뒤 제목을 바꾸거나 첨부만 추가하면 각각 새로운 요청 키를 사용하는지 검사합니다.
test('reportSubmissionEditedRetry: changed content uses a new request key after an uncertain attempt', async () => {
  // 검토: 첫 fetch가 TypeError로 실패하도록 설정합니다.
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  // 검토: 제목 수정 후 두 번째 fetch도 TypeError로 실패하도록 설정합니다. 세 번째 요청은 공통 기본 성공 응답을 사용합니다.
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  // 검토: 제보 페이지를 렌더링합니다.
  await renderReport();
  // 검토: 유효한 필수값 예시를 채웁니다.
  await fillValid();
  // 검토: 첫 제출을 실행해 모의 통신 실패를 받습니다. 기본 제출 차단도 검사합니다.
  await checkInput();
  // 검토: 요청 기록을 읽기 전에 첫 fetch 호출이 정확히 한 번인지 확인합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 첫 요청의 헤더에서 기존 요청 키를 읽습니다.
  const previousKey = new Headers(fetchMock.mock.calls[0][1]?.headers).get(
    // 검토: 조회할 헤더는 Idempotency-Key입니다.
    'Idempotency-Key',
  );
  // 검토: 기존 요청 키가 존재하고 비어 있지 않아야 합니다.
  expect(previousKey).toBeTruthy();
  // 검토: 불확실한 첫 시도 뒤 제목을 수정한 제보 제목으로 바꿉니다.
  await changeField('title', '수정한 제보 제목');
  // 검토: 변경한 내용으로 다시 제출합니다.
  await checkInput();
  // 검토: fetch 호출 수가 정확히 두 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 두 번째 호출의 요청 옵션을 꺼냅니다.
  const nextRequest = fetchMock.mock.calls[1][1];
  // 검토: 두 번째 요청의 Idempotency-Key를 읽습니다.
  const nextKey = new Headers(nextRequest?.headers).get('Idempotency-Key');
  // 검토: 두 번째 요청 키도 존재하고 비어 있지 않아야 합니다.
  expect(nextKey).toBeTruthy();
  // 검토: 제목이 바뀌었으므로 두 번째 키는 첫 키와 달라야 합니다.
  expect(nextKey).not.toBe(previousKey);
  // 검토: 두 번째 요청 본문이 FormData인지 확인합니다.
  assert(nextRequest?.body instanceof FormData);
  // 검토: FormData.title에 수정한 제목이 들어가야 합니다.
  expect(nextRequest.body.get('title')).toBe('수정한 제보 제목');
  // 검토: 두 번째 요청도 통신 실패했으므로 접수 성공 문구를 보여서는 안 됩니다.
  expect(container.textContent).not.toContain('제보가 접수됐어요');
  // 검토: 텍스트를 다시 바꾸지 않고 added.png 첨부만 추가합니다.
  await selectFiles([testFile('added.png', 'image/png')]);
  // 검토: 첨부가 달라진 내용으로 세 번째 제출을 합니다.
  await checkInput();
  // 검토: fetch 호출 수가 정확히 세 번이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(3);
  // 검토: 세 번째 호출의 요청 옵션을 꺼냅니다.
  const attachmentRequest = fetchMock.mock.calls[2][1];
  // 검토: 첨부 변경 후 요청의 중복 방지 키를 읽습니다.
  const attachmentKey = new Headers(attachmentRequest?.headers).get(
    // 검토: 조회할 헤더는 Idempotency-Key입니다.
    'Idempotency-Key',
  );
  // 검토: 세 번째 요청 키도 존재하고 비어 있지 않아야 합니다.
  expect(attachmentKey).toBeTruthy();
  // 검토: 첨부만 바뀌어도 바로 전 요청 키와 달라야 합니다. 이 줄은 첫 번째 키와의 비교까지 하지는 않습니다.
  expect(attachmentKey).not.toBe(nextKey);
  // 검토: 세 번째 요청 본문이 FormData인지 확인합니다.
  assert(attachmentRequest?.body instanceof FormData);
  // 검토: 첨부만 바꾸었으므로 제목은 수정한 제보 제목 그대로 전송되어야 합니다.
  expect(attachmentRequest.body.get('title')).toBe('수정한 제보 제목');
  // 검토: attachments 필드가 한 개 있어야 합니다. 이 줄은 해당 첨부의 이름이나 바이트를 비교하지 않습니다.
  expect(attachmentRequest.body.getAll('attachments')).toHaveLength(1);
  // 검토: 세 번째 요청의 정상 응답 뒤 status에 접수 ID를 표시하는지 검사합니다.
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    // 검토: 공통 mock 응답의 receipt.report_id를 기대합니다. 실제 서버의 서로 다른 접수 기록을 비교하는 것은 아닙니다.
    receipt.report_id,
  );
});
```

## 원본 대조 결과

새로 넣은 `// 검토:` 설명 줄만 제거하면 열두 블록 모두 원본과 바이트 단위로 일치합니다. 기존 주석·들여쓰기·빈 줄·순서·마지막 줄바꿈을 보존했습니다. `test-4.txt`와 `test-5.txt`는 이전 검토 원본과도 바이트 단위로 일치합니다. 이는 복사 정확성의 증거이며 테스트 실행 성공이나 사람의 승인을 뜻하지 않습니다.

- `header.txt`: SHA-256 `73a1f5699c7d6bbc5128f5e1aec8f13582a5852e574388958eef61791b209304`
- `test-1.txt`: SHA-256 `b9e12748ef6202cd316c581359cda44b293d2a0ab8649fbf79c61734b31ae7a2`
- `test-2.txt`: SHA-256 `2e639a4d6a8166edd184d5098bd7ec7933e11bf29036e07b64e2befef1ac60cf`
- `test-3.txt`: SHA-256 `c26e16be1d58c6da0bb4d538d7e9cfdcaad1c756a51da7cc46a547322a15ff20`
- `test-4.txt`: SHA-256 `4995888cff4a587eda35c6beb70b29094bc892ba2a39e1e497d48c76cdd1d52f`
- `test-5.txt`: SHA-256 `b1ae78cbcdce8cf3f756e4297b1069f97fc9169ad52c1eae87ceb8e4f9385951`
- `test-6.txt`: SHA-256 `4b1cfc8d435c60dc088627eb7d9140f7166860ff4cb618ccabe5ba3bee936e8f`
- `test-7.txt`: SHA-256 `f8aaaa74c1efbbec483690b177305dbb002634ac198a923dc3c4696350aa705e`
- `test-8.txt`: SHA-256 `948752a93b2fcdfe1b2874603aab56e8593af4ba220d47437d98922a42701034`
- `test-9.txt`: SHA-256 `b6fa3c890ff357b1fa1f0e9141d63749b6e1d657545202aaf11984040b108b7d`
- `test-10.txt`: SHA-256 `3763dd3762b8d6051ea2176c76cdb2ff158d50c36cecc0a897f075b548dfba1a`
- `test-11.txt`: SHA-256 `0d44cb8a53dac14abf8a63d2c1d6f753caa086751ce5b0811ef117231c4d5be7`
