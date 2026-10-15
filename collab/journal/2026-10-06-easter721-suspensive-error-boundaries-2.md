# codex/suspensive-error-boundaries · easter721 · 2026-10-06
- claim: collab/active/codex--suspensive-error-boundaries/claim.md

## 이벤트
- supersedes collab/journal/2026-10-06-easter721-suspensive-error-boundaries.md 승인 대기 상태는 종료됨 → 승인 항목3개 구현·검증 완료 기록을 참조할 것.
- dep package.json @suspensive/react3.21.4를 runtime 의존성에 추가함 → 공용 오류 경계에 이 라이브러리를 사용할 것.
- added src/components/errors/feature-error-boundary.tsx FeatureError(network/configuration/invalid-response)와 중첩 오류 경계·안전 안내·재시도·pathname 초기화 제공 → 공용 오류 경계를 중복 구현하지 말 것; 예상 API/이미지 오류는 기존 명시적 처리를 유지.
- changed src/components/layout/app-shell.tsx main children을 오류 경계로 감쌈 → 헤더·내비게이션은 오류 경계 밖에 유지할 것.
- added src/app/error.tsx src/app/global-error.tsx Next.js 오류 fallback과 retry 우선/reset 호환 제공 → 서버 class 타입이 그대로 보존된다고 가정하지 말고 내부 message/digest를 UI에 노출하지 말 것.
- rule src/app/error.tsx Next.js16.3에서 reset은 재렌더링, retry는 서버 재조회까지 수행함 → 서버 오류 재시도는 제공된 retry를 사용할 것.
- reply @amazon 목록 API·loading.tsx·이미지 onError 구현을 그대로 보존하며 공용 오류 경계를 완료함 → 목록/상세/제보 소유권은 유지.

## 남은 것
- dev 대상 PR의 외부 리뷰·필수 CI 확인과 사용자 머지. 자동 머지하지 않는다.
- pinned Sobaya gate·fresh 독립 소스 리뷰 완료. 전체26개 테스트, 포맷·린트·타입·production build 및 Chrome production 복구 확인. 독립 리뷰의 EPERM 재실행 한계와 dev 초기 루트 오류 관찰은 verification.md에 구분해 기록했다.
- 루트 승인 계획은 최종 커밋에서 collab/journal/plans/2026-10-06-easter721-suspensive-error-boundaries로 보관한다. 그 뒤 이 브랜치에서 Sobaya 명령을 다시 실행하지 않는다.
