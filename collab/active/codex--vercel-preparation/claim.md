---
branch: codex/vercel-preparation
owner: amazon
started: 2026-10-14
status: done
goal: docs(deploy): 개인 fork의 Vercel Hobby 배포와 운영 연결 절차 정리
next: Review PR 17; verify a push-triggered build on the next intentional fork dev update. Live map deployment at hyunghyung.vercel.app is verified; report intake remains separate.
base: dev
---

## 메모
- Initial scope was deployment preparation. On 2026-10-14 the user additionally authorized a personal GitHub fork and deployment to the existing Vercel Hobby account. OCI remains unchanged.
- Personal fork: amazon7737/saja-boyz-jinwoo-web; its default branch is dev at 20b9471. Do not merge upstream PRs or alter upstream branch settings for this deployment.
- PR #16 is still open. Report intake requires its merge and the separately deployed Go reports API before activation.
- Use the current user-authorized Canon TDD workflow; no product behavior changes or spec.md edits are planned.
