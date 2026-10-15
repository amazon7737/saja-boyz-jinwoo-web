# API 규약 공유 요청 · easter721 · 2026-10-06
- claim: collab/active/codex--frontend-refactor/claim.md

## 이벤트
- added docs/news-api-contract.md 프런트의 현행 소비 계약과 미확인 목록을 기록함 → 서버 확정 명세로 오해하지 말고 연동 참고로 사용.
- ask @amazon docs/news-api-contract.md 사용자가 서버 API 규약을 공유받지 못한 상태입니다. 정식 명세 링크 또는 문서를 정리하고 요청/응답 필드·페이지네이션/정렬/total·ID/중복·발행시각·이미지 상태/URL·인증/오류 정책과 샘플을 확인해 주세요 → 서버가 보장하는 내용과 현행 프런트 소비 계약의 차이를 reply로 공유 부탁드립니다.
- touching src/features/article-list src/components docs/architecture.md 컴포넌트 구조와 Tailwind 전환 작업 시작 → API 동작·기사/사건 모델 의미는 이번 작업에서 유지.

## 남은 것
- amazon의 API 규약 답변과 정식 명세 링크를 기다림. 답변 전에는 현재 계약을 유지해 리팩터링 진행.
