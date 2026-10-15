# 손상 Unicode 초안 재현

2026-10-11 · 제품 HEAD 963b591f1276cdff67dd885fb3da80d253ad8fd8.

- 기존 45개 테스트·Format·Lint의 최종 gate가 통과한 뒤 Astra 독립 리뷰가 저장된 고립 surrogate의 URL 인코딩 오류를 발견했다. review_pending이며 기능 완료가 아니다.
- unicode-test-proposal.md의 정확 새 테스트를 임시 복사본에만 추가해 해당 이름으로 실행했다. URIError: URI malformed가 recent-searches.tsx:76의 encodeURIComponent에서 발생했다. 테스트가 실행된 실제 행동 실패이며 문법·의존성 오류가 아니다.
- 해당 초안을 포함한 tsc --noEmit --incremental false는 통과했다. 실제 앱의 승인 명세·테스트는 아직 변경하지 않았다.
- 소스 수정과 새 회귀 테스트는 사용자 승인 후 sobaya로 진행한다. 전체 기준은 기존 45개 유지 + 신규 1개 = 46개다.
