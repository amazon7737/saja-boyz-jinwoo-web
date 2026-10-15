---
branch: codex/article-image-fallback
owner: amazon
started: 2026-10-05
status: done
goal: fix(incidents): 기사 이미지 로딩 실패 시 대체 표시
next: 이미지 실패 처리 완료; dev 대상 PR 외부 리뷰 대기
base: dev
---

## 메모
- PR #3의 완료 소스 7a2672a 위에 쌓는 후속 브랜치다. 이전 승인 상태·8개 API 테스트·13개 기존 테스트는 보존한다.
- 이미지 로딩 실패 시 기존 80×80 ‘이미지 없음’ 표시로 바꾸고 기사 정보·원문·접근성을 유지하는 최소 범위다.
- 2026-10-05 사용자가 정확한 명세·테스트 2개·jsdom 지원안을 승인했다. approval.md에 기록하고 고정된 기준선으로 진행한다.
- 2026-10-05 원격 확인: PR #2·#3 모두 외부 승인 뒤 dev에 squash 병합됐다. dev@3af4459를 merge로 반영했으며 기존 기능 소스 차이는 없다.
- 공용 필터·UI·URL 어댑터는 솔피 담당이다. 더 보기·상세·제보·수집·배포는 준비 문서에서 확정 사항과 미정 사항을 구분한다.
- 테스트 DOM 환경에 새 개발 의존성이 필요하면 package.json·pnpm-lock.yaml 지원안을 별도 파일로 제시한다. 승인 전 실제 패키지 설정은 변경하지 않는다.

- 2026-10-05 완료: 두 승인 항목 RED→GREEN, 전체23개·format/lint/typecheck/build·실제404/손상 이미지·desktop/mobile 검증 PASS. 독립 리뷰7d020f2 추가 지적 없음. 승인 plan 보관 후 이 브랜치의 Sobaya 실행은 종료한다.
