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
