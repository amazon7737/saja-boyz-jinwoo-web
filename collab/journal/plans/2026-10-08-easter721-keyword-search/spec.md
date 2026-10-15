# 기사 키워드 검색 명세 초안

기준 dev d1c0f0c. 개인 Figma 계정으로 검색 11:1797·11:1864를 2026-10-07 조회.

- /search의 URL q를 trim하며 배열은 첫 값을 사용한다. 비어 있으면 API 호출 없이 검색 안내.
- /search GET form, input name=q, 접근 가능한 이름 ‘기사 키워드 검색’. Enter/검색 버튼으로 제출. 초기화 링크는 /search, 뒤로가기 링크는 /.
- URL로 새로고침·공유·브라우저 뒤로가기 시 입력/결과 복원. 추천 검색어 6개(대형화재·교통통제·붕괴위험·폭설피해·가스누출·테러경보)는 실제 검색 q 링크로 제공.
- fetchArticleList에 선택적 keyword를 추가해 /news offset=0/limit=20에 전달. 기본/공백 호출은 기존 목록 요청 보존. 보안/응답검증/5초 제한 유지.
- 기존 ArticleList로 결과 표시. 첫 20행 범위를 안내하고 total을 고유 사건 수로 표시하지 않는다. API에 없는 주소·분류·상태·발생시각을 꾸미지 않는다.
- 빈 결과 role=status ‘검색 결과가 없어요’. 실패 role=alert ‘검색 결과를 불러오지 못했어요’, 현재 q를 보존하는 ‘다시 시도’ 링크. /search/loading.tsx는 role=status/aria-busy=true.
- 검색 경로의 공용 브랜드/검색 헤더만 숨겨 중복 방지. 다른 경로의 헤더·하단 메뉴·오류 경계 보존.
- Figma 기준 좌우16px, 뒤로가기36px/반경12px, 검색창 브랜드색1.5px 테두리/반경14px, 헤더gap12px·구역gap20px, 본문14px·보조12px. 기존 Tailwind 토큰과 컴포넌트별 폴더 사용.
- iOS 상태바는 목업이라 제외. 기존 공용 하단 메뉴의 시각 차이와 기존 ArticleList 카드 디자인은 이번 변경 밖이다. 해당 SVG를 새로 구현하지 않는다. 검색창 화살표·돋보기·닫기는 Figma의 텍스트 기호를 사용한다.
- 최근 검색 저장/가짜 이력, 주소 검색, 자동완성/실시간 검색, 필터·페이지네이션·지도·상세·제보 제외. placeholder도 실제 범위에 맞춰 ‘기사 키워드 검색’으로 표시.
- 신규 의존성 없음. 기존 28테스트·fixture·검증 명령 유지. 신규 테스트 5개는 failed-test-proposal.md 참조.

사용자가 명세 및 정확 테스트 초안을 승인하면 그대로 루트 spec.md/failed-test.md로 반영해 sobaya approve/loop를 실행한다. 전체 테스트·형식·린트·타입·빌드·gate·독립 리뷰와 320/393/desktop 브라우저 제출/초기화/뒤로가기/오류·빈 결과·로딩·Figma 범위 내 시각 비교가 완료 조건이다. GitHub 코멘트는 별도 승인 후 게시.

# 추천 키워드 전환 로딩 수정 명세 초안

PR #7 amazon7737 P2(issuecomment-6050400179)의 후속 작업. 실제 브라우저에서 추천 교통통제 클릭 후 지연 응답 동안 이전 URL/결과가 남고 로딩이 없는 상태를 재현했다.

- 추천 키워드를 눌러 서버 응답을 기다리는 동안 해당 전환의 피드백을 보이는 role=status/aria-busy=true로 표시한다. 문구는 검색 결과를 불러오는 중임을 알린다.
- 응답 후 URL q·검색 입력·결과가 선택한 키워드로 바뀌고 pending이 끝나야 한다. 대기 중 현재 결과를 보존하며 아직 새 결과를 수신한 것으로 표시하지 않는다.
- 기존 Next Link 전환을 유지하고 작은 client 링크 하위 컴포넌트의 Next useLinkStatus로 대기를 표시한다. 수동 타이머·전역 store·중복 fetch·페이지 전체의 client 전환은 추가하지 않는다.
- 기존 검색 폼·추천6개·초기화·뒤로가기·빈 결과·오류/재시도·라우트 로딩·API 계약·공용 헤더를 보존한다. 기존33개 테스트·기대값·helpers·fixture·검증 명령은 바꾸지 않는다.
- 회귀 테스트1개: Next 프로덕션 빌드를 임시 복사본에서 실행하고 로컬 API 추천 응답을 보류해 실제 Chrome 클릭 → pending → 응답 해제 → URL/입력/결과 갱신·pending 종료를 검증한다. 원본 src와 공유 .next를 변경하지 않는다.
- 테스트용 개발 의존성 playwright-core 1.62.1만 추가한다. 별도 테스트 runner·브라우저 다운로드는 추가하지 않고 로컬 및 GitHub ubuntu-latest의 Chrome을 사용한다. Chrome이 없으면 skip하지 않고 준비 오류로 알린다. 제품 의존성·전체 Test 명령·CI 테스트 제외는 변경하지 않는다.
- 최초 기능의 deps 추가 없음 범위에 대해 이번 개발 의존성 추가를 정확 초안 승인 대상으로 제안한다. package.json·pnpm-lock.yaml 외 허브/공유 타입 수정 없음.
- 완료: 전체34개 테스트·포맷·린트·타입·빌드, 소바야 gate/독립 리뷰, 브라우저 재현/화면 확인, 인수인계·계획 보관·PR7 브랜치 재푸시·CI 확인. GitHub 코멘트는 사용자 별도 승인 후 게시.

근거: [Next useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status), [GitHub 실행 이미지 Chrome 목록](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).
