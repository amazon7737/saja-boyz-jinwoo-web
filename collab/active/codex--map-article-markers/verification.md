# 지도 기사 연결 검증

2026-10-14 · 기준 dev `81e865123fcf5bfa5648a2fae4e56871ea70a5bd` · Node.js 24.19.0 / pnpm 10.34.6.

## 재사용과 범위

PR #8의 지도 SDK·내 위치, #14의 탭 메모리 뷰포트 복원, 기존 ArticleCard/ArticleImage/기사 상세 경로를 재사용했다. 신규 의존성·지오코딩·브라우저 위치 저장·허브 파일 변경은 없다. 동일 좌표의 기사만 한 마커로 묶으며 실제 사건 병합이나 줌 클러스터를 새로 구현하지 않았다.

## 행동 검증

다음 사례는 하나씩 테스트를 구체화해 실제 RED 원인을 확인하고 구현했다. `verification/poem-map-red-*.txt`는 주요 실패 증거다.

- 첫 100개 이후 페이지까지 읽고 resolved 기사만 반환.
- 좌표 범위·정확도·상태·기사 ID·원문 근거 계약 위반 거절.
- 빈 결과와 API 실패 구분, 진행되지 않거나 total이 바뀌는 페이지 집합 거절.
- 서버 좌표의 마커 → 텍스트 기사 요약 → 기존 상세 링크.
- 요청할 때만 전체 기사 위치 fitBounds, 기본 지도 중심/복원 유지.
- API 오류/좌표 없음에서도 지도와 내 위치 버튼 유지.
- 같은 좌표의 기사 숫자 표시와 모든 상세 링크 보존.
- `region` 계약과 지역 대표 위치 안내, 기상청 출처 표시.

SDK 인증 실패에서 마커·리스너 제거와 오래된 클릭 무시는 이미 GREEN이었다. RED를 인위적으로 만들지 않았다. 신규 테스트의 Window callback 타입 선언 문제로 한 차례 타입 검사와 추천 검색의 실제 Next 빌드가 실패했으며 optional 타입과 존재 확인으로 수정했다. 제품 기대값을 약화하지 않았다.

## 최종 결과

- `PATH=/tmp/poem-submission-worker:$PATH pnpm exec vitest run`: **22 파일, 93 테스트 통과**, 116.56초. 지도 영역은 21개이며 전체에 기존 SDK/뷰포트/뉴스/검색/제보·실제 Next 앱 검색 로딩·협업 shell suite를 포함한다.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format:check`, `sh scripts/check-styles.sh`, `git diff --check`: 통과.
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=map-build-check NEWS_API_BASE_URL=https://poem-news.168.107.37.12.sslip.io pnpm run build`: 통과. 비밀값 대신 합성 공개 ID를 사용했고 홈 `/`가 **dynamic(ƒ)** 으로 출력돼 매 요청 서버 조회가 유지된다.
- 실제 API가 location을 resolved/region으로 내려주는 운영 양성 사례와 브라우저 마커·카드·상세 왕복 검증은 서버 카탈로그 배포 후 부모 작업에서 진행한다. 이 문서는 아직 운영 배포 완료를 주장하지 않는다.

최종 suite 로그의 `components/ui/button.tsx @solp(feat--checkout)` 문장은 협업 하네스의 합성 테스트 출력이다. 실제 세션 digest에는 현재 편집 충돌이 없었다. 오래된 audit/foundation 원격 브랜치의 광범위한 겹침 안내는 이번 변경 파일 목록이 아니다.

## 남은 한계와 다음 판단

확정 좌표 대신 지역 대표점을 쓰는 경우 같은 점에 여러 기사가 모이므로 묶음 숫자와 모든 기사 접근을 테스트로 보호했다. 기사 수가 크게 늘면 현재 전체 offset 조회와 마커 표시 대신 서버의 범위·기간·커서 계약이 필요하다. 조회 중 total 변경은 오류로 처리하지만 동일 total에서 기사 내용/정렬이 바뀌는 경우까지 원자적 스냅샷을 보장하지 않는다.
