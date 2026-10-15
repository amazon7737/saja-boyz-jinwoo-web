# 검색 최종 검증 · 2026-10-07

검증·리뷰 HEAD: 1fef16e3a95aafdd69f4dc34fb8b1893b20b13c6. 마지막 인수인계 커밋은 문서·claim·계획 보관만 포함한다.

- 전체 테스트 33개 통과(기존 28개와 신규 검색 5개). 기존 테스트 변경은 승인받은 일반 헤더 검사 직전 pathname 한 줄이며 모든 기대값을 보존했다.
- 포맷·린트·타입 검사 통과. 소바야 최종 gate 및 fresh Astra 독립 리뷰 통과. origin/dev 대비 전체 기능을 별도 fresh 리뷰에서도 확인했고 actionable finding 없음.
- 최종 제품 소스의 Webpack 프로덕션 빌드 및 Chromium 브라우저 검증 통과. 입력/Enter/GET, URL 특수문자/새로고침/초기화/뒤로가기, 중복 제거, 빈 결과, 오류·내부 정보 비노출, 실제 재요청 후 복구, 추천 키워드, 지연 응답 로딩, 320/393/1280px 넘침 없음 확인.
- Figma 개인 계정 검색 11:1797/11:1864를 기준으로 헤더 36px·반경14px·1.5px 테두리·좌우16px·간격과 칩을 대조했다. 중복 상단 여백/닫기 기호/안내 문구 보정도 최종 브라우저에서 확인했다. 최근 검색 가짜 이력·주소 결과·기기 상태바는 제외하고 기존 기사 카드·하단 메뉴는 재사용한다.
- 기본 pnpm run build의 Turbopack은 호스트 포트 제한 EPERM으로 실패했다. 동일 소스 pnpm exec next build --webpack으로 컴파일·타입·프로덕션 생성 성공을 확인했다. 기본 빌드 성공으로 기록하지 않는다.
- 중간 재검증에서 기존 하네스 테스트가 한 번 실패했다. 단독 하네스 3개 및 이후 전체 suite/gate가 통과했다. 테스트·검증 명령·타임아웃을 완화하지 않았다.
- 읽기 전용 리뷰의 Vitest 임시 파일 쓰기 EPERM은 gate 실행 근거와 코드 리뷰를 분리해 해결했다. 모델 gpt-6-astra·승인 기준 유지, 임시 실행 adapter로 환경 진단을 전달했다. 소바야 본체 수정 없음.
- 별도 발견된 루트 layout 공백 변경은 기능 PR에 섞지 않고 git stash 메시지 preserve unrelated root layout whitespace during keyword search approval로 보관했다.
