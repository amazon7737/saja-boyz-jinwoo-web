---
branch: codex/article-list-api
owner: amazon
started: 2026-10-04
status: done
goal: feat(incidents): 기사 API를 사건 목록 페이지에 연결
next: PR #3 새 CI 결과 확인 후 외부 리뷰·dev 통합 대기
base: dev
---

## 메모
- 기사 1개를 사건 1개로 표시한다는 사용자 결정을 반영한다.
- PR #2의 검증된 목록 컴포넌트 위에 쌓는 후속 브랜치다. 기존 승인 입력과 완료 기록은 보존한다.
- 기사 발행 시각을 사건 발생 시각으로 바꾸지 않고, API에 없는 분류·상태·위치·타임라인을 만들지 않는다.
- 공용 필터/UI, 상세 페이지, 제보 페이지는 이번 범위에서 제외한다.
- 사용자 승인 기준선 7f05d14에서 8개 항목 구현, 전체 gate 및 독립 완료 리뷰를 마쳤다.
- 2026-10-04 완료: 실제 /incidents에 기사 API를 연결했다. 전체 21개 테스트, format/lint/typecheck/build, 최종 gate와 6c17ea0 독립 완료 리뷰 PASS. 상세 증거는 verification.md.
- Figma 카드 배치·80px 이미지·단일 16px 여백을 반영했다. 공용 폰트·배지·헤더는 범위 밖이며, ready 이미지의 파일 404 시 자동 대체 표시는 후속 개선 사항이다.
- 2026-10-05 PR #2의 squash 통합(dd4515e)을 dev merge로 반영했다. 기존 승인·구현 이력을 보존하며 소스와 테스트는 변경하지 않았다. 이번 승인은 PR #3 브랜치 갱신과 CI 확인까지이며 dev로의 PR 병합은 포함하지 않는다.
