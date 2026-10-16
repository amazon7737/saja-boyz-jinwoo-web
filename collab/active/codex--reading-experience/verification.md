# 읽기 경험 개선 검증
- 제품·테스트 검증 HEAD: 2f76efc9f44e3b8945a35547355564d8718c3aaa
- base: origin/dev a924bdd. 뒤따르는 커밋은 검증 근거·저널·명세 보관뿐이며 제품/테스트 내용은 동일하다.

## 변경 결과
| 항목 | 이전 | 적용 후 |
| --- | --- | --- |
| 검색 입력 | form36px 안의44px 버튼이 넘침 | form47px, 내부44px 컨트롤 포함 |
| 하단 메뉴 | 중앙 제보 버튼과 양옆 탭 간격0px | 간격8px, 키보드 포커스 윤곽 유지 |
| 추천 키워드 | 아이콘/글자 간격 미지정, pending 문장으로 폭 증가 | gap6px·최소36px 높이·고정12px spinner 자리 |
| 기사 카드 | 검색 간격8px·촘촘한 줄간격 | 카드 사이12px, 제목20px/요약18px/메타16px 줄간격 |
| 페이지 추가 | 더보기 클릭 | 근접 감지 자동 추가, 실패 시 명시적 재시도 |
| 로딩 | 텍스트 위주 | 형태별 skeleton·공통 spinner·screen reader 상태 유지 |

## 자동 검증
- 고정 Sobaya83af28d, Astra 구현·새 컨텍스트 읽기 전용 독립 리뷰 완료.
- 9개 정확 승인 항목, 최종115개 테스트 통과(기존113+신규2).
- 기존 테스트24개 파일 해시 동일, 승인된 최종4개 파일 초안과 바이트 동일. 기존7개 이름/데이터 회귀 복원.
- format:check / lint / typecheck / 기본 pnpm run build(Turbopack) 종료0.
- lint 오류0, 정확 승인된 지원 helper의 unused 경고2개는 그대로 유지했다.
- 마지막 항목이 초기 skeleton만 구현된 상태에서 검사 확정 전 정식 중단/--resume으로 승인 범위의 추가 로딩·제보·위치·가독성·모션·재시도 포커스를 보완했다. 테스트/명세/명령 변경 없음. 재개 문맥과 정책은 final-ui-adapter.sh / execution-policy-final-ui.json.

## 실제 Chrome 제품 검증
- 320/393/640/1440px의 지도·검색·목록·상세·제보에서 가로 넘침0. 667×375 지도도 확인.
- 검색 컨트롤44px가47px form 안에 포함, nav 간격8px, 포커스 표시 유지. 실제 카드 간격12px.
- 실제 Naver SDK 스크립트 지연 및 로컬 위치 콜백으로 SDK·위치 spinner 확인.
- 실제 App Router 초기 응답 보류로 목록/검색/상세 skeleton 확인.
- 검색·목록 스크롤: 기존19개 유지 + 추가 skeleton,503 실패 후 자동 요청 정지, 수동 재시도, raw offset0/20/20/40, 고유40개, 종료 후 요청 없음.
- 재시도 중 동일 버튼과 키보드 포커스 유지(두 화면 모두 true).
- 실제 next/link pending 중 칩 폭/높이 변화1px 미만, spinner 표시.
- reduced-motion에서 실행 중 애니메이션0. 짧은 실제 로딩 녹화 보존.
- 제보1건은 reports.example.invalid를 Playwright에서 가로채 로컬 응답만 반환했다. 외부 POST0. 입력/잠금/spinner/접수 안내 확인.
- 운영 news/map API는 GET22회만 사용해 실제 화면도 별도 캡처했다. 브라우저 pageerror0.
- QA 서버와 브라우저는 자동 종료했다. 빌드의 제보 URL은 QA용 가짜 주소이며 배포 환경 설정 변경을 의미하지 않는다.

## 근거
- [전체 결과](evidence/final/report.json), [테스트 보존](evidence/final/integrity.json), [소바야 완료·리뷰](evidence/final/sobaya-completion.json)
- [화면 모음](evidence/final/overview.png), [검색](evidence/final/live-search.png), [목록](evidence/final/live-list.png), [검색 결과](evidence/final/live-results.png), [지도](evidence/final/live-map.png), [상세](evidence/final/live-detail.png)
- [초기 skeleton](evidence/final/initial-list.png), [추가 skeleton](evidence/final/list-append-pending.png), [재시도](evidence/final/list-retry-pending.png), [제보 접수](evidence/final/report-submit-pending.png), [동작 줄이기](evidence/final/keyword-pending-reduced-motion.png)
- 원래 체크아웃의 사용자 next-env.d.ts 변경은 보존했다. API 계약·의존성·harness/release 파일 변경 없음.
