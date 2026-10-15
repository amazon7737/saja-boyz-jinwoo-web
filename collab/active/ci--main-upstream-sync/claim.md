---
branch: ci/main-upstream-sync
owner: amazon
started: 2026-10-15
status: done
goal: ci(deploy): 조직 main 기준 fork 동기화와 운영 자동배포 구성
next: .github/workflows/sync-upstream-main.yml, scripts/sync-upstream-main.sh, docs/main-autodeploy.md
base: main
---

## 메모
- 사용자 요청: dev가 아니라 조직 main 최종 병합분만 운영 반영.
- 별도 클론에서 배포 설정만 수정하며 다른 작업 체크아웃은 건드리지 않는다.
- 기존 운영 배포를 과거 main으로 되돌리지 않는다.
