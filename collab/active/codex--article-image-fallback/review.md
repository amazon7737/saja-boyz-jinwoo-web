# 기사 이미지 실패 처리 — 정확한 입력 검토본

**검토용 — 설명 주석은 실행 코드에 포함되지 않음. 아직 사람 승인을 받지 않았다.**

승인 요청 범위는 [명세](spec.proposal.md), 아래 새 테스트 2개와 공통 헤더, [DOM 지원안](support.proposal.md)이다. [더 보기·공용 UI 제안](pagination-ui-proposal.md)은 이번 이미지 테스트 승인 범위에 포함하지 않는다.

- 새 대상: `src/features/article-list/article-image-error.test.ts`.
- 기존 API 연결 8개와 기존 13개 테스트·설정·이전 승인 기준선은 보존한다.
- 실제 ArticleList·React DOM·Next/Image를 사용한다. jsdom의 error 주입은 실제 HTTP 404 다운로드나 픽셀 레이아웃 검증이 아니다. 실제 브라우저 검증으로 보완한다.
- 설명 주석만 제거하면 [실행 초안](failed-test.draft.md)의 세 블록이 공백·원래 주석·순서까지 그대로 복원되는지 자동 비교했다.
- `tdd-set/AGENTS.md`의 “The human reviews the specification, tests, and required test support.” 규칙에 따라 새 정확한 입력만 한 번 검토받는다. 기존 API 테스트의 재승인 요청이 아니다.

## 공통 헤더·fixture·준비·정리

```ts
// 검토: 새 테스트 대상 파일이다. 기존 승인 테스트 파일은 수정하지 않는다.
// file: src/features/article-list/article-image-error.test.ts
// 검토: 이 파일만 DOM 환경을 사용하며 기존 node 환경과 실행 설정은 보존한다.
// @vitest-environment jsdom
// 검토: 테스트 수명주기·검증 함수와 act 환경 플래그를 복원할 도구를 가져온다.
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
// 검토: 실제 React 업데이트를 완료하는 act와 JSX 대신 사용할 요소 생성 함수를 가져온다.
import { act, createElement } from 'react';
// 검토: 실제 React DOM 렌더러를 사용한다. 가짜 hook 상태로 대체하지 않는다.
import { createRoot, type Root } from 'react-dom/client';
// 검토: 현재 실제 목록과 공개 입력 타입을 가져온다. 목록·Next/Image mock은 없다.
import { ArticleList, type ArticleCollectionItem } from './article-list';

// 검토: 외부 요청을 보내지 않는 예시 origin이며 이미지 src 기대값에만 사용한다.
const apiOrigin = 'https://news.example.invalid';
// 검토: 이미지 경로 검증을 통과하는 64자리 hex 기사 A ID다.
const idA = 'a'.repeat(64);
// 검토: 다른 정상 이미지 B 카드의 64자리 hex ID다.
const idB = 'b'.repeat(64);
// 검토: 이미지 없는 C 카드의 64자리 hex ID다.
const idC = 'c'.repeat(64);

// 검토: 기사별 제목·요약·발행·원문이 구분되는 실제 입력 형태의 fixture를 만든다.
function item(id: string, label: string): ArticleCollectionItem {
  // 검토: 테스트에서 사용할 기사 입력을 구성한다. 실제 API를 조회하지 않는다.
  return {
    // 검토: 각 카드의 ID를 입력 그대로 유지한다.
    article_id: id,
    // 검토: 기본 fixture는 이미지를 제공하는 ready 상태다.
    image_status: 'ready',
    // 검토: ID와 같은 상대 이미지 경로를 사용해 기존 안전 경로 계약을 지킨다.
    image_url: `/images/${id}.jpg`,
    // 검토: 오류 뒤에도 남아야 할 기사 정보를 준비한다.
    article: {
      // 검토: 카드별 제목이 오류 후에도 유지되는지 식별할 문구다.
      title: `샘플 기사 ${label}`,
      // 검토: 이미지 실패가 요약을 지우지 않는지 확인할 문구다.
      description: `검증용 기사 ${label} 요약`,
      // 검토: KST 09시와 UTC 00시가 대응하는 유효한 발행 시각이다.
      pubDate: '2026-10-04T09:00:00+09:00',
      // 검토: 이미지 실패·주소 변경과 관계없이 유지할 HTTPS 원문 주소다.
      originallink: `https://publisher.example.invalid/${label}`,
      // 검토: 원문 주소 보존을 직접 확인하도록 portal 대체 링크는 비워 둔다.
      link: '',
    },
  };
}

