# 초안 검증

2026-10-11 · 신규 4개 테스트를 각각 sobaya probe로 검사했다. 전체 초안의 TypeScript 검사도 통과했다.

- searchPageRequestValidatesOffsetAndRetainsRawTotal: total 누락으로 assertion RED.
- 나머지 3개: 실제 SearchPage에 더 보기 버튼이 없어 assertion RED. 모듈 누락이나 도구 오류가 아니다.
- 기존 54개 테스트와 helpers·fixtures·전체 명령을 변경하지 않았다. 초안은 사용자 전과정 승인 범위의 행동을 고정하며 구현은 sobaya가 한다.
