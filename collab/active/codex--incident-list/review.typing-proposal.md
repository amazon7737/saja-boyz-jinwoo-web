# 사건 목록 테스트 — 배열 타입 교체 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

현재 승인된 테스트는 `readTimes(cards[0])`에서 TS2345 오류가 발생한다. 첫 카드 추출 변수의 추론 타입이 `[] | RegExpMatchArray`이기 때문이다. 아래 제안은 `incidentCards`의 `cards` 선언 한 곳에 `: string[]`을 붙이고 Prettier 줄바꿈만 적용한다. 기존 카드 수·내용·시각·링크 검사는 모두 유지된다. 테스트 본문과 새 기준선의 교체 승인이 필요하다.

원본 실행 입력은 failed-test.typing-proposal.md이다. 공유 헤더와 다섯 테스트 전체를 아래에 보여 주며, 이미 승인된 빈 구현·실행 지원도 참고용으로 유지한다. // 검토: 줄만 제거하면 원본 블록과 바이트 단위로 일치한다.

## 공유 헤더

대상: src/features/incident-list/incident-list.test.ts. 아래 다섯 항목이 이 헤더를 함께 사용한다.

```ts
// 검토: 다섯 테스트가 들어갈 승인된 대상 경로입니다. 현재 첫 항목은 하네스가 구 승인본 그대로 생성한 상태입니다.
// file: src/features/incident-list/incident-list.test.ts
// 검토: 기존 Vitest로 조건을 검사합니다. 새 테스트 라이브러리를 설치하지 않습니다.
import { expect, test } from 'vitest';
// 검토: JSX 없이 React 요소를 만들어 현재 .test.ts 설정을 사용합니다.
import { createElement } from 'react';
// 검토: 정적 HTML만 검사합니다. 클릭, 사진 로드, CSS 치수는 이 방식으로 검증하지 않습니다.
import { renderToStaticMarkup } from 'react-dom/server';
// 검토: 솔피가 정의한 실제 사건 타입을 그대로 사용하며 API 응답을 새로 정의하지 않습니다.
import type { Incident } from '../incidents/types';
// 검토: 승인된 빈 구현이 있는 목록 모듈을 불러옵니다. 구현 전에는 DOM 단언에서 RED가 나야 합니다.
import { IncidentList } from './incident-list';

// 검토: 기준 시각을 고정해 실행 시점이나 컴퓨터 시간에 따라 상대 시각 기대값이 달라지지 않게 합니다.
const now = new Date('2026-10-02T03:00:00.000Z');
// 검토: 실제 뉴스가 아닌 두 합성 사건입니다. 첫 사건은 사진이 있고 두 번째 사건은 없습니다.
const incidents: readonly Incident[] = [
  {
    // 검토: 첫 카드의 상세 경로를 검증할 식별자입니다.
    id: 'sample-one',
    // 검토: 실제 사건으로 오해하지 않도록 샘플임을 제목에 명시합니다.
    title: '샘플: 도로 통행 안내',
    // 검토: 첫 카드에 이 사건의 요약이 표시되는지 검사합니다.
    summary: '화면 검증을 위한 가상 사건입니다.',
    // 검토: 첫 사건의 기존 공용 분류는 사회입니다.
    category: 'society',
    // 검토: 첫 사건의 기존 공용 상태는 진행 중입니다.
    status: 'ongoing',
    // 검토: 고정된 기준 시각보다 정확히 두 시간 전인 발생 시각입니다.
    occurredAt: '2026-10-02T01:00:00.000Z',
    // 검토: 주소는 카드 표시용 합성 값이며 좌표는 타입을 채우는 값입니다. 지도 동작은 검사하지 않습니다.
    location: { address: '샘플시 첫 번째 거리', latitude: 37, longitude: 127 },
    // 검토: 실제 기사 링크가 아닌 fixture 값입니다. 출처 접속이나 신뢰성은 검사하지 않습니다.
    source: { name: '샘플 출처', url: 'https://example.invalid/one' },
    // 검토: 이미지 경로를 HTML에 반영하는지만 검사하며 파일 존재나 다운로드 성공을 뜻하지 않습니다.
    imageUrl: '/fixtures/sample-one.png',
    // 검토: 목록 검증에 사용하지 않는 상세 타임라인은 비워 둡니다.
    timeline: [],
  },
  {
    // 검토: 슬래시·한글·공백·물음표가 포함된 id로 상세 URL 경로 인코딩을 검사합니다.
    id: 'sample/서울 ?',
    // 검토: 두 번째 카드에 첫 사건의 정보가 섞이지 않는지 구분할 제목입니다.
    title: '샘플: 지역 행사 종료',
    // 검토: 두 번째 사건 고유의 요약을 카드별로 검사합니다.
    summary: '두 번째 가상 사건의 요약입니다.',
    // 검토: 두 번째 사건의 기존 공용 분류는 정치입니다.
    category: 'politics',
    // 검토: 두 번째 사건의 기존 공용 상태 문구는 종결입니다.
    status: 'closed',
    // 검토: 고정된 기준 시각보다 정확히 이틀 전이며 월 경계도 지나는 입력입니다.
    occurredAt: '2026-09-30T03:00:00.000Z',
    // 검토: 두 번째 카드의 주소 연결을 검사합니다. 좌표 기반 지도 기능은 범위 밖입니다.
    location: { address: '샘플시 두 번째 거리', latitude: 36, longitude: 128 },
    // 검토: 두 번째 사건도 합성 출처이며 실제 네트워크를 호출하지 않습니다.
    source: { name: '샘플 출처', url: 'https://example.invalid/two' },
    // 검토: 목록 검증에 사용하지 않는 상세 타임라인은 비워 둡니다.
    timeline: [],
  },
];

// 검토: 목록 조회가 끝난 상태를 렌더하는 공통 도우미입니다. 기본값은 위 합성 사건 두 개입니다.
function renderReady(items: readonly Incident[] = incidents) {
  // 검토: React가 만든 HTML 문자열을 얻으며 DOM 이벤트나 브라우저 레이아웃은 실행하지 않습니다.
  return renderToStaticMarkup(
    // 검토: 조회 완료 상태·사건 배열·고정 시각을 목록 표시 컴포넌트에 전달합니다.
    createElement(IncidentList, { state: 'ready', incidents: items, now }),
  );
}

// 검토: time 태그의 ISO 시각과 직접 표시 텍스트를 쌍으로 추출해 부분 문자열 오판을 막습니다.
function readTimes(html: string) {
  // 검토: 시각 요소를 배열로 추출합니다. 원래 검사와 같은 동작이며 줄바꿈만 정리했습니다.
  return [
    // 검토: React SSR dateTime 속성 대소문자를 무시해 ISO 시각과 직접 표시 텍스트를 함께 추출합니다.
    ...html.matchAll(/<time\b[^>]*datetime="([^"]+)"[^>]*>([^<]*)<\/time>/gi),
  // 검토: 발생 시각·표시 문구의 정확 비교를 위한 쌍을 만듭니다.
  ].map((match) => [match[1], match[2]]);
}

// 검토: status 역할 요소의 속성과 내부 HTML을 함께 읽는 정적 검증 도우미입니다.
function readStatus(html: string) {
  // 검토: 첫 status 요소의 태그·속성·내용을 읽습니다. 기존 정규식의 동작은 그대로입니다.
  return html.match(
    // 검토: 안내 문구와 busy 속성이 같은 상태 영역에 연결됐는지 검증할 정규식입니다.
    /<([a-z][a-z0-9]*)\b([^>]*\brole="status"[^>]*)>([\s\S]*?)<\/\1>/,
  );
}
```

