# DOM 시험 지원 변경 제안

아직 승인 전이며 실제 앱 package.json·pnpm-lock.yaml·vitest.config.ts는 변경하지 않았다. 격리 임시 복사본에만 설치해 실행 가능성을 검증한다.

- package.json의 devDependencies에 정확 버전 `jsdom: 27.4.0` 한 항목을 추가하는 안이다. production dependencies·기존 scripts·Node >=24 <25·pnpm10.34.6·Vitest5.0.3 버전은 그대로다.
- jsdom27.4.0은 Node `^20.19.0 || ^22.12.0 || >=24.0.0`을 지원한다. 앱의 Node24 계약 범위를 좁히지 않으며 실제 probe는 Node24.19.0에서 실행한다.
- 잠금 파일은 pnpm10.34.6이 생성했다. 기존 패키지 버전 교체 없이 jsdom과 전이 의존성, Vitest의 선택적 jsdom peer 연결만 추가한다. 전체 변경은 [support.patch](support.patch), 완성본은 [package.json.proposed](support/package.json.proposed)와 [pnpm-lock.yaml.proposed](support/pnpm-lock.yaml.proposed)다.
- 새 테스트 파일 헤더의 `// @vitest-environment jsdom`만 해당 파일 환경을 바꾼다. 기존 `vitest.config.ts`와 기존 테스트21개는 그대로다. React Testing Library·브라우저 설치·전역 test setup은 추가하지 않는다.
- 공통 준비 코드는 `failed-test.draft.md`의 유일한 헤더다. 실제 createRoot/act로 DOM을 mount·error·rerender·unmount하며 ArticleList·Next/Image·React 상태를 mock하지 않는다.
- 실제 네트워크·CSS 레이아웃은 jsdom이 검증하지 못한다. 404와 80px 화면은 별도 실제 브라우저 증거와 구현 후 확인으로 보완한다.
- package/lock은 협업 허브 파일이다. 최신 digest에서 동료 편집 충돌은 없었다. 정확한 지원안 승인과 적용 직전에 다시 확인하고 이 두 파일의 지원 변경을 기능 구현과 구분해 기록한다.
