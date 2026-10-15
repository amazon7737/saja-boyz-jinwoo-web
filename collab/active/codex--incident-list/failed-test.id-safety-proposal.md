# 사건 목록 본문 — 승인된 테스트 계획

2026-10-02 사용자가 최초 명세·테스트·실행 지원을 승인했고, 이어 포맷 교체안과 incidentCards 배열 타입 교체·새 기준선도 승인했다.
대상은 목록 표시 컴포넌트다. 라우트 연결·공용 UI 인수·API 연결 완료를 의미하지 않는다.

## 목록 표시

```ts
// file: src/features/incident-list/incident-list.test.ts
import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Incident } from '../incidents/types';
import { IncidentList } from './incident-list';

const now = new Date('2026-10-02T03:00:00.000Z');
const incidents: readonly Incident[] = [
  {
    id: 'sample-one',
    title: '샘플: 도로 통행 안내',
    summary: '화면 검증을 위한 가상 사건입니다.',
    category: 'society',
    status: 'ongoing',
    occurredAt: '2026-10-02T01:00:00.000Z',
    location: { address: '샘플시 첫 번째 거리', latitude: 37, longitude: 127 },
    source: { name: '샘플 출처', url: 'https://example.invalid/one' },
    imageUrl: '/fixtures/sample-one.png',
    timeline: [],
  },
  {
    id: 'sample/서울 ?',
    title: '샘플: 지역 행사 종료',
    summary: '두 번째 가상 사건의 요약입니다.',
    category: 'politics',
    status: 'closed',
    occurredAt: '2026-09-30T03:00:00.000Z',
    location: { address: '샘플시 두 번째 거리', latitude: 36, longitude: 128 },
    source: { name: '샘플 출처', url: 'https://example.invalid/two' },
    timeline: [],
  },
];

function renderReady(items: readonly Incident[] = incidents) {
  return renderToStaticMarkup(
    createElement(IncidentList, { state: 'ready', incidents: items, now }),
  );
}

function readTimes(html: string) {
  return [
    ...html.matchAll(/<time\b[^>]*datetime="([^"]+)"[^>]*>([^<]*)<\/time>/gi),
  ].map((match) => [match[1], match[2]]);
}

function readStatus(html: string) {
  return html.match(
    /<([a-z][a-z0-9]*)\b([^>]*\brole="status"[^>]*)>([\s\S]*?)<\/\1>/,
  );
}
```

- [x] incidentCards — 사건별 정보·입력 순서·상세 링크를 표시한다

```ts
test('incidentCards', () => {
  const html = renderReady();
  const cards: string[] =
    html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  expect(cards).toHaveLength(2);
  for (const [index, incident] of incidents.entries()) {
    const card = cards[index];
    expect(card).toContain(incident.title);
    expect(card).toContain(incident.summary);
    expect(card).toContain(incident.location.address);
    expect(card).toContain(
      `href="/incidents/${encodeURIComponent(incident.id)}"`,
    );
  }
  expect(cards[0]).toContain('사회');
  expect(cards[0]).toContain('진행 중');
  expect(readTimes(cards[0])).toEqual([[incidents[0].occurredAt, '2시간 전']]);
  expect(cards[1]).toContain('정치');
  expect(cards[1]).toContain('종결');
  expect(readTimes(cards[1])).toEqual([[incidents[1].occurredAt, '2일 전']]);
  const reversedHtml = renderReady([...incidents].reverse());
  const reversedCards =
    reversedHtml.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  expect(reversedCards).toHaveLength(2);
  expect(reversedCards[0]).toContain(incidents[1].title);
  expect(reversedCards[1]).toContain(incidents[0].title);
  expect(html).not.toContain('<header');
  expect(html).not.toContain('<nav');
});
```

- [x] incidentImages — 사진 유무와 관계없이 카드와 링크를 유지한다

```ts
test('incidentImages', () => {
  const html = renderReady();
  const cards = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  expect(cards).toHaveLength(2);
  expect(cards[0]).toContain('src="/fixtures/sample-one.png"');
  expect(cards[1]).toContain('사진 없음');
  expect(cards[1]).not.toContain('<img');
  expect(cards[1]).toContain('샘플: 지역 행사 종료');
  expect(cards[1]).toContain(
    'href="/incidents/sample%2F%EC%84%9C%EC%9A%B8%20%3F"',
  );
});
```

- [x] incidentEmpty — 조회 완료 후 0건이면 빈 결과 안내만 표시한다

```ts
test('incidentEmpty', () => {
  const html = renderReady([]);
  const status = readStatus(html);
  expect(status).not.toBeNull();
  expect(status?.[3]).toContain('조건에 맞는 사건이 없어요');
  expect(html).toContain('검색어나 필터를 바꿔보세요');
  expect(html).not.toContain('<article');
  expect(html).not.toContain('href="/incidents/');
  expect(html).not.toContain('사건을 불러오는 중');
});
```

- [x] incidentLoading — 로딩 상태를 빈 결과와 구분한다

```ts
test('incidentLoading', () => {
  const html = renderToStaticMarkup(
    createElement(IncidentList, { state: 'loading', now }),
  );
  const status = readStatus(html);
  expect(status).not.toBeNull();
  expect(status?.[2]).toContain('aria-busy="true"');
  expect(status?.[3]).toContain('사건을 불러오는 중');
  expect(html).not.toContain('조건에 맞는 사건이 없어요');
  expect(html).not.toContain('<article');
  expect(html).not.toContain('href="/incidents/');
});
```

- [x] incidentTimeBoundaries — 상대 시각의 분·시간·일 경계를 구분한다

```ts
test('incidentTimeBoundaries', () => {
  const cases = [
    [0, '방금 전'],
    [59_999, '방금 전'],
    [60_000, '1분 전'],
    [3_599_999, '59분 전'],
    [3_600_000, '1시간 전'],
    [86_399_999, '23시간 전'],
    [86_400_000, '1일 전'],
  ] as const;
  for (const [elapsed, label] of cases) {
    const occurredAt = new Date(now.getTime() - elapsed).toISOString();
    const html = renderReady([{ ...incidents[0], occurredAt }]);
    expect(readTimes(html)).toEqual([[occurredAt, label]]);
  }
});
```

- [ ] incidentUnsafeIds — 잘못된 ID는 카드를 유지하되 상세 이동을 제공하지 않는다

```ts
test('incidentUnsafeIds', () => {
  for (const id of ['', '.', '..', '\uD800', '\uDC00']) {
    let html = '';
    expect(() => {
      html = renderReady([{ ...incidents[0], id }]);
    }).not.toThrow();
    const cards: string[] =
      html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
    expect(cards).toHaveLength(1);
    expect(cards[0]).toContain(incidents[0].title);
    expect(cards[0]).toContain(incidents[0].summary);
    expect(cards[0]).toContain('상세 정보 없음');
    expect(cards[0]).not.toMatch(/<a\b/);
  }
});
```