## incidentCards — 사건별 정보·입력 순서·상세 링크를 표시한다

대상: src/features/incident-list/incident-list.test.ts. 위 공유 헤더를 사용한다.

```ts
// 검토: 사건별 정보·입력 순서·상세 링크를 표시한다.
test('incidentCards', () => {
  // 검토: 기본 사건 두 개를 조회 완료 상태로 렌더합니다.
  const html = renderReady();
  // 검토: 기존 추출 결과를 문자열 배열로 명시합니다. 실행 동작과 아래 카드 수·내용 검사는 바뀌지 않습니다.
  const cards: string[] =
    // 검토: 기존과 같은 정규식으로 카드별 HTML을 추출하고 결과가 없으면 빈 배열을 사용합니다.
    html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  // 검토: 두 입력에 대응하는 카드가 정확히 두 개 있어야 합니다.
  expect(cards).toHaveLength(2);
  // 검토: 입력 순서를 기준으로 각 사건과 같은 위치의 카드를 대조합니다.
  for (const [index, incident] of incidents.entries()) {
    // 검토: 현재 입력 사건과 대응해야 하는 카드 한 개를 선택합니다.
    const card = cards[index];
    // 검토: 그 사건의 제목이 해당 카드 안에 있어야 합니다.
    expect(card).toContain(incident.title);
    // 검토: 그 사건의 요약이 해당 카드 안에 있어야 합니다.
    expect(card).toContain(incident.summary);
    // 검토: 그 사건의 주소가 해당 카드 안에 있어야 합니다.
    expect(card).toContain(incident.location.address);
    // 검토: 해당 카드에 자신의 상세 URL이 있는지 검사합니다.
    expect(card).toContain(
      // 검토: id를 경로 한 구간으로 인코딩한 기존 기대값을 그대로 사용합니다.
      `href="/incidents/${encodeURIComponent(incident.id)}"`,
    );
  }
  // 검토: 첫 카드에 공용 분류 라벨 사회가 있어야 합니다.
  expect(cards[0]).toContain('사회');
  // 검토: 첫 카드에 공용 상태 라벨 진행 중이 있어야 합니다.
  expect(cards[0]).toContain('진행 중');
  // 검토: 첫 카드의 time은 첫 사건의 발생 시각과 정확히 2시간 전을 연결해야 합니다. 12시간 전은 통과하지 않습니다.
  expect(readTimes(cards[0])).toEqual([[incidents[0].occurredAt, '2시간 전']]);
  // 검토: 두 번째 카드에 공용 분류 라벨 정치가 있어야 합니다.
  expect(cards[1]).toContain('정치');
  // 검토: 시안의 종료 대신 기존 계약에 맞는 종결 라벨을 기대합니다.
  expect(cards[1]).toContain('종결');
  // 검토: 두 번째 카드의 time은 두 번째 사건의 발생 시각과 정확히 2일 전을 연결해야 합니다.
  expect(readTimes(cards[1])).toEqual([[incidents[1].occurredAt, '2일 전']]);
  // 검토: 원본 fixture 배열을 변경하지 않고 입력 순서를 반대로 바꿔 렌더합니다.
  const reversedHtml = renderReady([...incidents].reverse());
  // 검토: 뒤집은 입력이 표시된 카드 순서를 추출합니다.
  const reversedCards =
    // 검토: 같은 article 정규식을 사용하며 줄바꿈 외에 동작을 바꾸지 않았습니다.
    reversedHtml.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  // 검토: 입력 순서를 바꿔도 사건 두 개를 빠짐없이 표시해야 합니다.
  expect(reversedCards).toHaveLength(2);
  // 검토: 이전 두 번째 사건이 이제 첫 번째 카드여야 합니다. 임의 최신순 정렬은 실패합니다.
  expect(reversedCards[0]).toContain(incidents[1].title);
  // 검토: 이전 첫 번째 사건이 이제 두 번째 카드여야 합니다.
  expect(reversedCards[1]).toContain(incidents[0].title);
  // 검토: 목록 본문에 공용 헤더를 중복 생성하지 않습니다.
  expect(html).not.toContain('<header');
  // 검토: 목록 본문에 공용 내비게이션을 중복 생성하지 않습니다.
  expect(html).not.toContain('<nav');
});
```

