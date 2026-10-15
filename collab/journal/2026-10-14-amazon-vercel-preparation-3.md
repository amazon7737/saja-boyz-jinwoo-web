# codex/vercel-preparation · amazon · 2026-10-14
- claim: collab/active/codex--vercel-preparation/claim.md

## 이벤트
- supersedes collab/journal/2026-10-14-amazon-vercel-preparation-2.md 계정·연결 방식 선택 대기 상태 → 사용자가 개인 fork의 Hobby 배포를 승인했고 후속 배포를 완료함.
- added docs/vercel-deployment.md 개인 fork `amazon7737/saja-boyz-jinwoo-web`의 dev `20b9471`을 기존 Hobby 계정의 `saja-boyz-jinwoo` 프로젝트에 CLI 배포함 → https://saja-boyz-jinwoo.vercel.app/incidents 에서 뉴스 화면을 확인할 것.
- rule docs/vercel-deployment.md 원본 PR 병합만으로 개인 fork나 공개 사이트가 갱신되지 않음 → fork dev 동기화와 실제 배포 SHA 확인을 각각 수행할 것.
- done collab/active/codex--vercel-preparation/deployment.md 원격 빌드 READY·주요 경로 HTTPS 200·실제 브라우저 뉴스/이미지/검색/상세 이동을 확인함 → 지도와 실제 제보까지 완료된 것으로 오인하지 않을 것.

## 남은 것
- GitHub 앱 설정에 패스키 본인 인증이 필요해 사용자에게 인증을 요청함. 현재 Vercel 프로젝트의 Git 연결은 비어 있으며 push 자동 배포는 미설정. 인증 후 기존 프로젝트에 개인 fork만 연결하고 Production Branch를 dev로 지정할 것.
- 지도 Client ID 또는 기존 저장 위치를 사용자에게 요청함. 실제 프런트 env 파일에서는 찾지 못했으며 뉴스 검색 ID와 혼용하지 않을 것. 지도 도메인 등록과 재배포 후 지도 타일·위치 권한을 검증할 것.
- PR #16과 Go 제보 API 운영 배포가 남아 있으므로 현재 제보는 입력 준비 화면. 조직 원본 main/dev, OCI 서버, 결제 플랜은 변경하지 않았음.
