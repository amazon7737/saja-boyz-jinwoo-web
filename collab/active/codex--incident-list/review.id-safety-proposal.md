# 사건 ID 예외 처리 — 추가 승인 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음**

독립 리뷰가 현재 소스 `5995c11`에서 `.`·`..` ID의 상세 경로 이탈을 재현하여 완료 판정을 보류했다. 빈 ID도 목록으로 이동한다. `encodeURIComponent`가 처리할 수 없는 단독 UTF-16 서로게이트는 렌더 오류를 일으킬 수 있다.

## 제안하는 결정

빈 문자열·`.`·`..`·올바르지 않은 Unicode ID가 들어오면 **카드의 정보와 순서를 유지하고, 상세 링크 대신 “상세 정보 없음”을 표시한다.** 유효한 ID의 URL은 현재 승인된 규칙 그대로다. 잘못된 ID를 새로운 ID로 바꾸거나 상세 화면·API용 decoder를 추가하지 않는다.

승인 대상은 아래 공유 헤더와 신규 `incidentUnsafeIds` 테스트, `spec.id-safety-proposal.md`의 명시적인 예외, 기존 다섯 테스트를 그대로 보존한 `failed-test.id-safety-proposal.md`를 새 기준선으로 기록하는 것이다. 기존 테스트·지원 코드·제한시간 변경은 없다. 아직 명세·승인 계획·실행 테스트·구현에는 적용하지 않았다.

## 공유 헤더

대상: `src/features/incident-list/incident-list.test.ts`. 기존 승인 헤더를 바이트 그대로 재사용한다. 합성 fixture·고정 now·정적 렌더를 사용한다. 네트워크, 실제 상세 화면, 클릭 동작을 이 테스트가 보증하지는 않는다.

```ts
// 검토: 기존 다섯 테스트와 신규 테스트가 같은 승인된 대상 파일을 사용합니다.
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

## 추가 항목: incidentUnsafeIds

```ts
// 검토: 잘못된 ID가 목록 렌더 오류나 잘못된 상세 이동으로 이어지지 않는지 검사합니다.
test('incidentUnsafeIds', () => {
  // 검토: 빈 ID, 경로 이동을 뜻하는 두 ID, 짝이 없는 상위·하위 UTF-16 서로게이트를 각각 입력합니다.
  for (const id of ['', '.', '..', '\uD800', '\uDC00']) {
    // 검토: 예외 발생 여부를 검사한 렌더 결과를 이후 카드 단언에도 사용합니다.
    let html = '';
    // 검토: 기존 유효한 합성 사건에서 ID만 바꿔서 렌더합니다.
    expect(() => {
      // 검토: 잘못된 ID 하나 때문에 목록 전체 렌더가 실패해서는 안 됩니다.
      html = renderReady([{ ...incidents[0], id }]);
    }).not.toThrow();
    // 검토: article 단위 결과를 추출하며 TypeScript 추론의 빈 배열 문제를 피하도록 타입을 명시합니다.
    const cards: string[] =
      html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
    // 검토: 잘못된 ID의 사건도 정보가 사라지지 않도록 카드 하나를 유지해야 합니다.
    expect(cards).toHaveLength(1);
    // 검토: 사건 제목을 그대로 보여줍니다.
    expect(cards[0]).toContain(incidents[0].title);
    // 검토: 사건 요약을 그대로 보여줍니다.
    expect(cards[0]).toContain(incidents[0].summary);
    // 검토: 상세 이동이 제공되지 않는 상태를 사용자가 알 수 있게 표시합니다.
    expect(cards[0]).toContain('상세 정보 없음');
    // 검토: 카드 내부에 실제 링크를 만들지 않아 경로 이탈과 키보드 링크 진입을 막습니다.
    expect(cards[0]).not.toMatch(/<a\b/);
  }
});
```

기존 다섯 테스트는 변경하지 않는다. 전체 실행 입력은 `failed-test.id-safety-proposal.md`에서 확인할 수 있다.

## 현재 증거와 완료 조건

- 승인된 12개 테스트·format·lint·typecheck·build와 최종 gate는 통과했다. 독립 review만 P2 finding으로 보류됐다.
- 이 신규 후보를 공식 probe로 실행한 결과 `incidentUnsafeIds`의 “상세 정보 없음” 단언이 실제 실패했다. 첫 빈 ID에서 멈추므로 이후 표의 모든 입력이 각각 실패했다는 증거는 아니다.
- 뉴스 API OpenAPI와 구현은 article_id를 64자리 소문자 hex SHA-256으로 생성한다. 다만 Article과 Incident의 매핑은 미확정이므로 앱의 입력 계약을 임의로 해시 ID로 제한하지 않는다.
- 승인 후 정확한 새 기준선 → 이 항목 구현 → 전체 검사 → 브라우저에서 비링크 카드와 일반 링크 확인 → 최종 gate·독립 review → PR 순서로 마무리한다.