## incidentImages — 사진 유무와 관계없이 카드와 링크를 유지한다

대상: src/features/incident-list/incident-list.test.ts. 위 공유 헤더를 사용한다.

```ts
// 검토: 사진 유무와 관계없이 카드와 링크를 유지한다.
test('incidentImages', () => {
  // 검토: 기본 사건 두 개를 조회 완료 상태로 렌더합니다.
  const html = renderReady();
  // 검토: 각 사건을 article로 표현한다는 접근성 구조를 계약으로 삼아 카드별 HTML을 분리합니다.
  const cards = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  // 검토: 두 입력에 대응하는 카드가 정확히 두 개 있어야 합니다.
  expect(cards).toHaveLength(2);
  // 검토: 사진이 있는 사건의 경로를 렌더 결과에 반영합니다. 이미지 로드 성공을 검증하는 단언은 아닙니다.
  expect(cards[0]).toContain('src="/fixtures/sample-one.png"');
  // 검토: 사진이 없는 카드에는 제안 문구 사진 없음을 표시합니다.
  expect(cards[1]).toContain('사진 없음');
  // 검토: 사진이 없는 사건에 빈 src 이미지 태그를 만들지 않습니다.
  expect(cards[1]).not.toContain('<img');
  // 검토: 사진 부재로 사건 제목이 사라지지 않아야 합니다.
  expect(cards[1]).toContain('샘플: 지역 행사 종료');
  // 검토: 사진이 없는 두 번째 카드의 상세 URL이 유지되는지 검사합니다.
  expect(cards[1]).toContain(
    // 검토: 기존의 인코딩된 상세 URL 기대값을 그대로 유지합니다.
    'href="/incidents/sample%2F%EC%84%9C%EC%9A%B8%20%3F"',
  );
});
```

