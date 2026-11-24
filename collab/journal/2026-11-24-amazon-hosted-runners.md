# ci/hosted-runners · amazon · 2026-11-24
- claim: collab/active/ci--hosted-runners/claim.md

## 이벤트
- changed .github/workflows/app-check.yml, .github/workflows/harness-check.yml, .github/workflows/sobaya-upstream.yml 모든 job 의 runs-on 을 poem-public 에서 ubuntu-latest 로 바꿈 (job name 은 그대로) → 필수 검사 이름은 변하지 않는다. poem-public 러너를 전제한 설정을 새로 만들지 말 것
- removed .github/workflows/sobaya-upstream.yml gh CLI 설치 단계 → hosted 이미지에 gh 가 있어 필요 없다
- rule 공개 저장소 CI 는 GitHub-hosted 러너(ubuntu-latest)에서 돈다 → 새 워크플로도 runs-on: ubuntu-latest 를 쓸 것

## 남은 것
- 이 PR 의 검사가 실제로 보고되는지는 병합 전 GitHub 에서 확인해야 한다. 로컬에서는 같은 명령만 돌렸다.
- dev→main 통합 PR 이 나가야 main 의 워크플로도 바뀐다.
