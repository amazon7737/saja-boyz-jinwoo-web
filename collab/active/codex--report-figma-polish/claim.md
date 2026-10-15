---
branch: codex/report-figma-polish
owner: amazon
started: 2026-10-15
status: done
goal: style(report): 피그마 제보 화면의 필드와 제출 영역 마감
next: dev 대상 PR 리뷰·병합 대기, 검증은 verification.md 참조
base: dev
---

## 범위와 재사용

- 사용자 요청: 최신 diff에서 다음 담당 작업을 찾아 진행. 최신 dev 119172a와 PR19의 화면별 검증을 확인했다. docs/work-split.md의 기존 amazon 담당 제보 화면과 visual-verification.md의 미완료 본문 디자인을 이번 한 범위로 선택한다. 새 배정을 받은 것으로 기록하지 않는다.
- Figma 11:2221의 고해상도 컨텍스트와 렌더를 직접 확인했다. 공통 폰트·흰 전용 shell은 PR19 구현을 재사용한다. 기존 ReportPage 상태·필수 입력·첨부·서버 전송·60초 제한·멱등 재시도·오류 복구는 보존한다.
- 헤더/필드/위치 아이콘/업로드/하단 제출 배치만 맞춘다. 지도·검색·공용 컴포넌트·API·서버·배포 설정·명세 파일을 바꾸지 않는다. 브라우저 native 날짜 선택, 한국시간 표시, 비공개 접수 안내와 실제 오류/성공 상태는 유지한다. Figma의 기기 상태바는 제품에 넣지 않는다.
- 같은 영역의 동료 미커밋 편집이나 활성 구현 claim은 발견되지 않았다. 새 deps나 재사용 불가능한 제보 폼 복제본은 만들지 않는다.