// 검토: 각 테스트가 소유할 실제 DOM 컨테이너다.
let container: HTMLDivElement;
// 검토: 테스트 안 재렌더에서 교체하지 않고 유지할 React root다.
let root: Root;

// 검토: 각 테스트마다 독립된 DOM과 root를 만들어 실패 상태를 분리한다.
beforeEach(() => {
  // 검토: 이 파일에서만 React act 환경임을 알리고 종료 뒤 원래 전역 값으로 복원한다.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // 검토: DOM 컨테이너를 생성한다. 픽셀 레이아웃 값을 가짜로 설정하지 않는다.
  container = document.createElement('div');
  // 검토: 컨테이너를 실제 document에 붙인다.
  document.body.append(container);
  // 검토: 실제 React DOM root를 만든다.
  root = createRoot(container);
});

// 검토: 성공·실패 여부와 관계없이 렌더러와 DOM·전역 값을 정리한다.
afterEach(async () => {
  // 검토: React 정리 작업까지 완료한 뒤 root를 해제한다.
  await act(async () => root.unmount());
  // 검토: 이번 테스트의 DOM을 제거한다.
  container.remove();
  // 검토: act 환경 플래그를 원래 값으로 되돌린다.
  vi.unstubAllGlobals();
});

// 검토: 같은 root에서 props만 바꾸는 렌더 동작이다. 부모 key로 강제 교체하지 않는다.
async function render(items: ArticleCollectionItem[], origin = apiOrigin) {
  // 검토: 렌더 또는 이벤트에 따른 실제 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => {
    // 검토: 실제 목록에 공개 props를 전달한다.
    root.render(createElement(ArticleList, { items, apiOrigin: origin }));
  });
}

