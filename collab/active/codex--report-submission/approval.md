# 실제 제보 접수 구현 승인 기록

2026-10-13 사용자가 최종 계약 및 정확한 프런트·서버 테스트 17개를 명시적으로 승인했다. 이번 프런트엔드 범위는 아래 교체 기준선과 새 계획 9개이며, Go 서버의 8개 항목은 별도 저장소에서 진행한다.

- 승인된 `docs/report-submission-contract.md`를 바이트 변경 없이 `spec.md`로 채택했다. 문서 안의 이전 ‘승인 전’ 표기는 당시 초안 원문이며 이 승인 기록이 채택 상태를 나타낸다.
- `replacement-baseline.txt`를 `src/app/report/report-form.test.ts`에 정확히 복사했다. 기존 로컬 전용 테스트 4개는 명시적 승인에 따라 교체하며 첨부 회귀 2개는 본문 바이트를 보존한다.
- `failed-test.draft.md`를 `failed-test.md`로 정확히 복사했다. 헤더와 새 항목 9개는 주석 검토본으로 검토한 실행 원문이다. 설명 주석은 실행 입력에 추가하지 않는다.
- 런타임은 팀 고정 리비전 `83af28db653c29a54be880ae49671725b6bbbcc4`를 사용한다. 각 항목은 RED·전체 테스트·포맷·린트 체크포인트를 거치며 마지막 gate와 독립 리뷰 전에는 완료로 간주하지 않는다.
- 운영 활성화·배포 및 브라우저→Go 저장 통합 검증은 별도로 조정한다. 이 작업에서는 비밀 환경변수를 읽거나 운영 서버로 접수하지 않는다.

## 승인 입력 SHA-256

- `docs/report-submission-contract.md`: `612ca67a60c5214f8dd6e9081537a62d391d06cc4450e82b3ac1e820fb9d2102`
- `docs/drafts/report-submission/replacement-baseline.txt`: `4459972aeb7d3181f99cac5304c36e354495034870d1827f08fe8efc994a9fd6`
- `docs/drafts/report-submission/failed-test.draft.md`: `fe73f2756d780d488a59dbce0e0a29ba4dd5d56c1e9c1e18eb52ef35f9e77534`
- `docs/drafts/report-submission/header.txt`: `73a1f5699c7d6bbc5128f5e1aec8f13582a5852e574388958eef61791b209304`
- `docs/drafts/report-submission/test-1.txt`: `b9e12748ef6202cd316c581359cda44b293d2a0ab8649fbf79c61734b31ae7a2`
- `docs/drafts/report-submission/test-2.txt`: `2e639a4d6a8166edd184d5098bd7ec7933e11bf29036e07b64e2befef1ac60cf`
- `docs/drafts/report-submission/test-3.txt`: `c26e16be1d58c6da0bb4d538d7e9cfdcaad1c756a51da7cc46a547322a15ff20`
- `docs/drafts/report-submission/test-4.txt`: `4995888cff4a587eda35c6beb70b29094bc892ba2a39e1e497d48c76cdd1d52f`
- `docs/drafts/report-submission/test-5.txt`: `b1ae78cbcdce8cf3f756e4297b1069f97fc9169ad52c1eae87ceb8e4f9385951`
- `docs/drafts/report-submission/test-6.txt`: `4b1cfc8d435c60dc088627eb7d9140f7166860ff4cb618ccabe5ba3bee936e8f`
- `docs/drafts/report-submission/test-7.txt`: `f8aaaa74c1efbbec483690b177305dbb002634ac198a923dc3c4696350aa705e`
- `docs/drafts/report-submission/test-8.txt`: `948752a93b2fcdfe1b2874603aab56e8593af4ba220d47437d98922a42701034`
- `docs/drafts/report-submission/test-9.txt`: `b6fa3c890ff357b1fa1f0e9141d63749b6e1d657545202aaf11984040b108b7d`
- `docs/drafts/report-submission/test-10.txt`: `3763dd3762b8d6051ea2176c76cdb2ff158d50c36cecc0a897f075b548dfba1a`
- `docs/drafts/report-submission/test-11.txt`: `0d44cb8a53dac14abf8a63d2c1d6f753caa086751ce5b0811ef117231c4d5be7`
- `docs/drafts/report-submission/review.ko.md`: `2afb5cb73ed52e06a6dc1b79d6f99980d5040989880d87b262c25e857918bf89`
- `docs/drafts/report-submission/proposal.md`: `6e7891dd0a60f96a8b288ee3a85638da2ded9a59b9438414293d7748a1925c7b`