## incidentEmpty — 조회 완료 후 0건이면 빈 결과 안내만 표시한다

대상: src/features/incident-list/incident-list.test.ts. 위 공유 헤더를 사용한다.

```ts
// 검토: 조회 완료 후 0건이면 빈 결과 안내만 표시한다.
test('incidentEmpty', () => {
  // 검토: 조회는 완료됐지만 결과가 없는 상황을 만듭니다.
  const html = renderReady([]);
  // 검토: 접근성 상태 영역을 찾아 안내 문구와 속성이 같은 요소에 연결됐는지 검사합니다.
  const status = readStatus(html);
  // 검토: 안내가 들어갈 status 역할 요소가 실제로 존재해야 합니다.
  expect(status).not.toBeNull();
  // 검토: 빈 결과 문구는 status 요소 바깥이 아니라 그 내부에 있어야 합니다.
  expect(status?.[3]).toContain('조건에 맞는 사건이 없어요');
  // 검토: 결과가 없는 경우 사용자가 시도할 수 있는 다음 행동을 안내합니다.
  expect(html).toContain('검색어나 필터를 바꿔보세요');
  // 검토: 빈 결과나 로딩 상태에서 완료된 사건 카드를 표시하지 않습니다.
  expect(html).not.toContain('<article');
  // 검토: 사건이 없는 상태에 잘못된 상세 링크를 표시하지 않습니다.
  expect(html).not.toContain('href="/incidents/');
  // 검토: 조회 완료 0건을 아직 로딩 중인 상태로 표시하지 않습니다.
  expect(html).not.toContain('사건을 불러오는 중');
});
```

## incidentLoading — 로딩 상태를 빈 결과와 구분한다

대상: src/features/incident-list/incident-list.test.ts. 위 공유 헤더를 사용한다.

