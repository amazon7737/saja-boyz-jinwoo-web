# 실제 제보 접수 계약 및 테스트 검토안

2026-10-13 · @amazon · codex/report-submission

## 이벤트

- supersedes collab/journal/2026-10-13-amazon-report-submission-start.md 익명/로그인·첨부 선택 대기 기록 → 사용자가 익명 접수 + 첨부 저장을 선택했다.
- added docs/report-submission-contract.md 익명 비공개 접수·Go 직접 multipart·저장 완료 후 접수번호·같은 내용 재시도 키 계약 초안 → 실제 운영 API나 승인 완료 계약으로 소비하지 않는다.
- added docs/drafts/report-submission/ 기존 로컬 확인 테스트 4개 교체 및 첨부 2개 보존안, 신규 동작 9개 실행 초안과 한국어 주석 검토본 → 사용자 승인 전 기존 테스트를 바꾸거나 구현하지 않는다.
- rule collab/active/codex--report-submission/claim.md 실제 제보 접수는 amazon이 담당하고 서버 codex/report-intake와 함께 진행함 → 지도·검색·기존 기사 API 작업과 중복 착수하지 않는다.

## 검증

- 신규 후보 9개 assertion RED, 보존할 첨부 2개 GREEN. 초안 전체 TypeScript·ESLint 통과. 검토 주석 제거 후 12개 원본 블록 바이트 일치.
- 독립 초안 리뷰에서 길이 초과 전송 방지, 전체 입력 유지, 첨부만 수정한 재시도, JSON 파싱 실패, 비한국 시간대, 설정별 mount를 보완했다.
- 협업 검사 규칙 위반 없음. 오래된 product-gap-audit/project-foundation 브랜치의 공용 파일 겹침 안내가 있으나 현재 동시 편집 없음. 이 브랜치의 변경은 담당 선언·계약·검토 문서뿐이다.

## 남은 것

- 사용자에게 서버·프런트 계약과 정확한 테스트 입력, 기존 로컬 전용 기준선 교체 및 명세 채택 승인을 받는다.
- 승인 후 서버 → 프런트 순서로 하네스 검증·실제 브라우저 업로드·독립 완료 리뷰를 수행한다.
- PR #15는 선행 UI다. 이 브랜치는 codex/report-form 위에 있으며, 검토 초안 게시를 기능 구현 완료나 운영 활성화로 집계하지 않는다.
