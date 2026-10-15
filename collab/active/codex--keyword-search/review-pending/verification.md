# 추천 키워드 전환 검증

- 기준 제품·소바야 리뷰 HEAD: d2b978164ea5346425f067ecc36620324559124b. 승인 기준 c7aaadad2b164647c839bb4dae9a490010ef407f, sobaya 83af28d, Astra gpt-6-astra.
- 실제 Next 프로덕션 서버에서 추천 응답을 보류한 회귀 테스트: 수정 전 해당 테스트만 RED, 수정 후 전체 34개 GREEN. 기존 33개 테스트 파일·기대값·명령 변경 없음.
- 소바야 최종 gate(Test·Format·Lint·승인 보호 검사)와 fresh Astra 독립 리뷰 통과. 리뷰는 origin/dev 대비 전체 기능과 승인 baseline 이후 변경을 검사했으며 수정 필요 결함 없음.
- pnpm run typecheck, pnpm exec next build --webpack 통과.
- Chrome 393×852 화면, fixture API 3.5초 지연: 클릭 2.5초 후 이전 화재 URL·입력·결과를 보존하면서 검색 결과를 불러오는 중이에요 status 표시. 응답 후 교통통제 URL·입력·결과로 갱신되고 pending 제거. 화면 캡처로 표시 확인.
- 중첩 워커 샌드박스는 listen 127.0.0.1 EPERM으로 브라우저 테스트가 시간 초과됐다. 동일 승인 테스트를 호스트에서 10.15초 통과했고 이후 소바야 런타임 전체 suite/gate에서도 통과했다. 테스트를 수정하거나 제외하지 않았다.
- playwright-core@1.62.1은 승인된 개발 의존성이다. 기존 설치 Chrome을 사용하며 브라우저 다운로드·별도 runner·CI 테스트 제외 없음.
- 기존 2026-10-07 계획은 append-only 규칙에 따라 그대로 보존. 이번 전체 계획은 2026-10-08 별도 디렉터리에 보관한다. 마지막 보관 커밋에는 제품 코드 변경 없음.
- GitHub 코멘트는 별도 승인 전 게시하지 않는다. CI 결과는 GitHub PR #7 체크에서 확인한다.
