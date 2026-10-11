# 코드 작성 컨벤션

기존 컴포넌트 책임과 동작을 유지하면서 의존성과 처리 단계를 쉽게 읽도록 작성한다. 파일·폴더 책임은 [개발 기반](architecture.md)을 따른다. 이 기준을 이유로 아키텍처 계층을 늘리거나 컴포넌트마다 CSS 클래스 상수를 만들지 않는다. 훅·컴포넌트 추출은 실제 재사용이나 독립 책임이 있을 때만 검토한다.

## 파일과 import 구획

`'use client'` 같은 지시문은 import와 빈 줄로 분리한다. import는 Node 내장 모듈 → 외부 의존성 → `@/` alias를 포함한 내부 모듈 → 상대 경로 순으로 묶고 그룹 사이에 빈 줄을 둔다. 같은 그룹 안의 알파벳순이나 type 멤버 정렬은 강제하지 않는다. 선언을 합치거나 가져오는 심볼을 바꿀 필요는 없다.

CSS·초기화 코드처럼 할당 없는 부작용 import는 실행 순서가 의미를 가질 수 있으므로 이동하지 않는다. `import/order`는 이 import를 정렬 대상으로 삼지 않으며, 이를 가로질러 자동 수정할 수 없는 순서는 실행 의미를 먼저 검토한다.

타입·상수·함수·export 구획 사이에는 빈 줄을 둔다. 관련 변수 선언은 붙여 응집된 묶음으로 유지하고, 검증 → 처리 → 반환으로 단계가 바뀔 때 빈 줄을 둔다. 선언 하나마다 빈 줄을 강제하지 않는다. 타입 구획이나 변수 사이의 의미상 관계는 사람이 판단한다.

실제 `src/app/layout.tsx`는 다음처럼 지시문이 없는 서버 레이아웃에서 외부 타입, 내부 컴포넌트, 기존 위치의 CSS import, metadata, 레이아웃 함수를 구분한다. 짧은 중첩 객체도 의미가 있는 항목은 여러 줄로 표현한다.

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '흉흉 · 사건사고 지도',
    template: '%s · 흉흉',
  },
  description: '지도에서 사건사고를 살펴보고 진행 상황을 확인하는 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

## Props, 이름, JSX

`{ children: ReactNode }`처럼 단순한 Props는 함수 매개변수에 인라인으로 두어도 된다. 여러 필드와 조건이 있거나 재사용하는 복잡한 Props는 역할을 드러내는 이름의 타입으로 선언한다. 모든 컴포넌트에 별도 Props 타입을 의무화하지 않는다.

조건은 `isHome`, `showHeader`처럼 무엇을 판별하는지 드러내고, 핸들러는 수행하는 사용자 동작을 설명한다. 이름만 바꾸는 정리나 이벤트·훅 동작 변경을 형식 정리와 섞지 않는다. AppShell의 헤더 노출 조건과 shell/header 클래스 선택은 같은 함수의 이름 있는 변수로 표현한다. 기존 클래스 문자열과 DOM·오류 경계의 위치는 그대로 유지한다.

JSX는 헤더·본문·탐색 등 의미 있는 책임을 기준으로 읽히게 묶는다. 필요하면 책임 사이에 빈 줄을 두되 모든 요소 사이의 빈 줄이나 컴포넌트 추출을 강제하지 않는다. 단순한 표현식을 없애기 위한 훅·컴포넌트 분리는 하지 않는다.

## 도구와 리뷰의 역할

- Prettier: 들여쓰기, 따옴표, 줄바꿈 등 기계적인 형식을 처리한다.
- ESLint: import 그룹과 지시문/import 뒤, 함수·클래스·export·return 앞, 블록 전후, 변수 선언 묶음 뒤의 빈 줄을 검사한다. 연속 import·지시문과 연속 const/let 선언은 예외로 둔다. import 내부 그룹 간 빈 줄은 `import/order`가 담당한다.
- 사람의 리뷰: 타입·상수 구획, 검증·처리 단계, 변수 응집도, 이름, JSX 책임과 추출 필요성을 판단한다. 문법 규칙만으로 의미상 구획을 완전히 판별할 수는 없다.

새 스타일 규칙은 `src`의 제품 TS/TSX에만 적용한다. `.test.ts`, `.test.tsx`, `src/test-support`에는 기존 Next/TypeScript lint만 유지하고 새 스타일 규칙을 적용하지 않는다. 승인된 테스트·헤더·fixture는 형식 정리를 위해 수정하지 않는다.

현재 설치된 ESLint 9.39.5의 내장 `padding-line-between-statements`를 재사용한다. 이 규칙은 8.53.0부터 폐기 예정이며 설치된 규칙 메타데이터의 지원 한계는 ESLint 11.0.0이다. 향후 ESLint를 올릴 때 별도 이전 검토가 필요하다. ESLint가 안내하는 대체 규칙은 ESLint Stylistic 플러그인에 있지만 이번 변경에서는 패키지나 커스텀 플러그인을 추가하지 않는다. Next가 이미 등록한 import 플러그인을 그대로 사용한다.

## CI 검사

PR과 `dev`·`main` push에서 `app-check` workflow의 **코드 컨벤션 검사** job이 실행된다. `pnpm run lint`로 ESLint 규칙을 검사하고, `pnpm run format:check`로 코드 형식을 검사한다. 컨벤션 문서와 해당 CI 설정도 `pnpm exec prettier --check docs/code-conventions.md .github/workflows/app-check.yml`로 확인한다. 수정 없이 검사만 수행하며 규칙 위반은 실패로 표시한다.

기존 필수 체크인 **앱 lint·타입·테스트·빌드**의 lint·포맷 검사도 유지한다. 별도 컨벤션 체크를 추가하면서 기존 브랜치 보호의 필수 검사 범위를 줄이지 않는다. 로컬에서 같은 명령으로 확인한 뒤 커밋한다. 의미상 구획과 이름·책임은 계속 사람의 리뷰로 확인한다.
