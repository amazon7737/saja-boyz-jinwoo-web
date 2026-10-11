# 기사 목록 더 보기 초안

## 이벤트

- added collab/active/codex--article-list-pagination/ 목록 더 보기의 명세·정확 테스트 3개·검토 주석본과 행동 RED 근거를 준비함 → 기존 목록/검색/서버 제품 코드는 그대로이며 초안 승인 후 목록 영역만 구현할 예정.
- rule src/features/article-list/ PR #11의 공용 조회 함수와 원본 offset/total 계약을 재사용함 → 검색 페이지네이션이나 공용 API 변경을 중복 구현하지 않음.

## 남은 것

- 사용자에게 review.ko.md의 명세·헤더·테스트 3개를 제시하고 정확한 기준의 승인을 받아야 한다. 현재 claim은 active이며 harness 승인 상태는 만들지 않았다.
- 첫 샌드박스 suite는 loopback EPERM으로 기존 Chrome 테스트가 실패했다. 같은 58개 suite를 실행 가능한 환경에서 다시 실행해 통과했다. 제품·테스트·시간 제한 변경 없음.
- 승인 후 전체 suite checkpoint·타입/빌드·Chrome·최종 gate·독립 리뷰 및 dev 대상 PR까지 진행한다. 구현 승인 전 spec.md/failed-test.md나 제품 코드를 변경하지 않는다.
