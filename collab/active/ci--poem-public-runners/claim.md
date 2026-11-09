branch: ci/poem-public-runners
owner: amazon
started: 2026-11-09
status: done
goal: ci: 같은 저장소 이벤트를 self-hosted poem-public 러너에서 실행
next: PR 리뷰·병합 뒤 운영자가 비활성화한 워크플로를 다시 켠다.
base: main
---

## 범위
- GitHub-hosted 러너가 2026-12-01까지 막혀 있어, 같은 저장소 이벤트의 job을 조직 러너 그룹 poem-public으로 보낸다.
- 포크 PR은 계속 ubuntu-latest에서 돈다. 앱·하네스 코드는 바꾸지 않는다.
