---
owner: amazon
branch: ci/main-upstream-sync
date: 2026-10-15
---

## 이벤트
- added .github/workflows/sync-upstream-main.yml 조직 main의 app-check 성공만 fork main으로 동기화하는 15분 주기 workflow → dev 운영 배포에 사용하지 않는다.
- added scripts/sync-upstream-main.sh 변경 없음·CI 대기/실패 시 무변경, 충돌 시 abort → 강제 push로 자동 해결하지 않는다.
- rule docs/main-autodeploy.md 기존 운영 dev 배포는 다음 main 릴리스까지 유지 → 자동화 설정 검증을 위해 과거 main을 재배포하지 않는다.

## 검증
- 격리된 로컬 Git 저장소에서 변경 없음, 실패 CI, 진행 중 CI, 성공 main 병합, 중복 실행, 충돌 abort 6개 시나리오 통과.
- bash -n, Prettier workflow/문서 검사, git diff --check 통과.
- 운영 애플리케이션 코드는 변경하지 않았으며 전체 앱 빌드 결과는 PR CI에서 확인한다.

## 남은 것
- 전용 SSH 쓰기 키 생성·GitHub environment secret 등록은 자동 승인 검토가 별도 사용자 승인을 요구해 실행되지 않았다.
- production-sync environment의 main 전용 정책, 키/secret 설정 후 PR 병합 및 fork 기본 브랜치 main 전환이 필요하다.
- 최초 workflow 실행은 이미 포함된 조직 main을 확인하고 배포 없이 종료해야 한다.
- 실제 main 릴리스에 따른 Vercel Ready/운영 응답 검증은 아직 수행하지 않았다.
