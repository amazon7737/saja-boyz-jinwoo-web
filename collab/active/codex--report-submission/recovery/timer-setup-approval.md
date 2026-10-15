# 초기 렌더 타이머 분리 교체 승인

2026-10-13 · 사용자 명시 승인: **한 줄 수정과 승인 기준 교체 허용**.

- 승인 질문: 제보 테스트 준비 함수에 `await advance(1);` 한 줄을 추가하고 승인 기준을 교체하는 요청. 제품 소스·6개 본문·60초 제한·타이머 0개 검사는 유지한다.
- 승인 검토본: docs/drafts/report-recovery-timer-setup/review.ko.md.
- 교체 계획: docs/drafts/report-recovery-timer-setup/failed-test.draft.md.
- 공통 헤더 SHA-256: `5879a93953dcb7bc1e3e8b986c34986171508a8e78f10ece74fc7aebe719d61a`.
- 교체 계획 SHA-256: `4d5faa0708626bda845047b51b3edee6c91e66e8a53ebdebc0ed4dbb8df138d8`.
- spec.md SHA-256: `1c65f2245c1f9c8c9fb8c91020fef60e6ab76342d9d4e75ba6339b350c738794` (변경 없음).
- 이전 기준선: `397f81b32d0f88f8f08fb0cdf6ba43df5df018a1`. 4개 완료 체크와 2개 대기 체크를 유지한다.
- 마지막 이전 체크포인트: `b23c5323c5e622d48289afc0a5657f787c356652`.
- 기존 승인·실행 기록: prior-harness-state.json 및 worker-defect.json을 교체 초안에 보관했다. 런타임의 approve --replace도 이전 상태를 approvals/에 보관한다.
- 실제 교체는 failed-test.md의 공통 헤더와 이미 materialize된 report-recovery.test.ts helper에 동일한 한 줄을 추가한다. 여섯 본문은 그대로 보존한다.
- 사전 임시 사본 검증: 전체 81개 테스트, 타입·lint·format 통과. 기존 75개 테스트와 제품 소스 변경 없음. 이 결과는 최종 하네스 gate·독립 리뷰를 대신하지 않는다.

사용자가 이 교체 및 남은 최종 검증 후 기존 PR #16 반영을 승인했다. 추가 동작·배포·운영 설정 변경은 승인 범위에 포함하지 않는다.
