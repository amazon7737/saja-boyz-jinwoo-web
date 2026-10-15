branch: codex/frontend-refactor
owner: easter721
started: 2026-10-06
status: done
goal: refactor(frontend): 컴포넌트별 구조 정리와 Tailwind 전환
next: dev 대상 PR 리뷰 및 amazon API 규약 답변 대기
base: dev
---
## 범위
- 컴포넌트별 폴더, 기사 API·표시 로직·오류 모델 분리 및 Tailwind 전환. 기존 동작 유지.
- 테스트 기대값·본문 유지, 파일 위치와 import 경로만 새 구조에 맞춘다.
- API 현행 소비 계약과 미확인 사항 문서화 및 amazon에게 규약 문서화 요청.
- 기사/사건 모델 통합, API 오류 정책 변경, 신규 기능 및 공통 API 프레임워크 도입 제외.
