# 초안 검증 기록

확인일: 2026-10-13. **제품 구현 승인·완료 기록이 아니다.** 새 6개 초안은 RED이며, 기존 75개 baseline은 별도 PASS다.

## 범위와 환경

- 읽은 제품 기준: PR #16 `32a2a6a9ba519b2755815422e0a375df4072793d`.
- 초안 checkout: `codex/report-recovery`, HEAD `03a3857a89557ca3452b4a9c476aa5501d096d60`.
- pinned probe: Sobaya `83af28db653c29a54be880ae49671725b6bbbcc4`의 `tdd-set/bin/probe.sh`.
- Node 24.19.0 / 기존 pnpm 10.34.6 환경, 기존 설치 의존성만 사용.
- 실행 위치: HEAD를 `git archive`로 복사한 `/tmp/poem-report-recovery-probe`. 제품 파일은 수정하지 않고 probe가 만든 임시 테스트 또는 헤더+누적 항목 테스트만 실행했다. 기존 checkout의 src·기존 테스트·승인 문서·AGENTS·harness·설정·의존성에는 변경이 없다.
- 실제 API·운영 서버·네이버·Cloudflare 호출 없음. 제품 구현·승인 등록은 하지 않았다. 초안 작성·검증으로 새 커밋이나 push는 하지 않았다. 착수 선언 커밋 `03a3857`은 이 단계 이전에 Root가 이미 공유했다.

## 최종 RED probe

각 행은 최종 `header.txt`와 해당 `test-N.txt` 한 개를 입력한 실행이다. probe 종료 코드 0은 **예상된 assertion RED**다. 인프라·타입 오류를 RED로 분류하지 않았다.

| 초안 | 첫 실패 근거 | 결과 |
| --- | --- | --- |
| 1 요청 제한 | 59,999ms에 살아 있어야 할 request signal이 현재는 undefined | RED |
| 2 본문 제한 | 헤더 이후에도 살아 있어야 할 같은 request signal이 undefined | RED |
| 3 경계 reset | 현재 inline 오류 처리에서는 실제 Suspensive setError 호출 0회 | RED |
| 4 직접 재시도·수정 | 첫 네트워크 실패의 실제 Suspensive setError 호출 0회 | RED |
| 5 실패 분류·정리 | 본문 오류의 실제 Suspensive setError 호출 0회 | RED |
| 6 취소·언마운트 | 60초 뒤 abort된 signal을 기대하지만 undefined | RED |

상세 출력: `probes/test-1.txt`~`test-6.txt`. 첫 assertion에서 중단되므로 그 뒤 기대사항까지 현재 코드에서 모두 실행됐다는 뜻은 아니다. RED만으로 테스트 기대값의 적절성이나 미래 구현의 GREEN을 증명하지 않는다. 초안은 별도 읽기 전용 리뷰를 거쳤다.

## 단계별 정적 검사

헤더 + 1번, 헤더 + 1~2번, …, 헤더 + 1~6번을 각각 scratch의 새 테스트 파일에 배치했다. **6단계 모두** 아래 세 검사를 통과했다. 따라서 뒤 항목이 추가되기 전 공용 helper의 unused 문제도 확인했다.

- `node node_modules/typescript/bin/tsc --noEmit --incremental false` — scratch 전체 타입 검사, 먼저 Next route type 생성.
- `node node_modules/eslint/bin/eslint.js src/app/report/report-recovery.test.ts` — 실행 예정 파일 검사.
- `node node_modules/prettier/bin/prettier.cjs --check src/app/report/report-recovery.test.ts` — 실행 예정 파일 형식 검사.

상세 출력: `probes/stage-1-hygiene.txt`~`stage-6-hygiene.txt`. 전체 제품 suite GREEN으로 대체해서 해석하지 않는다.

## 기존 baseline 및 플랫폼 근거

Root가 원본 `report-submission` checkout의 `32a2a6a`에서 기존 전체 suite를 별도로 실행했다. 최초 sandbox에서는 localhost TCP listen EPERM이 2초 독립 probe로 재현됐고, 브라우저 테스트 1개 timeout·나머지 74개 PASS였다. 원인을 확인한 뒤 로컬 서버·Chrome이 허용된 환경에서 **같은 전체 suite 재실행 → 18 files / 75 tests PASS, 105.12초, exit 0**. 원본 제품·기존 테스트 tracked diff 없음. 로그는 `/tmp/poem-report-recovery-baseline-tests.txt`다. 새 초안 6개가 이 75개에 포함된 것은 아니다.

`probes/native-abort.json`은 Root의 별도 Chrome에서 헤더 대기 및 헤더 이후 본문 대기 abort가 각각 AbortError였음을 기록한다. **제보 제품 코드를 검증한 결과는 아니며**, 지연 mock이 모사하는 플랫폼 동작의 근거다.

## 리뷰 반영과 정확성 확인

- 최초 제안의 취소를 무시하는 transport mock은 제거했다. native Fetch처럼 signal을 따르는 mock에서 늦은 이전 resolve·다음 요청·언마운트를 확인한다. 별도 race 구현을 강제하지 않는다.
- 직접 재시도 후 두 번째·세 번째 오류도 실제 경계에 전달되는지 검사하고, 두 번째 요청은 pending 잠금→실패→잠금 해제를 관찰한다.
- 오류 뒤 필수 5개 입력과 제출뿐 아니라 첨부 input·기존 파일 삭제 버튼도 활성 상태인지 검사한다.
- 최종 실행 원본 해시는 `probes/inputs.sha256.json`이다. 계획의 7개 실행 블록과 한국어 주석 검토본에서 설명줄만 제거한 7개 블록을 각각 원본과 바이트 비교한다. 결과는 `probes/review-verification.json`에 기록한다.

검토와 정확한 입력 승인 전에는 `spec.md`/`failed-test.md`로 채택하거나 approve·구현 루프를 시작하지 않는다. 기존 보관된 계획을 재개하지 않는다.
