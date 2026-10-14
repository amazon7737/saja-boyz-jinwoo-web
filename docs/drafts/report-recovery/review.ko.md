# 제보 요청 시간 제한·오류 복구 테스트 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

대상 파일: src/app/report/report-recovery.test.ts

동결된 공통 헤더 1개와 테스트 본문 6개를 그대로 싣고, 각 의미 있는 줄 바로 위에 한국어 설명만 추가했습니다. 설명은 실행 입력이 아닙니다. 60,000ms 기한, 오류 닫기 문구, 폼 DOM 유지 등은 이 초안에서 검토할 구체적인 기대값입니다.

## 모형과 검증 범위

- 시간은 setTimeout·clearTimeout만 가짜로 바꿔 필요한 만큼 진행합니다. 실제로 60초를 기다리거나 업로드 속도를 측정하지 않습니다. Date와 모든 비동기 작업을 대체하지는 않습니다.
- DOM은 jsdom입니다. 입력·제출·파일 선택은 합성 이벤트로 전달합니다. 실제 파일 선택창, 브라우저 네이티브 폼 제약 검증, CSS 가시성, 실제 클릭에 따른 모든 브라우저 동작을 검사하지 않습니다.
- 파일 입력의 files에는 배열과 item()으로 구성한 FileList 모형을 넣습니다. PNG 이름·MIME을 가진 File의 내용은 fixture, first, second 문자열입니다. 이미지 디코딩·파일 내용 형식·대용량 업로드 성능은 검사하지 않습니다.
- Suspensive의 실제 모듈·ErrorBoundary·실제 훅을 사용합니다. export된 useErrorBoundary를 안정된 관찰 객체로 감싸 setError를 기록한 뒤 실제 함수에 전달합니다. 함수 호출 횟수와 DOM 오류 표시·reset 결과는 구분하여 검사합니다.
- fetch는 전역 mock으로 실제 네트워크가 없습니다. CORS, TLS, 서버 저장, 서버의 Idempotency-Key 처리, 서버에서의 취소는 검증하지 않습니다. 지연 응답의 json()을 별도 Promise로 바꾸므로 실제 응답 스트림 파싱도 수행하지 않습니다.
- 헤더와 JSON 읽기는 같은 AbortSignal에 협조하며 중단 시 AbortError로 실패합니다. 중단 뒤 원본 지연값을 resolve해도 이미 거절된 Promise가 성공으로 바뀌지 않습니다. 항목 6은 이 native Fetch 중단 모형의 재시도·unmount 정리를 검증하며, 중단을 무시하는 전송 계층까지 검증하지 않습니다.
- console.error는 예상된 오류 경계 로그를 줄이기 위해 숨깁니다. 타이머 정리 검사가 있는 항목은 afterEach 이전에 검사합니다. 이후 afterEach가 DOM·mock·환경변수·남은 가짜 타이머를 정리합니다.
- 이 문서 작성에서는 설명과 원문 일치만 검증했습니다. 제품 코드·실행 초안을 수정하거나 제품 테스트를 실행하지 않았습니다.

## 공통 헤더

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: header.txt

아래 모든 항목이 사용하는 헤더입니다. 파일 지시문·import·mock·공통 도구도 검토 대상입니다.

