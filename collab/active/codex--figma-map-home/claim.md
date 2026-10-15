---
branch: codex/figma-map-home
owner: easter721
started: 2026-10-15
status: done
goal: feat(ui): 지도 홈과 연관 화면의 Figma 디자인·인터랙션 정렬
next: PR23 리뷰·머지 및 GitHub 코멘트 문구 승인 대기
base: dev
---

## 메모
- 사용자 요청: dev 새 브랜치에서 Sobaya로 지도 홈을 완성하고 모든 공유 Figma 화면도 재조회한다.
- 지역별 고정 대표 좌표와 고유 기사 수를 사용하며 줌 클러스터와 구분한다.
- 기존 지도 SDK·내 위치·뷰포트·상세 이동·API 실패 처리를 유지한다.
- 제보 본문은 amazon7737의 report-figma-polish 소유 범위로 이번 수정에서 제외한다.
- 정확 명세·신규 테스트 초안을 준비·probe한 뒤 사용자의 승인에 따라 Sobaya 구현을 시작한다.

- 사용자 추가 지적에 따른 검색·목록·상세 시각 보정은 related-screens-addendum.md를 따른다. 승인 테스트와 기능/API 계약은 유지한다.

- 사용자 추가 요청의 절제된 인터랙션은 motion-addendum.md를 따른다. 기존 레이아웃/기능과 동작 줄이기 설정을 보존한다.

- 2026-10-15 사용자 전 과정 승인: 화면에서 겹친 여러 지역을 표시 묶음으로 합치며 확대 시 분리한다. 논리 지역·대표 좌표는 유지한다. 검색 대소문자 강조 회귀도 포함한다.
