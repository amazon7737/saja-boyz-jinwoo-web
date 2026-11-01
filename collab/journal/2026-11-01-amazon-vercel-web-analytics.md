# codex/vercel-web-analytics · amazon · 2026-11-01
- claim: collab/active/codex--vercel-web-analytics/claim.md

## 이벤트
- dep package.json @vercel/analytics2.0.1과 pnpm 잠금 추가 → npm 잠금 파일을 추가하지 않고 기존 pnpm 사용
- changed src/app/layout.tsx Next.js Analytics를 RouteShell 밖의 루트 body에 한 번 배치 → 화면별 Analytics 중복 배치 금지
- changed docs/vercel-deployment.md 대시보드 활성화 후 배포·실제 수집 확인 절차 추가 → 로컬 SDK 명령 검증을 운영 수집 완료로 해석하지 말 것

## 남은 것
- dev 대상 PR 검토·머지 후 Vercel에 변경 포함 배포. 사용자가 활성화한 프로젝트의 대시보드에서 실제 수집 확인 필요.
- 로컬 브라우저는 실제 SDK와 테스트 스크립트 수신기를 사용했다. Vercel로 분석 이벤트를 전송하지 않았으며 운영 배포도 실행하지 않았다.
