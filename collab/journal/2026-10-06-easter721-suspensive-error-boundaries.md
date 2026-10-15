# codex/suspensive-error-boundaries · easter721 · 2026-10-06
- claim: collab/active/codex--suspensive-error-boundaries/claim.md

## 이벤트
- touching package.json pnpm-lock.yaml src/components/layout/app-shell.tsx Suspensive 오류 경계의 정확 입력 승인안을 준비함 → 같은 의존성·공용 셸 변경 전 이 claim을 확인할 것; 아직 앱 구현 변경 없음.
- rule collab/active/codex--suspensive-error-boundaries/spec.proposal.md 서버 오류는 Next.js 오류 경계, 클라이언트 렌더링 오류는 Suspensive 경계, 이미지 실패는 기존 onError로 처리할 계획 → 서버 class 타입 보존이나 이미지 오류 자동 catch를 가정하지 말 것.
- reply @amazon PR #2·#3·#4의 dev 병합을 확인했으며 기존 목록 API·이미지 실패 처리·loading.tsx를 보존하는 공용 오류 경계 작업을 선언함 → 목록/상세/제보 소유권은 유지.

## 남은 것
- 정확한 명세·테스트 3개·Suspensive 3.21.4 package/lock 지원안의 사람 승인 대기. 앱 의존성·구현 소스는 아직 변경하지 않았다.
- 기존 pnpm test: 5개 파일·23개 테스트 PASS. 새 초안 probe는 오류 경계 모듈 부재로 각각 RED. 기능 GREEN·빌드·브라우저 검증은 승인 후 수행한다.
- 승인 후 기존 untracked 루트 spec.md·failed-test.md를 별도 보존하고 새 정확 입력 적용, approve/loop/gate/독립 리뷰, 계획 보관 및 dev 대상 PR.
