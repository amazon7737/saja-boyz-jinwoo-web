---
branch: codex/brand-location
owner: easter721
started: 2026-10-17
status: active
goal: feat(map): 브랜드 아이콘과 첫 진입 내 위치 자동 이동 적용
next: src/app 아이콘·메타데이터, 지도 첫 진입 위치 요청·뷰포트 복원과 회귀 테스트
base: dev
---

## 메모
- 최신 origin/dev e555169 기반. 사용자 요청: 브랜드 파비콘·관련 아이콘, 최초 지도 접속 시 위치 권한 요청과 내 위치 이동.
- 기존 원본 dev의 next-env.d.ts 변경과 이전 브랜치의 소바야 승인 상태를 보존하기 위해 새 워크트리에서 작업한다.
- 현재 활성 편집 충돌·관련 열린 PR 없음. 사용자 위치를 별도 저장·전송하지 않고 기존 지도 SDK와 위치 버튼의 복구 동작을 사용한다.

