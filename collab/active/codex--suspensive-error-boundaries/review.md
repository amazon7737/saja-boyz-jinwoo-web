# 구현 전 정확 입력 검토

1. spec.proposal.md: 실제 적용 범위와 기존 동작 보존.
2. failed-test.draft.md: 공통 헤더와 테스트 3개 전체.
3. support.proposal.md 및 support의 package/lock 전체: Suspensive 3.21.4만 직접 의존성에 추가.

## 오류 종류와 경계
- FeatureError(network/configuration/invalid-response): shouldCatch={FeatureError}로 해당 오류만 잡고 안전한 안내를 제공한다. fallback과 onError는 reason을 타입 단언 없이 읽는다.
- 미지정 렌더링 오류: 상위 일반 경계로 전파하고 안전한 공통 안내를 제공한다.
- Next.js 서버/라우트 오류: error.tsx 및 global-error.tsx로 처리한다. 서버에서 class 타입이 그대로 보존된다고 가정하지 않는다.
- 예상 API 실패: 기존 서버 try/catch와 안전한 alert·재시도 링크 유지. 이미지 실패: PR #4의 onError 유지.

## 검증 한계
초안 probe는 현재 오류 경계 모듈 부재를 assertion으로 확인해 RED가 됐다. 실제 shouldCatch 처리·복구·Next.js 경계의 GREEN 검증은 승인 후 구현 단계에서 수행한다. RED는 테스트 기대 자체가 옳다는 증명이 아니다.

## 승인 요청
위 명세·정확 테스트·정확 의존성 지원안을 승인하면 루트 plan으로 그대로 반영하고 Sobaya approve/loop/gate/독립 리뷰 후 dev PR을 만든다. 기존 루트의 untracked spec.md와 failed-test.md는 이전 작업 입력이므로 이 승인안과 혼동하지 않는다. 새 입력 적용 전 기존 파일은 별도 보존한다.