```ts
// 검토: 로딩 상태를 빈 결과와 구분한다.
test('incidentLoading', () => {
  // 검토: 로딩 상태의 정적 HTML을 별도로 렌더합니다.
  const html = renderToStaticMarkup(
    // 검토: 로딩에는 사건 배열을 넘기지 않아 완료 데이터와 구분합니다.
    createElement(IncidentList, { state: 'loading', now }),
  );
  // 검토: 접근성 상태 영역을 찾아 안내 문구와 속성이 같은 요소에 연결됐는지 검사합니다.
  const status = readStatus(html);
  // 검토: 안내가 들어갈 status 역할 요소가 실제로 존재해야 합니다.
  expect(status).not.toBeNull();
  // 검토: 로딩 중 속성은 문구를 담는 동일한 status 요소에 있어야 합니다.
  expect(status?.[2]).toContain('aria-busy="true"');
  // 검토: 로딩 안내 문구는 실제 status 요소 내부에 있어야 합니다.
  expect(status?.[3]).toContain('사건을 불러오는 중');
  // 검토: 아직 결과를 모르는 로딩 상태를 빈 결과로 잘못 안내하지 않습니다.
  expect(html).not.toContain('조건에 맞는 사건이 없어요');
  // 검토: 빈 결과나 로딩 상태에서 완료된 사건 카드를 표시하지 않습니다.
  expect(html).not.toContain('<article');
  // 검토: 사건이 없는 상태에 잘못된 상세 링크를 표시하지 않습니다.
  expect(html).not.toContain('href="/incidents/');
});
```

## incidentTimeBoundaries — 상대 시각의 분·시간·일 경계를 구분한다

대상: src/features/incident-list/incident-list.test.ts. 위 공유 헤더를 사용한다.

```ts
// 검토: 상대 시각의 분·시간·일 경계를 구분한다.
test('incidentTimeBoundaries', () => {
  // 검토: 상대 시각에서 단위가 바뀌는 경계 직전과 정각을 함께 검사합니다.
  const cases = [
    // 검토: 발생 시각과 now가 같으면 방금 전을 기대합니다.
    [0, '방금 전'],
    // 검토: 1분이 되기 1밀리초 전까지는 방금 전을 기대합니다.
    [59_999, '방금 전'],
    // 검토: 정확히 1분부터 1분 전으로 표시합니다.
    [60_000, '1분 전'],
    // 검토: 1시간이 되기 1밀리초 전은 59분 전으로 내림합니다.
    [3_599_999, '59분 전'],
    // 검토: 정확히 1시간부터 1시간 전으로 표시합니다.
    [3_600_000, '1시간 전'],
    // 검토: 24시간이 되기 1밀리초 전은 23시간 전으로 내림합니다.
    [86_399_999, '23시간 전'],
    // 검토: 정확히 24시간부터 1일 전으로 표시합니다.
    [86_400_000, '1일 전'],
  ] as const;
  // 검토: 각 경과 시간과 기대 문구 쌍을 독립적으로 렌더해 검사합니다.
  for (const [elapsed, label] of cases) {
    // 검토: 고정 now에서 경과 밀리초를 빼 유효한 과거 ISO 발생 시각을 만듭니다.
    const occurredAt = new Date(now.getTime() - elapsed).toISOString();
    // 검토: 동일한 사건에서 시각만 바꾸어 각 경계의 표시를 검사합니다.
    const html = renderReady([{ ...incidents[0], occurredAt }]);
    // 검토: 유일한 time 요소가 해당 ISO 시각과 정확한 상대 문구를 연결해야 합니다. 1분 전과 11분 전을 구별합니다.
    expect(readTimes(html)).toEqual([[occurredAt, label]]);
  }
});
```

## 별도 검토: 실행 가능한 빈 소스 준비

대상: src/features/incident-list/incident-list.tsx. 아직 생성하지 않았다.
승인 후 모듈 import 오류를 해소하기 위한 준비 소스이며, 실제 기능 코드는 이후 승인된 테스트 순서로 구현한다.