// 검토: 실제 DOM img에 error를 전달한다. HTTP 다운로드 자체를 재현하는 함수는 아니다.
async function failImage(image: HTMLImageElement) {
  // 검토: 렌더 또는 이벤트에 따른 실제 React 업데이트가 끝날 때까지 기다린다.
  await act(async () => {
    // 검토: React state를 직접 바꾸지 않고 DOM의 오류 이벤트 처리 경로를 실행한다.
    image.dispatchEvent(new Event('error'));
  });
}
```

## articleImageErrorPreservesCards

```ts
// 검토: A 이미지 실패가 해당 placeholder로만 바뀌고 기사 내용·원문·다른 카드가 유지되는지 검증한다.
test('articleImageErrorPreservesCards', async () => {
  // 검토: 기존 이미지 없음 상태인 C 카드도 같은 목록에 포함한다.
  const disabled = {
    // 검토: C의 기사 정보는 유지하면서 이미지 메타데이터만 disabled로 바꾼다.
    ...item(idC, 'C'),
    // 검토: C 카드만 원래 이미지가 없는 상태로 둔다.
    image_status: 'disabled',
    // 검토: disabled 카드에는 이미지 주소를 제공하지 않는다.
    image_url: null,
  };
  // 검토: 정상 이미지 A·B와 이미지 없는 C를 함께 렌더한다.
  await render([item(idA, 'A'), item(idB, 'B'), disabled]);
  // 검토: 오류를 발생시키기 전 현재 카드들을 찾아 초기 상태를 확인한다.
  const initialCards = container.querySelectorAll('article');
  // 검토: A·B·C가 처음 모두 렌더됐는지 확인한다.
  expect(initialCards).toHaveLength(3);
  // 검토: 첫 카드 A의 실제 img를 오류 대상으로 선택한다.
  const image = initialCards[0].querySelector('img');
  // 검토: 초기 img가 실제 존재해야 한다. 누락 요소나 import 오류를 RED로 삼지 않는다.
  assert(image);
  // 검토: 장식 이미지의 빈 alt를 유지해 옆 제목과 중복하지 않는다.
  expect(image.getAttribute('alt')).toBe('');
  // 검토: 기존 80px width 속성을 유지한다. 실제 픽셀 측정은 브라우저에서 별도로 한다.
  expect(image.getAttribute('width')).toBe('80');
  // 검토: 기존 80px height 속성을 유지한다. jsdom이 실제 레이아웃을 검증한다는 뜻은 아니다.
  expect(image.getAttribute('height')).toBe('80');
  // 검토: 오류 전 정상 이미지의 AI 캡션이 존재해야 한다.
  expect(initialCards[0].querySelector('figcaption')?.textContent).toBe(
    // 검토: 정상 이미지의 캡션은 이 기존 문구를 유지해야 한다.
    'AI 생성 이미지',
  );

  // 검토: A 이미지에만 오류를 발생시킨다.
  await failImage(image);

  // 검토: 오류 처리 뒤 현재 DOM의 article들을 새로 조회한다. 제거된 옛 노드를 검증하지 않는다.
  const cards = container.querySelectorAll('article');
  // 검토: 오류 뒤 현재 DOM의 카드 제목 순서를 확인한다.
  expect(
    // 검토: 현재 카드 순서대로 제목을 수집한다.
    Array.from(cards, (card) => card.querySelector('h2')?.textContent),
  // 검토: 현재 DOM에 A·B·C 순서가 그대로 남아야 한다. 카드 삭제·재정렬을 놓치지 않는다.
  ).toEqual(['샘플 기사 A', '샘플 기사 B', '샘플 기사 C']);

  // 검토: 실패한 img가 DOM에서 제거돼 깨진 이미지가 남지 않아야 한다.
  expect(cards[0].querySelector('img')).toBeNull();
  // 검토: 실패한 이미지의 AI 캡션도 제거해야 한다.
  expect(cards[0].querySelector('figcaption')).toBeNull();
  // 검토: 실패 카드에는 기존 대체 표시 문구가 나타나야 한다.
  expect(cards[0].textContent).toContain('이미지 없음');
  // 검토: 실패 후에도 A의 제목을 유지해야 한다.
  expect(cards[0].querySelector('h2')?.textContent).toBe('샘플 기사 A');
  // 검토: 실패 후에도 A의 요약을 유지해야 한다.
  expect(cards[0].textContent).toContain('검증용 기사 A 요약');
  // 검토: 기사 발행이라는 의미와 기존 KST 절대 시각을 유지해야 한다.
  expect(cards[0].textContent).toContain('기사 발행 2026-10-04 09:00 KST');
  // 검토: 기계가 읽는 ISO 발행 시각을 유지해야 한다.
  expect(cards[0].querySelector('time')?.dateTime).toBe(
    // 검토: 발행 시각의 UTC ISO 값은 원래 KST 09시와 대응해야 한다.
    '2026-10-04T00:00:00.000Z',
  );
  // 검토: 실패 후에도 원문 링크의 목적지가 유지돼야 한다.
  expect(cards[0].querySelector('a')?.getAttribute('href')).toBe(
    // 검토: A의 원래 HTTPS 원문 목적지를 정확히 유지해야 한다.
    'https://publisher.example.invalid/A',
  );
  // 검토: 기사 원문 링크의 표시 문구도 유지해야 한다.
  expect(cards[0].querySelector('a')?.textContent).toBe('기사 원문');
  // 검토: B의 정상 이미지는 A 오류의 영향을 받으면 안 된다.
  expect(cards[1].querySelector('img')?.src).toBe(
    // 검토: 실패하지 않은 B 이미지의 원래 주소를 유지해야 한다.
    `${apiOrigin}/images/${idB}.jpg`,
  );
  // 검토: B 이미지의 AI 캡션도 유지해야 한다.
  expect(cards[1].querySelector('figcaption')?.textContent).toBe(
    // 검토: 정상 이미지의 캡션은 이 기존 문구를 유지해야 한다.
    'AI 생성 이미지',
  );
  // 검토: 정상 카드 B가 실패 placeholder로 바뀌면 안 된다.
  expect(cards[1].textContent).not.toContain('이미지 없음');
  // 검토: disabled C 카드에 이미지를 새로 만들면 안 된다.
  expect(cards[2].querySelector('img')).toBeNull();
  // 검토: C의 원래 이미지 없음 안내를 유지해야 한다.
  expect(cards[2].textContent).toContain('이미지 없음');
  // 검토: 이미지 오류 후에도 A·B·C 세 카드를 유지해야 한다.
  expect(container.querySelectorAll('article')).toHaveLength(3);
});
```

## articleImageRecoversForNewSource

```ts
// 검토: 동일 root·동일 기사 ID에 새 URL이 들어오면 이전 실패가 새 이미지까지 막지 않는지 확인한다.
test('articleImageRecoversForNewSource', async () => {
  // 검토: 같은 기사 ID와 입력 배열을 재사용해 remount로 인한 가짜 복구를 피한다.
  const articles = [item(idA, 'A')];
  // 검토: 초기 origin으로 A 카드를 렌더한다.
  await render(articles);
  // 검토: 초기 URL의 실제 img를 찾는다.
  const initialImage = container.querySelector('img');
  // 검토: 오류 주입 전에 img 존재를 확인한다.
  assert(initialImage);
  // 검토: 초기 URL에서 실제 DOM error 처리를 실행한다.
  await failImage(initialImage);
  // 검토: 오류를 받은 img가 DOM에 남아 있으면 안 된다.
  expect(container.querySelector('img')).toBeNull();
  // 검토: 오류 상태에는 기존 대체 문구를 표시해야 한다.
  expect(container.textContent).toContain('이미지 없음');

  // 검토: 안전한 상대 경로 규칙은 유지하면서 완전한 이미지 URL이 달라지게 한다.
  const nextOrigin = 'https://updated-news.example.invalid';
  // 검토: root와 기사 ID를 유지하고 origin만 바꾼다. 호출자가 key를 바꾸지 않는다.
  await render(articles, nextOrigin);

  // 검토: 새 URL로 복구된 img DOM을 찾는다.
  const nextImage = container.querySelector('img');
  // 검토: 이전 실패 상태가 새 URL까지 숨긴다면 이 검증이 실패한다.
  assert(nextImage);
  // 검토: 새 이미지는 이전 주소가 아니라 새 origin의 같은 기사 JPG를 사용해야 한다.
  expect(nextImage.src).toBe(`${nextOrigin}/images/${idA}.jpg`);
  // 검토: 복구한 이미지도 기존 장식 이미지 alt 정책을 유지해야 한다.
  expect(nextImage.getAttribute('alt')).toBe('');
  // 검토: 새 URL로 이미지를 표시할 때 이전 placeholder는 없어야 한다.
  expect(container.textContent).not.toContain('이미지 없음');
  // 검토: 새 이미지 표시에는 AI 캡션이 복원돼야 한다.
  expect(container.querySelector('figcaption')?.textContent).toBe(
    // 검토: 정상 이미지의 캡션은 이 기존 문구를 유지해야 한다.
    'AI 생성 이미지',
  );
  // 검토: 이미지 origin 변경이 기사 원문의 주소를 바꾸면 안 된다.
  expect(container.querySelector('a')?.getAttribute('href')).toBe(
    // 검토: A의 원래 HTTPS 원문 목적지를 정확히 유지해야 한다.
    'https://publisher.example.invalid/A',
  );

  // 검토: 새 URL도 실패했을 때 같은 대체 표시가 다시 작동하는지 확인한다.
  await failImage(nextImage);

  // 검토: 오류를 받은 img가 DOM에 남아 있으면 안 된다.
  expect(container.querySelector('img')).toBeNull();
  // 검토: 새 URL도 실패하면 AI 캡션을 다시 제거해야 한다.
  expect(container.querySelector('figcaption')).toBeNull();
  // 검토: 오류 상태에는 기존 대체 문구를 표시해야 한다.
  expect(container.textContent).toContain('이미지 없음');
  // 검토: 재렌더와 두 번의 오류 뒤에도 기사 카드 하나는 유지해야 한다.
  expect(container.querySelectorAll('article')).toHaveLength(1);
});
```

## 지원 설정의 정확한 차이

`vitest.config.ts`와 공통 setup 파일은 변경하지 않는다. 새 파일의 환경 지시문만 jsdom을 선택한다.

```jsonc
// 검토: 기존 package.json의 devDependencies에 이 정확한 버전 한 항목만 추가한다. 운영 dependencies·기존 scripts·Node24 계약은 유지한다.
"jsdom": "27.4.0"
```

전체 package.json·pnpm 잠금 파일과 추가 전이 의존성·Vitest peer 연결은 [support.patch](support.patch), [지원안 원문](support.proposal.md)에 포함했다. 잠금 파일을 수동 편집하지 않았다.

## 승인 뒤의 진행

승인받은 정확한 입력을 spec.md·failed-test.md·지원 파일의 새 기준선으로 기록한 뒤 pinned Sobaya로 항목별 구현한다. 이미지 영역 외 서버/API·공용 UI는 보존하고 전체 23개 테스트·정적 검사·빌드·실제 404 화면·최종 gate·독립 리뷰까지 확인한다.