```ts
// 검토: 공통 헤더와 아래 여섯 테스트가 최종적으로 들어갈 파일 경로를 지정합니다.
// file: src/app/report/report-recovery.test.ts
// 검토: 이 파일만 jsdom에서 실행하여 DOM과 폼 이벤트를 다룹니다. 실제 브라우저 네트워크는 사용하지 않습니다.
// @vitest-environment jsdom
// 검토: 테스트 전후 정리, 조건 검증, 테스트 선언, mock과 가짜 타이머에 필요한 Vitest 도구를 가져옵니다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: React 갱신을 끝까지 반영하는 act와 JSX 없이 컴포넌트를 만드는 createElement를 가져옵니다.
import { act, createElement } from 'react';
// 검토: 테스트 DOM에 React 루트를 만들고 나중에 unmount하기 위한 도구와 타입을 가져옵니다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 가짜 페이지 대신 현재 제품의 제보 페이지를 직접 렌더합니다.
import ReportPage from './page';

// 검토: 모듈 mock보다 먼저 관찰 함수를 준비하여 setError에 전달되는 오류와 횟수를 기록합니다.
const { boundaryErrors } = vi.hoisted(() => ({ boundaryErrors: vi.fn() }));

// 검토: Suspensive 전체를 가짜 경계로 바꾸지 않고 오류 전달을 관찰할 부분만 교체합니다.
vi.mock('@suspensive/react', async (importOriginal) => {
  // 검토: 설치된 실제 Suspensive를 읽어 ErrorBoundary 등 실제 구현을 보존합니다.
  const actual = await importOriginal<typeof import('@suspensive/react')>();
  // 검토: 관찰용 반환 객체의 참조를 유지하기 위해 mock 팩토리 안에서 useMemo를 가져옵니다.
  const { useMemo } = await import('react');
  // 검토: 실제 모듈에 관찰용 훅만 덧씌운 모듈을 반환합니다.
  return {
    // 검토: ErrorBoundary와 나머지 export는 실제 구현을 유지합니다.
    ...actual,
    // 검토: 제품의 useErrorBoundary 호출이 아래 관찰용 훅을 거치게 합니다.
    useErrorBoundary: function useObservedErrorBoundary() {
      // 검토: 실제 훅을 실행합니다. 경계 문맥 검사와 오류 상태에서의 렌더 예외도 실제로 동작합니다.
      const boundary = actual.useErrorBoundary();
      // 검토: 매 렌더마다 새 setError 함수가 생겨 제품 effect에 영향을 주지 않도록 객체를 기억합니다.
      return useMemo(
        // 검토: 실제 훅 반환값에 관찰 기능을 덧붙인 객체를 만듭니다.
        () => ({
          // 검토: 실제 훅의 기존 반환값을 보존합니다.
          ...boundary,
          // 검토: 전달된 Error를 기록한 뒤 실제 경계로 보내는 함수를 제공합니다.
          setError(error: Error) {
            // 검토: 오류 전달을 기록합니다. 이 횟수만으로 화면에 오류가 보인다고 증명하지는 않습니다.
            boundaryErrors(error);
            // 검토: 실제 setError를 실행하여 다음 렌더에서 실제 오류 경계가 처리하도록 합니다.
            boundary.setError(error);
          },
        }),
        // 검토: 실제 훅의 반환 객체가 유지되는 동안 관찰 객체와 함수도 같은 참조를 유지합니다.
        [boundary],
      );
    },
  };
});

// 검토: 테스트마다 만드는 제보 화면의 DOM 컨테이너를 보관합니다.
let container: HTMLDivElement;
// 검토: 테스트마다 만드는 React 루트를 보관합니다.
let root: Root;
// 검토: 본문에서 이미 unmount했는지 기록하여 정리 단계의 중복 unmount를 막습니다.
let mounted: boolean;
// 검토: 실제 HTTP 대신 호출 인자와 예약된 응답을 다루는 fetch mock을 만듭니다.
const fetchMock = vi.fn<typeof fetch>();
// 검토: 보존 여부를 함께 확인할 다섯 제보 필드 이름을 정의합니다.
const fieldNames = [
  // 검토: 분류 선택값을 보존 검사에 포함합니다.
  'category',
  // 검토: 발생 일시를 보존 검사에 포함합니다.
  'occurredAt',
  // 검토: 제목을 보존 검사에 포함합니다.
  'title',
  // 검토: 장소를 보존 검사에 포함합니다.
  'location',
  // 검토: 제보 내용을 보존 검사에 포함합니다.
  'description',
];
// 검토: 접수 실패로 단정하지 않고 접수 여부를 확인할 수 없음을 알리는 문구를 검사 기준으로 둡니다.
const uncertainMessage = '접수 여부를 확인하지 못했어요';
// 검토: 성공으로 인정할 모의 접수 응답을 정의합니다. 실제 서버 저장 결과는 아닙니다.
const receipt = {
  // 검토: 접수 ID 형식에 맞는 소문자 16진수 32자를 사용합니다.
  report_id: 'b'.repeat(32),
  // 검토: 접수 후 검토 대기 상태인 pending을 사용합니다.
  status: 'pending',
  // 검토: 접수 시각은 고정된 UTC 문자열을 제공합니다.
  received_at: '2026-10-13T05:00:00Z',
};

// 검토: 별도 실패나 지연을 예약하지 않은 요청의 정상 응답을 만듭니다.
function receiptResponse() {
  // 검토: 접수 객체를 JSON으로 담은 HTTP 201 응답을 매번 새로 만듭니다.
  return new Response(JSON.stringify(receipt), { status: 201 });
}

// 검토: 원하는 시점까지 성공·실패를 미룰 수 있는 Promise 도구를 정의합니다.
function deferred<T>() {
  // 검토: 외부에서 Promise를 성공시킬 함수를 보관합니다.
  let resolve!: (value: T) => void;
  // 검토: 외부에서 오류로 Promise를 실패시킬 함수를 보관합니다.
  let reject!: (error: Error) => void;
  // 검토: 즉시 완료하지 않는 Promise를 만들고 완료 함수를 꺼냅니다.
  const promise = new Promise<T>((yes, no) => {
    // 검토: 테스트에서 성공 시점을 제어하도록 resolve를 저장합니다.
    resolve = yes;
    // 검토: 테스트에서 실패 시점을 제어하도록 reject를 저장합니다.
    reject = no;
  });
  // 검토: 대기 Promise와 성공·실패 제어 함수를 함께 반환합니다.
  return { promise, resolve, reject };
}

// 검토: 대기 Promise가 AbortSignal을 따르게 감쌉니다. native Fetch처럼 중단에 협조하는 모형입니다.
function abortable<T>(pending: Promise<T>, signal?: AbortSignal | null) {
  // 검토: 제품이 signal을 주지 않으면 중단을 흉내 내지 않고 원래 Promise를 반환합니다. signal 관련 검사는 별도로 실패합니다.
  if (!signal) return pending;
  // 검토: 원래 작업 완료와 abort 중 먼저 발생한 결과로 완료할 Promise를 만듭니다.
  return new Promise<T>((resolve, reject) => {
    // 검토: abort를 받으면 AbortError라는 DOMException으로 실패시킵니다.
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    // 검토: 연결 시점에 signal이 이미 중단됐는지 확인합니다.
    if (signal.aborted) {
      // 검토: 이미 중단됐다면 즉시 중단 오류를 전달합니다.
      onAbort();
      // 검토: 이미 중단된 경우에는 새 이벤트 리스너를 달지 않고 끝냅니다.
      return;
    }
    // 검토: 이후의 abort 이벤트를 한 번 받아 중단 오류를 전달합니다.
    signal.addEventListener('abort', onAbort, { once: true });
    // 검토: 원래 Promise의 성공과 실패도 감싼 Promise에 연결합니다.
    pending.then(
      // 검토: 원래 작업이 성공했을 때의 처리를 정의합니다.
      (value) => {
        // 검토: 성공 후에는 불필요한 abort 리스너를 제거합니다.
        signal.removeEventListener('abort', onAbort);
        // 검토: 원래 성공값을 전달합니다. 이미 abort로 완료됐다면 Promise 상태는 바뀌지 않습니다.
        resolve(value);
      },
      // 검토: 원래 작업이 실패했을 때의 처리를 정의합니다.
      (error: Error) => {
        // 검토: 실패 뒤에도 abort 리스너를 제거합니다.
        signal.removeEventListener('abort', onAbort);
        // 검토: 원래 오류를 전달합니다. 이미 완료된 Promise를 다시 완료시키지는 않습니다.
        reject(error);
      },
    );
  });
}

// 검토: 헤더 도착과 JSON 본문 완료를 각각 지연시킬 요청 한 건을 예약합니다.
function delayedRequest() {
  // 검토: fetch가 Response를 반환하는 시점을 제어할 Promise를 만듭니다.
  const headers = deferred<Response>();
  // 검토: response.json()이 본문 값을 반환하는 시점을 별도로 제어합니다.
  const body = deferred<unknown>();
  // 검토: 제품이 fetch에 넘긴 signal을 나중에 검사할 수 있도록 보관합니다.
  let signal: AbortSignal | null | undefined;
  // 검토: HTTP 201 응답 껍데기를 만듭니다. 본문 읽기는 아래 json mock에서 제어합니다.
  const response = new Response(null, { status: 201 });
  // 검토: 본문 읽기 호출 횟수와 지연을 제어할 spy를 준비합니다.
  const readBody = vi
    // 검토: 이 응답의 json 메서드만 관찰·교체합니다.
    .spyOn(response, 'json')
    // 검토: JSON 완료를 body Promise로 지연시키고 같은 signal을 따르게 합니다. 실제 스트림 파싱은 아닙니다.
    .mockImplementation(() => abortable(body.promise, signal));
  // 검토: 다음 fetch 한 번에만 이 지연 응답을 적용합니다.
  fetchMock.mockImplementationOnce((_input, init) => {
    // 검토: 제품의 fetch 초기화 인자에서 signal을 저장합니다.
    signal = init?.signal;
    // 검토: 헤더 대기 단계에도 같은 signal의 중단을 연결합니다.
    return abortable(headers.promise, signal);
  });
  // 검토: 테스트가 요청의 각 단계와 signal을 다룰 도구를 반환합니다.
  return {
    // 검토: 헤더 단계의 성공·실패 제어 함수를 노출합니다.
    headers,
    // 검토: JSON 본문 완료 제어 함수를 노출합니다.
    body,
    // 검토: 헤더 단계에서 반환할 Response를 노출합니다.
    response,
    // 검토: json이 실제 호출됐는지 확인할 spy를 노출합니다.
    readBody,
    // 검토: 요청 시작 뒤 설정되는 최신 signal을 읽는 접근자를 제공합니다.
    get signal() {
      // 검토: 제품이 넘긴 signal을 그대로 반환합니다.
      return signal;
    },
  };
}

// 검토: 각 테스트가 독립된 환경과 새 화면에서 시작하도록 준비합니다.
beforeEach(() => {
  // 검토: setTimeout·clearTimeout만 가짜로 바꿉니다. Date나 모든 비동기 작업을 교체하지는 않습니다.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  // 검토: HTTPS 모의 API 주소를 고정합니다. fetch가 교체돼 있어 실제 연결은 하지 않습니다.
  vi.stubEnv('NEXT_PUBLIC_REPORT_API_BASE_URL', 'https://reports.example.test');
  // 검토: React에 act 기반 테스트 환경임을 알립니다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: 전역 fetch를 호출 기록이 가능한 mock으로 바꿉니다.
  vi.stubGlobal('fetch', fetchMock);
  // 검토: 별도 일회성 동작이 없으면 새 HTTP 201 정상 응답을 반환합니다.
  fetchMock.mockImplementation(async () => receiptResponse());
  // 검토: 이전 테스트의 오류 전달 기록을 지웁니다.
  boundaryErrors.mockClear();
  // 검토: 예상된 오류 경계의 console.error 출력을 숨깁니다. 로그 내용은 검증하지 않습니다.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  // 검토: 테스트 전용 DOM 컨테이너를 새로 만듭니다.
  container = document.createElement('div');
  // 검토: DOM 조회와 이벤트 전파를 위해 컨테이너를 문서에 붙입니다.
  document.body.append(container);
  // 검토: 컨테이너에 React 루트를 만듭니다.
  root = createRoot(container);
  // 검토: 정리 단계에서 이 루트를 unmount해야 한다고 기록합니다.
  mounted = true;
});

// 검토: 각 테스트 뒤 DOM·mock·타이머 설정을 정리합니다.
afterEach(async () => {
  // 검토: 본문에서 먼저 unmount하지 않았다면 act 안에서 unmount하여 effect 정리를 반영합니다.
  if (mounted) await act(async () => root.unmount());
  // 검토: 컨테이너를 문서에서 제거합니다.
  container.remove();
  // 검토: fetch 호출 기록과 일회성 예약 동작을 초기화합니다.
  fetchMock.mockReset();
  // 검토: console.error와 Response.json 등에 설치한 spy를 원래 구현으로 복원합니다.
  vi.restoreAllMocks();
  // 검토: fetch와 act 환경 표시 등 교체한 전역값을 복원합니다.
  vi.unstubAllGlobals();
  // 검토: 모의 API 주소 등 교체한 환경변수를 복원합니다.
  vi.unstubAllEnvs();
  // 검토: 남은 가짜 타이머를 제거해 다음 테스트에 영향을 주지 않게 합니다. 본문의 누수 검사는 이 정리 전에 수행됩니다.
  vi.clearAllTimers();
  // 검토: 실제 타이머 사용으로 복원합니다.
  vi.useRealTimers();
});

// 검토: 공통 렌더 도구를 정의합니다. 테스트 전용 외부 오류 경계를 추가하지 않습니다.
async function renderReport() {
  // 검토: 제품 제보 페이지를 렌더하고 React 갱신을 반영합니다.
  await act(async () => root.render(createElement(ReportPage)));
}

// 검토: 현재 폼에서 지정한 필드를 다시 찾는 도구를 정의합니다.
function field(name: string) {
  // 검토: name으로 현재 요소를 조회합니다. 과거 DOM 참조를 재사용하지 않습니다.
  const element = container.querySelector(`form [name="${name}"]`);
  // 검토: 찾은 요소가 지원되는 입력 요소인지 검사합니다.
  assert(
    // 검토: 일반 input이면 값과 disabled 상태를 읽을 수 있다고 인정합니다.
    element instanceof HTMLInputElement ||
      // 검토: 분류용 select도 지원합니다.
      element instanceof HTMLSelectElement ||
      // 검토: 내용용 textarea도 지원합니다.
      element instanceof HTMLTextAreaElement,
    // 검토: 누락되거나 잘못된 요소라면 어떤 필드인지 진단합니다.
    `missing field: ${name}`,
  );
  // 검토: 검증된 현재 DOM 요소를 반환합니다.
  return element;
}

// 검토: React가 값 변경을 인식하도록 지정한 필드를 바꿉니다.
async function changeField(name: string, value: string) {
  // 검토: 변경할 현재 입력 요소를 찾습니다.
  const element = field(name);
  // 검토: 그 입력 요소의 DOM 프로토타입을 가져옵니다.
  const prototype = Object.getPrototypeOf(element);
  // 검토: 프로토타입의 value setter를 찾아 React 입력 추적과 함께 동작하게 합니다.
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  // 검토: 값을 설정할 setter가 존재해야 합니다.
  assert(setter);
  // 검토: 변경과 이벤트로 생기는 React 갱신을 함께 반영합니다.
  await act(async () => {
    // 검토: 요소에 새 값을 설정합니다.
    setter.call(element, value);
    // 검토: 부모로 전파되는 합성 input 이벤트를 보냅니다.
    element.dispatchEvent(new Event('input', { bubbles: true }));
    // 검토: 합성 change 이벤트도 보냅니다. 실제 키보드 조작은 아닙니다.
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

// 검토: 필수 입력 검증을 통과할 제보 예시를 채웁니다.
async function fillValid() {
  // 검토: 분류를 society로 선택합니다.
  await changeField('category', 'society');
  // 검토: 발생 일시 입력값을 2026년 10월 12일 09시 30분으로 정합니다.
  await changeField('occurredAt', '2026-10-12T09:30');
  // 검토: 제목에 도로 점검 제보를 입력합니다.
  await changeField('title', '도로 점검 제보');
  // 검토: 장소에 부산 남구 용호동을 입력합니다.
  await changeField('location', '부산 남구 용호동');
  // 검토: 내용에 보행로 통제 상황을 입력합니다.
  await changeField('description', '보행로 일부가 통제되어 확인이 필요합니다.');
}

// 검토: 파일 선택창을 열지 않고 파일 입력의 선택 결과를 모사합니다.
async function selectFile(file: File) {
  // 검토: 파일 입력 요소를 찾습니다.
  const input = container.querySelector('input[type="file"]');
  // 검토: 파일 입력 요소가 반드시 있어야 합니다.
  assert(input instanceof HTMLInputElement);
  // 검토: files 속성을 테스트에서 덮어써 선택 파일을 제공합니다.
  Object.defineProperty(input, 'files', {
    // 검토: 다음 선택 때도 files 속성을 다시 덮어쓸 수 있게 합니다.
    configurable: true,
    // 검토: File 한 개를 담은 배열을 FileList처럼 제공합니다. 실제 브라우저 FileList는 아닙니다.
    value: Object.assign([file], {
      // 검토: item 동작을 흉내 내어 유효 인덱스에서는 파일, 그 밖은 null을 반환합니다.
      item: (index: number) => [file][index] ?? null,
    }),
  });
  // 검토: 파일 선택으로 인한 React 갱신을 act 안에서 반영합니다.
  await act(async () =>
    // 검토: 합성 change 이벤트를 보내 제품의 첨부 처리 함수를 실행합니다.
    input.dispatchEvent(new Event('change', { bubbles: true })),
  );
}

// 검토: 폼 제출 이벤트를 합성하는 도구를 정의합니다.
async function submit() {
  // 검토: 현재 폼을 찾습니다.
  const form = container.querySelector('form');
  // 검토: 제출할 폼이 반드시 있어야 합니다.
  assert(form);
  // 검토: 버블링과 preventDefault가 가능한 submit 이벤트를 만듭니다. 실제 버튼 클릭이나 브라우저 제약 검증은 거치지 않습니다.
  const event = new Event('submit', { bubbles: true, cancelable: true });
  // 검토: submit을 보내고 React 갱신을 반영합니다. 대기 fetch 완료까지 기다리는 도구는 아닙니다.
  await act(async () => form.dispatchEvent(event));
  // 검토: 기본 폼 전송을 막아 페이지 탐색 대신 자체 제출 처리를 해야 합니다.
  expect(event.defaultPrevented).toBe(true);
}

// 검토: 가짜 타이머를 지정한 밀리초만큼 진행하는 도구를 정의합니다.
async function advance(milliseconds: number) {
  // 검토: 타이머와 이어지는 비동기 콜백을 진행하고 React 갱신도 반영합니다.
  await act(async () => vi.advanceTimersByTimeAsync(milliseconds));
}

// 검토: 현재 제출 버튼을 찾는 도구를 정의합니다.
function submitButton() {
  // 검토: type이 submit인 버튼을 조회합니다.
  const button = container.querySelector('button[type="submit"]');
  // 검토: 검사할 제출 버튼이 반드시 있어야 합니다.
  assert(button instanceof HTMLButtonElement);
  // 검토: 찾은 버튼을 반환하여 disabled 상태를 검사합니다.
  return button;
}

// 검토: 오류 경계 reset에 연결할 오류 닫기 버튼을 찾습니다.
function closeErrorButton() {
  // 검토: 화면의 버튼 중 조건에 맞는 버튼을 검색합니다.
  const button = Array.from(container.querySelectorAll('button')).find(
    // 검토: 앞뒤 공백을 제외한 문구가 정확히 오류 닫기인 버튼을 선택합니다.
    (element) => element.textContent?.trim() === '오류 닫기',
  );
  // 검토: 조건에 맞는 버튼이 있는지 검증합니다.
  assert(
    // 검토: 선택 결과는 HTML 버튼이어야 합니다.
    button instanceof HTMLButtonElement,
    // 검토: 없으면 reset 버튼이 없다는 진단을 냅니다. CSS나 화면 가림 여부까지 확인하지는 않습니다.
    'local error reset must be visible',
  );
  // 검토: 찾은 오류 닫기 버튼을 반환합니다.
  return button;
}

// 검토: 실패 후 입력·첨부가 유지되고 편집·재제출이 가능한지 함께 검사합니다.
function expectDraft(values: string[], file: File) {
  // 검토: 현재 DOM의 다섯 입력값이 실패 전 값과 모두 같아야 합니다.
  expect(fieldNames.map((name) => field(name).value)).toEqual(values);
  // 검토: 보존할 첨부의 삭제 버튼을 찾습니다.
  const removeButton = container.querySelector(
    // 검토: 해당 파일명의 aria-label을 가진 삭제 버튼을 선택합니다.
    `button[aria-label="${file.name} 삭제"]`,
  );
  // 검토: 삭제 버튼이 실제 HTML 버튼으로 남아 있어야 합니다.
  assert(removeButton instanceof HTMLButtonElement);
  // 검토: 첨부 삭제 버튼의 잠금이 풀려 파일을 제거할 수 있어야 합니다.
  expect(removeButton.disabled).toBe(false);
  // 검토: 새 첨부를 선택할 파일 입력도 현재 DOM에서 찾습니다.
  const fileInput = container.querySelector('input[type="file"]');
  // 검토: 파일 입력이 실제 HTMLInputElement로 존재해야 합니다.
  assert(fileInput instanceof HTMLInputElement);
  // 검토: 파일 입력 잠금이 풀려 첨부를 추가할 수 있어야 합니다.
  expect(fileInput.disabled).toBe(false);
  // 검토: 다섯 제보 입력도 모두 disabled가 아니어야 합니다.
  for (const name of fieldNames) expect(field(name).disabled).toBe(false);
  // 검토: 제출 버튼도 다시 사용할 수 있어야 합니다.
  expect(submitButton().disabled).toBe(false);
}

// 검토: 지정한 요청의 Idempotency-Key를 검사하고 꺼냅니다. 인덱스는 0부터 시작합니다.
function requestKey(index: number) {
  // 검토: fetch 호출 기록에서 요청 초기화 인자를 읽습니다.
  const init = fetchMock.mock.calls[index]?.[1];
  // 검토: 해당 요청이 호출되어 인자가 존재해야 합니다.
  assert(init, `missing request: ${index}`);
  // 검토: 헤더에서 Idempotency-Key를 읽습니다.
  const key = new Headers(init.headers).get('Idempotency-Key');
  // 검토: 요청 키가 다음 UUID 형식에 맞아야 합니다.
  expect(key).toMatch(
    // 검토: 하이픈, 버전 4, variant 비트를 포함한 UUID 형식을 검사합니다. 서버의 실제 중복 방지를 검증하지는 않습니다.
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  // 검토: 키를 반환하여 요청 간 동일 여부를 비교합니다.
  return key;
}

// 검토: 지정한 요청에 제품이 넘긴 multipart 본문을 꺼냅니다.
function requestBody(index: number) {
  // 검토: fetch 호출 기록에서 body를 읽습니다.
  const body = fetchMock.mock.calls[index]?.[1]?.body;
  // 검토: 본문이 FormData 객체여야 합니다.
  assert(body instanceof FormData);
  // 검토: FormData를 반환하여 제출 필드와 첨부 객체를 확인합니다.
  return body;
}

// 검토: 독립 probe에서도 공통 도구를 유지한다는 원본 주석을 보존합니다.
// Shared helpers remain available to each independently probed plan entry.
// 검토: 일부 항목만 probe해도 공통 도구가 미사용으로 판정되지 않게 참조합니다. 도구를 실행하는 코드는 아닙니다.
void [
  // 검토: 렌더 도구의 참조를 유지합니다.
  renderReport,
  // 검토: 정상 입력 도구의 참조를 유지합니다.
  fillValid,
  // 검토: 파일 선택 모사 도구의 참조를 유지합니다.
  selectFile,
  // 검토: 제출 도구의 참조를 유지합니다.
  submit,
  // 검토: 가짜 시간 진행 도구의 참조를 유지합니다.
  advance,
  // 검토: 제출 버튼 조회 도구의 참조를 유지합니다.
  submitButton,
  // 검토: 오류 닫기 조회 도구의 참조를 유지합니다.
  closeErrorButton,
  // 검토: 입력·첨부·잠금 검사 도구의 참조를 유지합니다.
  expectDraft,
  // 검토: 요청 키 검사 도구의 참조를 유지합니다.
  requestKey,
  // 검토: 요청 본문 검사 도구의 참조를 유지합니다.
  requestBody,
  // 검토: 지연 요청 도구의 참조를 유지합니다.
  delayedRequest,
];
```

