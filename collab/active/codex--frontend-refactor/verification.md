# 프런트엔드 구조·Tailwind 리팩터링 검증

## 범위와 기준

- 기준 dev: de51a41f5c6989df8ca440658b510768d62b1bc3 (PR #5 통합).
- 구조 커밋: 84b2e75. 스타일·최종 소스: eaa6a662a9f6ed0c1e0dde057fd2fc7bd6194cd3.
- sobaya 83af28d의 별도 green 구조 리팩터링 절차를 적용했다. 새로운 행동 구현 항목이 없어 step/loop의 RED→GREEN 실행이나 신규 spec/failed-test 승인을 수행하지 않았다. 자동 gate/review receipt가 아닌 아래 검증과 독립 리뷰가 완료 근거다.
- 테스트 이동·import 수정은 test-path-proposal.md의 정확 초안에 대해 사용자 승인을 받았다. 테스트 기대값·mock·fixture·본문과 수집 명령은 유지했다.

## 자동 검사

| 시점/검사 | 결과 |
| --- | --- |
| 변경 전 pnpm test | 7파일 28테스트 PASS |
| 구조 정리 후 pnpm test | 7파일 28테스트 PASS |
| Tailwind 전환 후 pnpm test | 7파일 28테스트 PASS |
| pnpm run format:check | PASS |
| pnpm run lint | PASS, 경고 없음 |
| pnpm run typecheck | PASS |
| pnpm run build | PASS, Turbopack production build |
| git diff --check | PASS |
| sh scripts/collab.sh check | PASS |

테스트는 기사 API, 날짜·텍스트·URL 처리, 이미지 실패 및 URL 변경 복구, 기존 사건 필터/목록, Suspensive와 실제 Next 오류 경계, 협업 하네스 3개 스위트를 포함한다. 테스트 실행 중 표시된 @solp/feat--checkout 겹침 메시지는 하네스 테스트 fixture 출력이며 실제 동료 충돌이 아니다.

## 브라우저 비교

설치된 Chrome을 번들 Playwright로 실행했다. 실제 API 대신 동일한 로컬 응답을 양쪽 서버에 제공했다. 긴 한국어 제목·본문, HTML/엔티티, KST 발행 시각, 정상 원문 URL, 이미지 없음·이미지 실패를 포함했다.

- 기준 코드와 최종 코드의 홈(`/`)·목록(`/incidents`)을 320px, 393px, 1280px 폭에서 비교했다.
- header/nav/section/h1/article/기사 제목·본문·원문·이미지 영역의 위치·너비·높이·폰트 크기·줄높이·색·배경·여백·반경 값이 6개 조합에서 모두 같았다. 가로 넘침 없음.
- 최종 production 서버에서도 같은 6개 조합이 기준과 같았다.
- 별도 이미지 성공 응답으로 393px 목록의 AI 생성 이미지 표시, 80px 이미지/97px figure, 11px/13px 캡션 배치를 전후 비교했다.
- 키보드 Tab으로 첫 링크 ‘흉흉’의 빨간색 3px 포커스 외곽선이 같은지 확인했다.
- 393px 목록 스크린샷을 육안으로 확인했다. 모든 화면의 픽셀 단위 동일성을 주장하지 않는다.

이 브라우저 검증은 실제 서버 규약·운영 데이터·인증을 확인한 것이 아니다. 정상/빈/실패 요청과 오류 복구 동작은 기존 테스트를 유지해 검증했다. 서버 명세는 docs/news-api-contract.md의 요청에 대한 amazon 답변이 필요하다.

## 독립 리뷰

새 대화 맥락의 읽기 전용 리뷰어가 de51a41..eaa6a66을 검토했다. 수정이 필요한 회귀 결함 없음.

- API 요청·검증·5초 제한·null 실패처리와 링크 보존.
- 기사 처리·중복 제거·이미지 실패/복구 보존.
- FeatureError 클래스 동일성과 서버/클라이언트 호출부 확인.
- 승인된 테스트 경로 변경과 그에 따른 줄바꿈 외 기대값·mock·fixture·본문 변화 없음.
- CSS 대응 및 모든 h1/p 호출부, 전후 JSON·393px 스크린샷 확인.
- 기사/사건 모델 분리와 문서 범위 적절.

리뷰어는 전체 테스트·빌드를 재실행하지 않았다. 정상 이미지·키보드 확인은 구현 담당의 실행 증거에 의존했다. 리뷰 이후 변경은 협업 기록·PR 설명뿐이다.
