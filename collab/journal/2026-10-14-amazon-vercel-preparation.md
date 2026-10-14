# codex/vercel-preparation · amazon · 2026-10-14
- claim: collab/active/codex--vercel-preparation/claim.md

## 이벤트
- added docs/vercel-deployment.md Vercel의 Node 24·고정 pnpm·환경변수·지도 도메인·제보 CORS와 검증 절차를 정리함 → 배포할 때 이 가이드와 현재 브랜치 상태를 확인할 것.
- changed .gitignore .vercel/을 Git에서 제외함 → 프로젝트 연결 정보와 내려받은 환경 파일을 커밋하지 않을 것.
- rule 운영 소스는 dev Preview 검증 후 dev → main 별도 통합 PR로 확정함 → 현재 main에는 PR #1~#15가 없으므로 기본 Import를 최신 운영 배포로 간주하지 않을 것.
- rule PR #16은 아직 미병합이고 운영 OpenAPI에는 /reports가 없음 → 프런트 병합·Go 재배포·origin/영속 저장소 준비 이후 제보 접수 환경변수를 활성화할 것.
- done collab/active/codex--vercel-preparation/completion.md 현재 dev의 70개 테스트·Turbopack 빌드·실제 운영 뉴스 브라우저 조회를 확인함 → 검증 근거와 미검증 외부 설정을 구분해 인수할 것.

## 남은 것
- Vercel 계정·프로젝트 확정과 Git 연결, 환경변수 등록, dev Preview 배포. 이번 작업은 저장소 준비까지이며 배포/프로젝트 생성은 하지 않음.
- 생성된 실제 Preview·운영 주소를 네이버 Maps Web 서비스 URL에 등록하고 지도 인증 확인.
- 제보를 운영 제공할 경우 PR #16 병합, OCI 제보 API 재배포·활성화, 정확한 origin CORS와 영속 저장소 확인.
- 최신 dev를 main으로 통합하는 별도 PR과 운영 배포.
