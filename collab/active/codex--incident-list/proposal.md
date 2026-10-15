# 사건 목록 1차 구현안

상태: **사용자 검토 전**. 작업 시작 승인은 받았으나 아래 정확한 명세·테스트·지원 코드 승인은 아직 받지 않았다.

## 이번 단계의 결과

Figma [사건 목록 본문 11:2153](https://www.figma.com/design/TCSILMzViAVqeHRphoyHCH?node-id=11-2153)을 기준으로 목록 표시 컴포넌트를 구현한다.
카드는 제목·분류·상태·주소·발생 시각·요약·사진을 표시하고 사건 상세 URL로 연결한다.
입력 순서를 유지하며 id는 URL 경로 한 구간으로 인코딩한다.
사진이 없으면 같은 카드 자리에 “사진 없음”을 표시한다.
조회 완료 0건은 “조건에 맞는 사건이 없어요 / 검색어나 필터를 바꿔보세요”, 로딩은 “사건을 불러오는 중”으로 구분한다.
시각은 고정 now를 주입해 검증하고 1분 미만은 “방금 전”, 이후 분·시간·일 단위로 내림하여 표시한다.
이 단계는 계약을 만족하는 유효한 과거 ISO 발생 시각을 입력으로 받는다. API의 잘못된 날짜·미래 날짜 처리는 API 계약과 함께 별도 정의한다.

## 경계와 완료 조건

- 변경 범위: src/features/incident-list/의 컴포넌트·CSS Module·테스트.
- 이후 연결 대상: src/app/incidents/page.tsx와 loading.tsx. 라우트용 샘플 데이터 표시와 URL 필터 연결은 다음 승인 항목으로 준비하며 이번 다섯 테스트가 이를 보증하지 않는다.
- 기존 Incident·공용 한글 라벨을 재사용한다. 새 공용 UI·필터 URL 어댑터는 만들지 않는다.
- 공용 IncidentBadges는 현재 없으므로 공용 기반 인수 때 통합한다. 그 전에는 목록 내부 텍스트로 기존 라벨을 표시한다.
- 서버 호출·API 응답 규격·인증·저장소·정렬/페이지 정책은 확정하지 않는다.
- 테스트 fixture는 실제 뉴스가 아닌 합성 데이터다. fixture 이미지 경로와 출처 URL은 렌더 문자열 검증용이며 네트워크 요청이나 파일 존재를 보증하지 않는다.
- Figma 기준: 목록 좌우 여백 16px, 카드 간격 12px, 카드 padding 12px·radius 14px, 썸네일 80×80px·radius 8px. 제목 14px, 메타 11px, 요약 12px/16px. 상태 문구는 시안의 “종료”보다 기존 계약의 “종결”을 따른다.
- DOM 이벤트/화면 크기/이미지 실재/스타일은 정적 렌더 테스트가 보증하지 않는다. 구현 후 393px 브라우저 확인과 실제 링크 이동 확인이 필요하다.
- 최종 완료는 전체 테스트·lint·format·typecheck·build, Sobaya gate와 별도 컨텍스트의 HEAD 기준 review가 통과한 뒤 판정한다.

## 사용자 소유 명세

spec.md가 없다. 이 문서는 spec.md의 대안이나 승인본이 아닌 명세 제안이다.
사용자 소유 spec.md에는 위 동작과 범위를 확정해 넣어야 한다. 에이전트는 spec.md를 생성하거나 수정하지 않는다.

## 실행 지원 제안

아래 파일은 현재 생성하지 않았다. 새 모듈 import 실패를 기능 RED로 오인하지 않도록, 명시적 승인 후 빈 구현을 먼저 준비하고 각 테스트를 materialize한다.
이 빈 구현은 보호된 테스트 지원이 아니라 구현 워커가 변경할 원본 소스다.

대상: src/features/incident-list/incident-list.tsx

```tsx
import type { Incident } from '../incidents/types';

type IncidentListProps =
  | { state: 'loading'; now: Date }
  | { state: 'ready'; incidents: readonly Incident[]; now: Date };

export function IncidentList(_props: IncidentListProps) {
  return null;
}
```

현재 AGENTS의 Test는 pnpm test이며 pnpm 스크립트는 vitest와 셸 스위트를 이어 실행한다.
현재/팀 lock Sobaya는 이 명령 형식을 acceptance runner로 해석하지 못한다.
공용 재시작 문서 docs/sobaya-restart-approval.md의 기존 제안처럼,
AGENTS Test를 ./node_modules/.bin/vitest run으로, package.json scripts.test를 vitest run으로 바꾸고
기존 셸 스위트 3개는 Vitest 지원 파일에서 그대로 실행하는 방안을 별도로 검토한다.
이것은 공유 테스트 계약 변경이다. 정확한 변경 코드와 로컬 연결 절차는 runtime-support.draft.md에 제시했고,
review.md에도 설명 주석을 포함했다. 이 실행 지원까지 포함한 명시적 승인을 받아 적용한다.

앱 .githooks 협업 pre-commit과 Sobaya doctor의 관리 훅 검사 사이 호환 문제는 실제 확인됐다.
공유 하네스·lock·타인의 작업은 바꾸지 않고, 팀 lock의 별도 checkout과 로컬 위임 훅으로 연결하는 방안을
runtime-support.draft.md에 제안했다. doctor의 실패는 그대로 보고하며 두 검사 경로의 실제 실행을 따로 확인한다.
실행 지원·명세·테스트가 승인되고 준비되지 않으면 approve/구현 루프를 실행하지 않는다.

## 검토 파일

- failed-test.draft.md: 실행 코드 원본 5개
- review.md: 원본을 줄 단위 설명한 사용자 검토본
- probe-results.md: 프로브 결과 및 검증 한계
- runtime-support.draft.md: 전체 테스트 명령·기존 셸 스위트 지원·로컬 훅 연결안
