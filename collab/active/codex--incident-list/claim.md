---
branch: codex/incident-list
owner: amazon
started: 2026-10-02
status: done
goal: feat(incidents): 사건 목록·카드·빈 결과·로딩 구현
next: dev 대상 PR 검토; 라우트·URL 필터·API 연결은 후속 범위
base: dev
---

## 메모
- 사용자 승인 분담에 따라 amazon 담당 사건 목록부터 시작한다.
- 승인된 여섯 목록 항목과 Figma 스타일을 구현했다. 전체 13개 테스트·빌드·브라우저 확인·최종 gate·독립 review를 통과했다.
- ID 예외 처리도 사용자 승인 후 완료했다. 검증된 HEAD는 22e9220371c886ff931ff856bd779acfe0a2a299이며 마지막 plan 보관 커밋은 소스를 변경하지 않는다.
- 공용 UI·필터 URL 어댑터·지도·검색은 easter721 담당을 유지한다.
- 기존 Incident 타입을 사용한다. 실제 뉴스 API·제보 저장·인증은 이번 범위에서 확정하지 않는다.
- 공용 기반 인수 전에는 목록 본문을 독립적으로 검증한다. 샘플 데이터는 실제 사건과 구별한다.
- /incidents 라우트와 loading.tsx, URL 필터·API 연결은 후속 범위다.
