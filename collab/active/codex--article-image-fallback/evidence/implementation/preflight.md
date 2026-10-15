# 실행 환경 진단과 기준선

- 승인 기준선 bac5e625fc7fc8e1b73e3f73dcdac03ebfd70a6e. 원래 제안의 명세·테스트·지원 파일 7개 SHA-256을 대조했고 정확히 복사했다. dev@3af4459 선행 PR2·3 통합을 merge로 반영했으며 기존 src와 21개 테스트는 7a2672a와 같다.
- pinned runtime 83af28db653c29a54be880ae49671725b6bbbcc4. 정책 selected/astra/gpt-6-astra, max_calls20, timeout900s 유지.
- doctor는 앱의 협업 pre-commit wrapper가 직접 설치용 managed hook과 바이트 단위로 다르다고 exit1했다. 전체 doctor PASS로 기록하지 않는다. 실제 .githooks/pre-commit → common .git/hooks/pre-commit → pinned tdd-set/hooks/pre-commit.sh 위임과 실행 비트, 최근 커밋에서 workspace/format/lint 실행을 확인했다. 앱 harness/sobaya/RULES.md에 명시된 구성이다. independent runtime_execution_audit가 읽기 전용으로 같은 결론을 확인했다. 훅 교체나 검증 우회 없음.
- 첫 step 사전 전체 검사에서 승인 이미지 항목 외 실패를 감지해 worker 호출 전 정지했다. 런타임은 내부 suite 임시 파일을 정리했으므로 별도 동일 전체 실행 initial-suite.json/txt로 진단했다. hooks·sobaya 실패, loop PASS, 이미지 오류 이벤트 뒤 img가 남는 정상 RED였다.
- 원인은 coordinator가 task-local .zprofile과 실행환경에 추가한 SOBAYA_ROOT=pinned 상속이다. 임시 테스트 저장소가 자기 가짜 root 대신 실제 root를 선택했고 hooks 온보딩에 실제 hook이 유입됐다. profile export 제거와 env -u SOBAYA_ROOT로 환경만 바로잡았다. pinned 런타임 명령은 절대경로를 사용한다.
- A/B: 동일 hooks 스크립트 76PASS/8FAIL → 84PASS/0FAIL; 동일 sobaya 32PASS/0FAIL. 로그 hooks-diagnostic.txt, hooks-clean-env.txt, sobaya-clean-env.txt. 승인 테스트·fixture·명령·시간 제한을 변경하지 않았다. 원인 진단 후 보존된 state에서 step --resume을 실행했다.