```tsx
// 검토: 솔피가 정의한 실제 사건 타입을 그대로 사용하며 API 응답을 새로 정의하지 않습니다.
import type { Incident } from '../incidents/types';

// 검토: 목록 내부 표시 계약이며 외부 서버 API 계약이 아닙니다.
type IncidentListProps =
  // 검토: 로딩 상태는 기준 시각만 받고 완료 데이터를 요구하지 않습니다.
  | { state: 'loading'; now: Date }
  // 검토: 조회 완료 상태는 읽기 전용 사건 배열과 기준 시각을 받습니다.
  | { state: 'ready'; incidents: readonly Incident[]; now: Date };

// 검토: 승인 후 준비할 빈 컴포넌트 선언입니다. 구현 워커가 변경할 소스이며 보호된 테스트가 아닙니다.
export function IncidentList(_props: IncidentListProps) {
  // 검토: 아직 아무 화면도 만들지 않습니다. 이 stub 위에서 테스트가 실제 단언 실패로 시작하게 합니다.
  return null;
}
```
## 전체 테스트 실행 지원

이 부분도 승인 대상이다. runtime-support.draft.md에 제안된 정확한 변경이다.
AGENTS Test를 아래 단일 명령으로 지정하고, package.json scripts.test도 vitest run으로 바꾼다.
세 셸 스위트를 빠짐없이 실행하는 지원 파일이 아래와 같이 함께 들어가므로 범위를 축소하지 않는다.

```text
- Test: `./node_modules/.bin/vitest run`
```

```json
"test": "vitest run"
```

대상: src/test-support/harness.test.ts. 구현 워커가 수정할 수 없는 승인 테스트 지원이다.

```ts
// 검토: 기존 셸 테스트를 Node의 동기 프로세스로 실행하며 새 하네스 언어를 도입하지 않습니다.
import { execFileSync } from 'node:child_process';
// 검토: 기존 Vitest가 셸 스위트의 성공·실패를 전체 테스트 결과로 보고하게 합니다.
import { test } from 'vitest';

// 검토: 호출 가능한 스위트를 기존 세 가지로 제한합니다. 셸 테스트 본문은 변경하지 않습니다.
function runHarness(suite: 'hooks' | 'loop' | 'sobaya') {
  // 검토: 현재 실행 환경을 복사해 의존 도구 PATH 등을 그대로 전달합니다.
  const env = { ...process.env };
  // 검토: 다른 Claude 작업의 루트 경로가 격리된 하네스 fixture에 섞이지 않도록 이 변수만 제외합니다.
  delete env.CLAUDE_PROJECT_DIR;
  // 검토: 선택한 기존 tests/<suite>.sh 파일을 sh로 실행합니다. 종료 코드가 0이 아니면 이 테스트도 실패합니다.
  execFileSync('sh', [`tests/${suite}.sh`], {
    // 검토: 앱 루트에서 실행하여 셸 스위트의 상대 경로가 기존 동작과 같게 합니다.
    cwd: process.cwd(),
    // 검토: 위에서 정리한 실행 환경을 자식 프로세스에 전달합니다.
    env,
    // 검토: 진단 출력을 문자열로 처리합니다.
    encoding: 'utf8',
    // 검토: 하나의 셸 스위트가 120초를 넘기면 타임아웃 실패로 처리합니다.
    timeout: 120_000,
    // 검토: 진단 출력은 최대 8MiB를 보관하며 넘으면 오류로 처리합니다.
    maxBuffer: 8 * 1024 * 1024,
  });
}

// 검토: 기존 협업 hooks 스위트를 빠짐없이 실행하며 Vitest 제한은 180초입니다.
test('harness_hooks', () => runHarness('hooks'), 180_000);
// 검토: 기존 협업 loop 스위트를 빠짐없이 실행하며 Vitest 제한은 180초입니다.
test('harness_loop', () => runHarness('loop'), 180_000);
// 검토: 기존 sobaya 통합 스위트를 빠짐없이 실행하며 Vitest 제한은 180초입니다.
test('harness_sobaya', () => runHarness('sobaya'), 180_000);
```
