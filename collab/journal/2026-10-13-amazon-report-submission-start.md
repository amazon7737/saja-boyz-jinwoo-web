# 실제 제보 접수 담당 선언

2026-10-13 · @amazon · codex/report-submission

## 이벤트

- touching src/app/report/ 사용자가 실제 제보 접수 후속을 amazon에 배정함 → 기존 PR #15의 폼을 재사용하며 별도 접수 API 연결을 준비한다.
- added collab/active/codex--report-submission/claim.md 프런트 전송·응답과 Go 서버 접수·저장·첨부 계약의 담당을 선언함 → 같은 제보 접수 기능을 중복 착수하지 않는다.
- rule docs/report-submission-contract.md 이 브랜치에서 계약·실행 테스트 초안을 준비함 → 승인 전 초안을 운영 API 보장으로 해석하지 않는다.

## 남은 것

- 익명/로그인·첨부 범위를 확인하고 접수 계약·저장 구조·오류 및 재시도 정책을 검토 가능한 초안으로 만든다.
- 정확한 신규/대체 테스트 검토와 승인 후 구현한다. 기존 테스트·보관 명세·솔피의 지도/검색 담당은 유지한다.
