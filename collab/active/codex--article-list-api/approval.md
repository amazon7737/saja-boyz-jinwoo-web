# 기사 API 연결 승인 기록

2026-10-04 조정 채팅에서 전체 검토본과 명세를 본 사용자가 새 API 연결 명세·테스트 8개·실행 설정·Sobaya 기준선 기록을 명시적으로 승인했다. 전달된 음성 승인: “그래. 진우 쪽에 그 승인해도줘”.

- 승인 대상 커밋: `3d38a256c3b670e11f3b69ccbfe4f9bd836c21eb`.
- `review.md` SHA-256: `3318c5d222c01b58c75e272734eb230911315f95338203180d0bf4e6c9cccca8`.
- `spec.proposal.md` SHA-256: `51a08bf52a1bb9aab042bb46b70b7e64b2fe989592b0007a8adcde629d97d3dc`.
- `failed-test.draft.md` SHA-256: `f2ac51f00dc56c9e73cc90b6c5a862bbcdaf15ef749d60ab35146e25704a76c5`.
- `support.proposal.md` SHA-256: `a7c81f1436e3df6adff95814165c1ad55bd1d6f653f03ff7e4bfe864cd0cbbc0`.

각 해시를 로컬 커밋 파일과 대조했다. 명세·계획은 원문 그대로 각각 `spec.md`, `failed-test.md`로 복사하며 제안 문서의 역사적 “초안/승인 전” 표기는 바꾸지 않는다. 그 상태 설명은 이 승인 기록으로 대체한다. 지원 설정은 승인된 코드 블록 그대로 `vitest.config.ts`에 적용한다.

기존 13개 테스트와 이전 목록 컴포넌트의 계약, 공용 필터/UI는 보존한다. 기존 목록 PR의 병합 권한이나 배지 색상·전역 폰트 수정 권한으로 확대하지 않는다. 작업은 새 작업 트리의 별도 기준선과 항목별 검증을 사용한다.