## 1. reportRequestDeadline

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-1.txt

공통 헤더를 사용합니다. 기한 직전과 만료 순간, 보존·잠금 해제·자동 재시도 부재를 검사합니다.

```ts
// 검토: reportRequestDeadline 항목입니다. 응답 대기 제출이 60,000ms에 중단되고 초안을 보존한 채 잠금이 풀리는지 검사합니다.
test('reportRequestDeadline: a pending upload aborts at 60000ms and unlocks the preserved form', async () => {
  // 검토: 헤더와 본문 모두 지시 전까지 도착하지 않는 요청을 예약합니다.
  const request = delayedRequest();
  // 검토: 실제 제보 페이지를 새 DOM에 렌더합니다.
  await renderReport();
  // 검토: 필수 제보 값을 정상 입력합니다.
  await fillValid();
  // 검토: 첨부 상태 확인용 File입니다. PNG 이름과 MIME을 가졌지만 fixture 문자열은 실제 이미지가 아닙니다.
  const file = new File(['fixture'], 'road.png', { type: 'image/png' });
  // 검토: 이 File을 선택한 것처럼 첨부 처리에 전달합니다.
  await selectFile(file);
  // 검토: 실패 후 비교할 다섯 입력값을 저장합니다.
  const values = fieldNames.map((name) => field(name).value);
  // 검토: 제출을 시작하고 응답은 계속 기다리게 둡니다.
  await submit();
  // 검토: 최초 요청부터 59,999ms까지 진행합니다.
  await advance(59999);
  // 검토: 이 시점까지 요청은 한 번뿐이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 기한 직전에는 제출 버튼이 아직 잠겨 있어야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: 기한 전에는 접수 불확실 안내를 표시하면 안 됩니다.
  expect(container.textContent).not.toContain(uncertainMessage);
  // 검토: 요청 signal이 존재하며 아직 중단되지 않았어야 합니다.
  expect(request.signal?.aborted).toBe(false);
  // 검토: 1ms를 더 진행해 정확히 60,000ms에 도달합니다.
  await advance(1);
  // 검토: 요청에 넘긴 signal이 중단 상태가 되어야 합니다.
  expect(request.signal?.aborted).toBe(true);
  // 검토: 오류 안내 영역의 실제 DOM 문구를 확인합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 접수 실패 확정 대신 접수 여부를 확인하지 못했다는 안내를 요구합니다.
    uncertainMessage,
  );
  // 검토: 오류가 실제 setError 경로로 한 번 전달되어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  // 검토: 입력값·첨부가 유지되고 입력·파일 추가·삭제·제출 잠금이 풀려야 합니다.
  expectDraft(values, file);
  // 검토: 정상 응답을 못 받았으므로 모의 접수 ID를 표시하면 안 됩니다.
  expect(container.textContent).not.toContain(receipt.report_id);
  // 검토: 타임아웃 처리 뒤 가짜 타이머가 남아 있지 않아야 합니다.
  expect(vi.getTimerCount()).toBe(0);
  // 검토: 120,000ms를 더 진행하여 자동 재시도 여부를 확인합니다.
  await advance(120000);
  // 검토: 추가 시간이 지나도 두 번째 요청이 자동 전송되면 안 됩니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

## 2. reportBodyDeadline

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-2.txt

공통 헤더를 사용합니다. 헤더 수신 이후에도 최초 제출 기준의 본문 기한을 적용하는지 검사합니다.

```ts
// 검토: reportBodyDeadline 항목입니다. 헤더가 늦게 와도 본문 대기 기한은 최초 제출부터 60,000ms여야 합니다.
test('reportBodyDeadline: headers at 45000ms do not restart the deadline for the response body', async () => {
  // 검토: 헤더 도착과 JSON 완료를 따로 제어할 요청을 예약합니다.
  const request = delayedRequest();
  // 검토: 실제 제보 페이지를 렌더합니다.
  await renderReport();
  // 검토: 필수값을 정상 입력합니다.
  await fillValid();
  // 검토: 첨부 없는 정상 제보의 제출을 시작합니다.
  await submit();
  // 검토: 45,000ms 동안 헤더도 도착하지 않게 둡니다.
  await advance(45000);
  // 검토: 45,000ms에 HTTP 201 응답을 반환하되 JSON 본문은 계속 지연시킵니다.
  await act(async () => request.headers.resolve(request.response));
  // 검토: 제품이 json을 한 번 호출하여 본문 읽기에 들어갔어야 합니다.
  expect(request.readBody).toHaveBeenCalledTimes(1);
  // 검토: 14,999ms를 더 진행하여 최초 요청부터 59,999ms가 됩니다.
  await advance(14999);
  // 검토: 기한 직전이므로 제출 버튼은 잠겨 있어야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: signal은 아직 중단되지 않았어야 합니다.
  expect(request.signal?.aborted).toBe(false);
  // 검토: 전체 기한 전에는 불확실 안내가 나오면 안 됩니다.
  expect(container.textContent).not.toContain(uncertainMessage);
  // 검토: 1ms를 더 진행해 최초 요청 기준 60,000ms가 됩니다.
  await advance(1);
  // 검토: 헤더 수신 때 기한을 다시 시작하지 않고 이 시점에 중단해야 합니다.
  expect(request.signal?.aborted).toBe(true);
  // 검토: 오류 영역의 문구를 확인합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 본문을 확인하지 못했으므로 접수 여부 불확실 안내를 요구합니다.
    uncertainMessage,
  );
  // 검토: 본문 대기 타임아웃도 실제 setError 경로에 한 번 전달되어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  // 검토: 제출 버튼의 잠금이 풀려야 합니다.
  expect(submitButton().disabled).toBe(false);
  // 검토: 본문 대기 타이머가 남지 않아야 합니다.
  expect(vi.getTimerCount()).toBe(0);
  // 검토: 중단 뒤 원본 body Promise를 늦게 완료합니다. 이미 abort로 거절된 읽기 Promise는 성공으로 바뀌지 않습니다.
  await act(async () => request.body.resolve(receipt));
  // 검토: 늦은 본문 값 때문에 접수 ID가 나타나면 안 됩니다.
  expect(container.textContent).not.toContain(receipt.report_id);
  // 검토: 새 요청이 자동 전송되어서도 안 됩니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

## 3. reportBoundaryReset

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-3.txt

공통 헤더를 사용합니다. 오류 닫기 전후 DOM·값·File 객체와 동일 내용의 요청 키를 검사합니다.

```ts
// 검토: reportBoundaryReset 항목입니다. 오류 닫기는 폼을 재생성하거나 초안을 지우지 않고 같은 내용의 재시도 키를 유지해야 합니다.
test('reportBoundaryReset: closing a local fallback preserves form DOM files and the unchanged retry key', async () => {
  // 검토: 첫 요청만 네트워크 실패로 거절되게 예약합니다.
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  // 검토: 실제 제보 페이지를 렌더합니다.
  await renderReport();
  // 검토: 필수값을 정상 입력합니다.
  await fillValid();
  // 검토: 유지할 File을 만듭니다. PNG 메타데이터를 가진 비이미지 시험 데이터입니다.
  const file = new File(['fixture'], 'kept.png', { type: 'image/png' });
  // 검토: 이 파일을 선택한 상태를 만듭니다.
  await selectFile(file);
  // 검토: 오류 전 폼 DOM 객체를 보관합니다.
  const form = container.querySelector('form');
  // 검토: 다섯 입력 DOM 객체도 보관하여 재생성 여부를 비교합니다.
  const nodes = fieldNames.map((name) => field(name));
  // 검토: 입력된 값들을 저장합니다.
  const values = nodes.map((element) => element.value);
  // 검토: 첫 제출로 예약된 네트워크 오류를 발생시킵니다.
  await submit();
  // 검토: 실제 setError 경로에 한 번 전달되어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  // 검토: 오류 영역 문구를 검사합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 접수 여부를 확인하지 못했다는 안내가 있어야 합니다.
    uncertainMessage,
  );
  // 검토: 실패한 첫 요청의 키를 검사하고 보관합니다.
  const key = requestKey(0);
  // 검토: 오류 닫기를 눌러 로컬 오류 경계 reset을 요청합니다.
  await act(async () => closeErrorButton().click());
  // 검토: 오류 안내 영역이 사라져야 합니다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 폼이 오류 전과 동일한 DOM 객체여야 합니다. 값을 복사해 만든 새 폼도 이 기대에는 맞지 않습니다.
  expect(container.querySelector('form')).toBe(form);
  // 검토: 다섯 입력 요소도 오류 전과 각각 동일한 DOM 객체여야 합니다.
  fieldNames.forEach((name, index) => expect(field(name)).toBe(nodes[index]));
  // 검토: 입력값·첨부를 보존하고 입력·파일 추가·삭제·제출 잠금을 풀어야 합니다.
  expectDraft(values, file);
  // 검토: 오류 닫기만으로 자동 재제출하면 안 됩니다.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // 검토: 사용자가 명시적으로 같은 내용을 재제출합니다.
  await submit();
  // 검토: 이때 두 번째 요청이 전송되어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 내용·첨부가 같으므로 첫 요청 키를 재사용해야 합니다.
  expect(requestKey(1)).toBe(key);
  // 검토: 두 번째 FormData에 처음 선택한 것과 동일한 File 객체가 들어 있어야 합니다.
  expect(requestBody(1).get('attachments')).toBe(file);
  // 검토: 정상 응답 뒤 접수 ID가 화면에 나타나야 합니다.
  expect(container.textContent).toContain(receipt.report_id);
  // 검토: 성공 뒤 오류 영역이 남으면 안 됩니다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 이미 접수된 제보의 중복 전송을 막도록 제출 버튼을 잠가야 합니다.
  expect(submitButton().disabled).toBe(true);
});
```

## 4. reportFallbackEdits

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-4.txt

공통 헤더를 사용합니다. 오류 표시 중 재시도, 반복 실패 전달, 제목·첨부 변경에 따른 키를 검사합니다.

```ts
// 검토: reportFallbackEdits 항목입니다. 오류 표시 중 재시도와 내용·첨부 변경이 각각 올바른 키를 사용하는지 검사합니다.
test('reportFallbackEdits: direct resubmission and field or attachment edits keep correct request identities', async () => {
  // 검토: 첫 요청은 즉시 네트워크 오류로 실패하도록 예약합니다.
  fetchMock.mockRejectedValueOnce(new TypeError('first outage'));
  // 검토: 두 번째 요청은 성공·실패 시점을 직접 제어할 지연 요청으로 예약합니다.
  const retry = delayedRequest();
  // 검토: 세 번째 요청은 즉시 실패하도록 예약합니다. 네 번째는 기본 정상 응답을 사용합니다.
  fetchMock.mockRejectedValueOnce(new TypeError('third outage'));
  // 검토: 실제 제보 페이지를 렌더합니다.
  await renderReport();
  // 검토: 필수 제보 값을 입력합니다.
  await fillValid();
  // 검토: 첫 첨부 File을 만듭니다. first 문자열이 내용이므로 실제 PNG가 아닙니다.
  const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
  // 검토: 나중에 추가할 두 번째 File을 만듭니다. second 문자열을 담은 상태 검사 자료입니다.
  const secondFile = new File(['second'], 'second.png', { type: 'image/png' });
  // 검토: 처음에는 첫 파일만 첨부합니다.
  await selectFile(firstFile);
  // 검토: 첫 요청을 제출하여 첫 네트워크 오류를 발생시킵니다.
  await submit();
  // 검토: 첫 오류가 실제 setError 경로에 한 번 전달되어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(1);
  // 검토: 첫 요청 키를 저장합니다.
  const firstKey = requestKey(0);
  // 검토: 오류 닫기 없이 내용을 그대로 재제출합니다.
  await submit();
  // 검토: 두 번째 요청이 실제 시작되어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 동일한 제보의 재시도이므로 첫 요청 키를 유지해야 합니다.
  expect(requestKey(1)).toBe(firstKey);
  // 검토: 두 번째 요청이 기다리는 동안 제출 버튼은 잠겨야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: 대기 중인 두 번째 요청을 네트워크 오류로 실패시킵니다.
  await act(async () => retry.headers.reject(new TypeError('second outage')));
  // 검토: 직접 재시도의 오류도 전달되어 setError 누적 호출이 두 번이어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(2);
  // 검토: 직접 재시도 실패 뒤 오류 영역 문구를 검사합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 이번 실패도 접수 여부 불확실 안내를 해야 합니다.
    uncertainMessage,
  );
  // 검토: 두 번째 실패 뒤 제출 잠금이 풀려야 합니다.
  expect(submitButton().disabled).toBe(false);
  // 검토: 이번에는 오류 닫기로 오류 표시를 reset합니다.
  await act(async () => closeErrorButton().click());
  // 검토: 제목을 수정하여 이전 요청과 다른 내용으로 만듭니다.
  await changeField('title', '수정한 도로 점검 제보');
  // 검토: 수정한 제보를 세 번째로 제출합니다.
  await submit();
  // 검토: 세 번째 요청이 실제 전송되어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(3);
  // 검토: 세 번째 오류까지 모두 setError 경로에 전달되어야 합니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(3);
  // 검토: 세 번째 실패 뒤 오류 문구를 확인합니다.
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    // 검토: 세 번째 실패도 접수 여부 불확실 안내를 해야 합니다.
    uncertainMessage,
  );
  // 검토: 실패 뒤 재시도할 수 있도록 제출 잠금이 풀려야 합니다.
  expect(submitButton().disabled).toBe(false);
  // 검토: 제목을 바꾼 세 번째 요청의 키를 읽습니다.
  const editedKey = requestKey(2);
  // 검토: 내용이 달라졌으므로 최초 키를 재사용하면 안 됩니다.
  expect(editedKey).not.toBe(firstKey);
  // 검토: 세 번째 multipart 본문에 수정한 제목이 들어 있어야 합니다.
  expect(requestBody(2).get('title')).toBe('수정한 도로 점검 제보');
  // 검토: 세 번째 오류를 닫지 않은 채 두 번째 첨부를 추가합니다.
  await selectFile(secondFile);
  // 검토: 수정한 제목과 두 파일을 네 번째로 제출합니다.
  await submit();
  // 검토: 네 번째 요청이 전송되어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(4);
  // 검토: 첨부가 달라졌으므로 세 번째 요청과 다른 키를 사용해야 합니다.
  expect(requestKey(3)).not.toBe(editedKey);
  // 검토: 수정한 제목이 네 번째 본문에도 유지되어야 합니다.
  expect(requestBody(3).get('title')).toBe('수정한 도로 점검 제보');
  // 검토: attachments 배열은 첫 파일과 추가 파일을 이 순서로 포함해야 합니다.
  expect(requestBody(3).getAll('attachments')).toEqual([firstFile, secondFile]);
  // 검토: 정상 응답 뒤 이전 오류가 남으면 안 됩니다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 정상 접수 ID가 화면에 나타나야 합니다.
  expect(container.textContent).toContain(receipt.report_id);
  // 검토: 접수 완료 뒤 제출 버튼이 잠겨야 합니다.
  expect(submitButton().disabled).toBe(true);
});
```

## 5. reportFailureCleanup

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-5.txt

공통 헤더를 사용합니다. 다섯 실패와 마지막 정상 응답을 같은 화면에서 처리하고 타이머 정리를 검사합니다.

```ts
// 검토: reportFailureCleanup 항목입니다. 여러 실패를 실제 오류 경계로 보내고 실패·성공 처리 뒤 기한 타이머를 정리하는지 검사합니다.
test('reportFailureCleanup: async failures enter the real local boundary and settled attempts leave no deadline', async () => {
  // 검토: HTTP 201이지만 본문 읽기는 실패할 응답을 준비합니다.
  const bodyFailure = new Response(null, { status: 201 });
  // 검토: 이 응답의 json 호출을 거절되게 바꿉니다.
  vi.spyOn(bodyFailure, 'json').mockRejectedValue(
    // 검토: 본문 읽기가 끊긴 상황을 TypeError로 나타냅니다.
    new TypeError('body interrupted'),
  );
  // 검토: 실패 응답과 사용자에게 보여줄 문구를 정의합니다.
  const cases = [
    // 검토: 본문 읽기 실패는 접수 여부를 알 수 없다고 안내해야 합니다.
    { response: bodyFailure, message: uncertainMessage },
    // 검토: HTTP 201이어도 JSON이 깨졌으면 성공으로 인정하지 않고 불확실 안내를 해야 합니다.
    { response: new Response('{', { status: 201 }), message: uncertainMessage },
    // 검토: 다음 사례는 JSON은 정상이지만 접수 ID 형식이 틀린 응답입니다.
    {
      // 검토: 잘못된 접수 정보를 담은 Response를 만듭니다.
      response: new Response(
        // 검토: 다른 값은 유지하고 report_id만 잘못된 invalid로 바꿉니다.
        JSON.stringify({ ...receipt, report_id: 'invalid' }),
        // 검토: HTTP 201이라는 사실만으로 성공하지 않는지 보려고 상태는 정상으로 둡니다.
        { status: 201 },
      ),
      // 검토: 유효한 접수 ID를 못 받았으므로 불확실 안내를 기대합니다.
      message: uncertainMessage,
    },
    // 검토: 다음 사례는 서버 측 장애입니다.
    {
      // 검토: HTTP 503과 빈 JSON 객체 응답을 만듭니다.
      response: new Response('{}', { status: 503 }),
      // 검토: 서버 장애도 접수 여부 불확실 안내를 기대합니다.
      message: uncertainMessage,
    },
    // 검토: 다음 사례는 요청 크기를 거절한 응답입니다.
    {
      // 검토: HTTP 413과 빈 JSON 객체 응답을 만듭니다.
      response: new Response('{}', { status: 413 }),
      // 검토: 이 거절에는 제보를 접수하지 못했다는 실패 안내를 기대합니다.
      message: '제보를 접수하지 못했어요',
    },
  ];
  // 검토: 사례마다 페이지를 새로 만들지 않고 한 화면에서 연속 복구를 시험합니다.
  await renderReport();
  // 검토: 필수 제보 값을 입력합니다.
  await fillValid();
  // 검토: 반복 실패 동안 유지할 File입니다. 실제 이미지 형식은 검증하지 않습니다.
  const file = new File(['fixture'], 'retained.png', { type: 'image/png' });
  // 검토: 공통 첨부를 선택합니다.
  await selectFile(file);
  // 검토: 매 실패 뒤 비교할 입력값을 저장합니다.
  const values = fieldNames.map((name) => field(name).value);
  // 검토: 다섯 실패 사례를 순서대로 같은 폼에서 반복합니다.
  for (const [index, failure] of cases.entries()) {
    // 검토: 다음 요청에 현재 사례의 응답을 한 번 반환하도록 예약합니다.
    fetchMock.mockResolvedValueOnce(failure.response);
    // 검토: 현재 폼을 제출하여 해당 실패를 발생시킵니다.
    await submit();
    // 검토: 매 실패가 setError로 한 번씩 전달되어 누적 횟수가 처리 사례 수와 같아야 합니다.
    expect(boundaryErrors).toHaveBeenCalledTimes(index + 1);
    // 검토: 오류 영역의 실제 문구를 검사합니다.
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      // 검토: 각 실패 종류에 대해 위에서 정한 안내가 들어 있어야 합니다.
      failure.message,
    );
    // 검토: 입력·첨부를 보존하고 입력·파일 추가·삭제·재제출 잠금을 풀어야 합니다.
    expectDraft(values, file);
    // 검토: 응답 처리 뒤 가짜 기한 타이머가 하나도 남지 않아야 합니다.
    expect(vi.getTimerCount()).toBe(0);
    // 검토: 오류 닫기로 현재 오류를 reset합니다.
    await act(async () => closeErrorButton().click());
    // 검토: 오래된 기한이 뒤늦게 작동하는지 확인하도록 60,001ms를 더 진행합니다.
    await advance(60001);
    // 검토: 닫은 오류가 오래된 타이머 때문에 다시 나타나면 안 됩니다.
    expect(container.querySelector('[role="alert"]')).toBeNull();
    // 검토: reset과 시간 경과가 추가 요청을 만들면 안 됩니다.
    expect(fetchMock).toHaveBeenCalledTimes(index + 1);
  }
  // 검토: 다섯 실패 뒤 한 번 더 제출합니다. 이번에는 기본 정상 응답을 받습니다.
  await submit();
  // 검토: 정상 접수 ID가 화면에 나타나야 합니다.
  expect(container.textContent).toContain(receipt.report_id);
  // 검토: 성공 시에도 기한 타이머가 남으면 안 됩니다.
  expect(vi.getTimerCount()).toBe(0);
  // 검토: 성공 뒤 60,001ms를 더 진행해 오래된 타이머 영향을 확인합니다.
  await advance(60001);
  // 검토: 성공 화면에 늦은 타임아웃 오류가 나타나면 안 됩니다.
  expect(container.querySelector('[role="alert"]')).toBeNull();
  // 검토: 접수 완료 상태의 제출 잠금이 유지되어야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: 전체 요청은 실패 다섯 번과 마지막 성공 한 번뿐이어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(cases.length + 1);
});
```

## 6. reportAttemptIsolation

대상 파일: src/app/report/report-recovery.test.ts
원본 블록: test-6.txt

공통 헤더를 사용합니다. native Fetch 중단 모형에서 이전 요청·새 요청·unmount 뒤 정리를 검사합니다.

```ts
// 검토: reportAttemptIsolation 항목입니다. native Fetch 중단 모형에서 이전 요청의 늦은 완료와 화면 unmount를 처리하는지 검사합니다.
test('reportAttemptIsolation: abandoned responses cannot finish a newer attempt and unmount aborts active work', async () => {
  // 검토: 먼저 기한이 만료될 첫 요청을 예약합니다.
  const oldRequest = delayedRequest();
  // 검토: 그 뒤 시작할 새 요청도 따로 지연시킵니다.
  const newRequest = delayedRequest();
  // 검토: 실제 제보 페이지를 렌더합니다.
  await renderReport();
  // 검토: 필수값을 정상 입력합니다.
  await fillValid();
  // 검토: 첫 지연 요청을 제출합니다.
  await submit();
  // 검토: 첫 요청부터 60,000ms를 진행해 기한을 만료시킵니다.
  await advance(60000);
  // 검토: 첫 요청의 signal이 중단되어야 합니다.
  expect(oldRequest.signal?.aborted).toBe(true);
  // 검토: 중단 뒤 다시 제출할 수 있도록 잠금이 풀려야 합니다.
  expect(submitButton().disabled).toBe(false);
  // 검토: 오류 닫기 없이 같은 제보를 다시 제출합니다.
  await submit();
  // 검토: 요청은 정확히 두 번 시작됐어야 합니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 검토: 내용이 같으므로 첫 요청의 키를 유지해야 합니다.
  expect(requestKey(1)).toBe(requestKey(0));
  // 검토: 새 요청이 진행 중이므로 제출 버튼은 잠겨야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: 중단된 첫 요청의 원본 지연값을 늦게 완료하고 React 갱신을 반영합니다.
  await act(async () => {
    // 검토: 첫 헤더 지연값을 완료합니다. abortable이 이미 거절한 fetch Promise를 성공으로 되돌리지는 않습니다.
    oldRequest.headers.resolve(oldRequest.response);
    // 검토: 첫 본문의 원본 지연값에도 정상 접수 정보를 줍니다.
    oldRequest.body.resolve(receipt);
  });
  // 검토: 이 늦은 값 때문에 접수 ID가 나타나면 안 됩니다.
  expect(container.textContent).not.toContain(receipt.report_id);
  // 검토: 아직 끝나지 않은 새 요청의 잠금은 유지되어야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: 새 요청의 signal이 이전 요청의 중단에 휘말리면 안 됩니다.
  expect(newRequest.signal?.aborted).toBe(false);
  // 검토: 새 요청부터 59,999ms를 진행합니다. 기한 직전에 화면을 떠날 예정입니다.
  await advance(59999);
  // 검토: 새 요청은 진행 중이므로 잠금이 유지되어야 합니다.
  expect(submitButton().disabled).toBe(true);
  // 검토: unmount 직전 오류 전달 횟수를 기록하여 정리 중 추가 전달도 검사합니다.
  const relayedErrors = boundaryErrors.mock.calls.length;
  // 검토: 화면을 떠나듯 React 루트를 unmount하고 정리 작업을 반영합니다.
  await act(async () => root.unmount());
  // 검토: afterEach에서 같은 루트를 다시 unmount하지 않도록 기록합니다.
  mounted = false;
  // 검토: unmount 자체가 사라진 화면의 경계에 추가 오류를 보내면 안 됩니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(relayedErrors);
  // 검토: 현재 진행 중이던 새 요청도 signal로 중단해야 합니다.
  expect(newRequest.signal?.aborted).toBe(true);
  // 검토: unmount 뒤 기한 타이머가 남지 않아야 합니다.
  expect(vi.getTimerCount()).toBe(0);
  // 검토: 새 요청의 원본 지연값도 화면이 사라진 뒤 완료시킵니다.
  await act(async () => {
    // 검토: 새 헤더의 늦은 값을 완료합니다. 중단으로 거절된 fetch Promise 상태는 바뀌지 않습니다.
    newRequest.headers.resolve(newRequest.response);
    // 검토: 새 본문의 늦은 값도 완료합니다.
    newRequest.body.resolve(receipt);
  });
  // 검토: 60,001ms를 더 진행해 늦은 타이머나 콜백이 오류를 보내는지 확인합니다.
  await advance(60001);
  // 검토: 화면을 떠난 뒤 늦은 완료나 시간 경과로 오류 전달 횟수가 늘면 안 됩니다.
  expect(boundaryErrors).toHaveBeenCalledTimes(relayedErrors);
  // 검토: unmount나 늦은 완료가 세 번째 요청을 만들어서는 안 됩니다.
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
```
