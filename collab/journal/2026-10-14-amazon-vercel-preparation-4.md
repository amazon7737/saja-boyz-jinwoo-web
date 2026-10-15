# codex/vercel-preparation · amazon · 2026-10-14
- claim: collab/active/codex--vercel-preparation/claim.md

## 이벤트
- supersedes collab/journal/2026-10-14-amazon-vercel-preparation-3.md GitHub 패스키·지도 키 대기 상태와 이전 공개 주소 → 개인 fork Git 연결·Production Branch dev 설정·지도 키 반영 후 재배포와 실제 지도 표시를 완료함.
- changed docs/vercel-deployment.md 현재 공개 주소는 https://hyunghyung.vercel.app 이며 이전 saja-boyz-jinwoo.vercel.app 주소는 404를 반환함 → 실제 프로젝트 도메인과 새 링크를 사용할 것.
- done collab/active/codex--vercel-preparation/map-deployment.md dev 20b9471의 Git 소스 배포 READY·지도 타일·목록 왕복·새로고침을 확인하고 기존 일 1,000회 한도를 유지함 → 최초 CLI 배포의 키 누락 기록과 이번 완료 상태를 구분할 것.
- rule docs/vercel-deployment.md Ncloud 허용 도메인과 현재 Vercel 프로젝트 도메인을 일치시켜야 함 → 배포 메타데이터의 과거 alias 목록만으로 현재 주소를 판단하지 않을 것.

## 남은 것
- Git 연결은 완료됐지만 이번 배포는 API로 요청한 Git 소스 빌드다. 다음 fork dev 갱신 시 실제 push 자동 배포와 SHA 일치를 확인할 것. 원본 PR 병합만으로 fork가 갱신되지는 않음.
- 위치 권한 허용·거부와 모바일 실기기 흐름은 이번 실서버 세션에서 검증하지 않음.
- PR #16과 Go 제보 API 운영 배포는 별도이며 실제 제보는 아직 비활성. 키 값·.env는 Git에 넣지 않았고 OCI·결제 플랜은 변경하지 않음.
