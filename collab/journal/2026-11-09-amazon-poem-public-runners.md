# ci/poem-public-runners · amazon · 2026-11-09
- claim: collab/active/ci--poem-public-runners/claim.md

## 이벤트
- changed .github/workflows 같은 저장소 이벤트의 job은 self-hosted poem-public(linux/arm64, Docker 없음, gh·Node 미설치)에서 돈다 → 새 job은 필요한 도구를 setup 액션이나 설치 단계로 직접 준비할 것.

## 남은 것
- 병합 뒤 운영자가 워크플로를 다시 켜고 첫 실행 결과를 확인한다.
