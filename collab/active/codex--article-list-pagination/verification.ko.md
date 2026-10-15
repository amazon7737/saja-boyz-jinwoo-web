# 기사 목록 더 보기 구현·검증 결과

2026-10-11 · 구현 및 리뷰 기준: `625f772e3ef456f23759eb209bc5aba01c3110df`.

`/incidents`에서 첫 페이지 이후의 기사를 `더 보기`로 이어 읽는다. 서버가 반환한 원본 행 수만큼 offset을 전진하고 같은 ID는 최초 내용을 유지한다. 추가 로딩·실패 때 기존 카드는 유지되며 재시도는 실패한 offset을 다시 요청한다. 최신 total에 도달하거나 빈 페이지를 받으면 종료한다.

## 승인·체크포인트

- 사용자 “승인한다”를 기록한 기준 커밋: `4ff4cd832ebedf37b6ea767270b6617cd2b71a3b`.
- 항목 1: 행동 RED → 원본 offset·최초 ID 유지 구현 → 전체 59개 통과, `8bf0d770834f3469cfda7afb42d46aee8b86902a`.
- 항목 2: 행동 RED → 중복 요청 방지·로딩·실패·동일 offset 재시도 → 전체 60개 통과, `a5b558156fe71e3a96fbd2f9587311e2221884a3`.
- 항목 3: 행동 RED → 빈 응답·완료된 목록 종료 → 전체 61개 통과, `625f772e3ef456f23759eb209bc5aba01c3110df`.
- 기존 58개 테스트·helpers·fixtures·명령·의존성은 보존했다. 명세와 승인 테스트 본문은 변경하지 않았고 harness가 완료 표시와 테스트 등록을 수행했다.

## 검증

| 확인 | 결과 |
| --- | --- |
| 팀 고정 Sobaya 83af28d 최종 gate | 전체 61개 테스트, format, lint 통과 |
| `pnpm run typecheck` | 통과 |
| `pnpm run build` | 통과: `/incidents`와 상세·검색은 동적 경로 유지 |
| 실제 Chrome + production Next + 로컬 뉴스 API fixture | 아래 7개 동작 묶음 통과, pageerror 없음 |
| 별도 Astra 코드 리뷰 | 4ff4cd8..625f772에서 수정이 필요한 결함 없음, 저장소 변경 없음 |
| `git diff --check` | 통과 |

Chrome에서는 중복만 있는 페이지·짧은 페이지·같은 페이지 안 중복을 포함해 offset `0 → 20 → 40 → 42`와 최초 제목 유지, 최신 total 종료를 확인했다. 320/393/1280px에서 가로 넘침이 없었다. 빠른 연속 클릭, 진행 중 안내, 503 응답과 Next 서버 액션의 네트워크 실패 후 카드 보존·재시도, 추가된 기사 상세와 원문 링크·뒤로가기, 빈 페이지 종료, 기존 초기 오류 화면을 확인했다. 브라우저가 원본 API를 직접 조회하지 않고 Next 서버를 통해 GET 뉴스 조회만 실행했다.

HTTP 오류·잘못된 JSON·응답 스키마·네트워크 오류 각각의 재시도는 승인 테스트에서도 검사한다. 브라우저 자료는 로컬 fixture에 대한 검증이며 운영 서버 응답이나 실제 뉴스 데이터를 검증했다는 뜻은 아니다. 운영 수집·이미지 생성·OCI 배포·PR 병합은 실행하지 않았다.

## 실행 환경과 한계

- Node 24.19.0 / pnpm 10.34.6을 명시적으로 사용했다. 환경변수 `SOBAYA_ROOT`는 협업 wrapper에만 적용하고 test fixture 실행에는 전파하지 않았다.
- 중첩 리뷰 sandbox는 Chrome을 실행하지 못해 자체 전체 suite가 60/61이었다(SIGABRT/EPERM). 리뷰어는 이 제한을 명시했다. 독립 리뷰 호출 전에 외부 coordinator의 변경하지 않은 최종 gate에서 전체 61개가 통과했으며, 별도의 실제 Chrome 검증도 통과했다. 리뷰 환경 실패를 제품 결함이나 전체 통과로 바꿔 기록하지 않았다.
- doctor의 직접 hook 경로 검사는 협업 `.githooks/pre-commit`을 관리 hook으로 인식하지 못했다. 파일을 확인해 이 hook이 공통 Git 디렉터리의 Sobaya hook을 실행하는 체인을 검증했으며, 실제 checkpoint에서 검사가 실행됐다. hook이나 harness를 수정하지 않았다.
- 고정 하네스·검증 정책을 바꾸지 않았다. 이 문서 이후 마지막 커밋은 검증 기록·claim·저널·계획 보관만 포함하며 리뷰된 제품 소스를 변경하지 않는다.

## 근거 파일

- [최종 상태](evidence/final-status.json), [gate와 리뷰 종료 로그](evidence/final-gate-review.txt), [독립 리뷰 원문](evidence/independent-review.json)
- [빌드](evidence/build.txt), [Chrome 결과·실제 요청 기록](evidence/browser/result.json), [사용한 QA 스크립트](evidence/browser-qa.mjs.txt)
- [320px](evidence/browser/list-more-320.png), [393px](evidence/browser/list-more-393.png), [1280px](evidence/browser/list-more-1280.png), [실패 상태](evidence/browser/list-retry-393.png), [추가 기사 상세](evidence/browser/added-article-detail.png)

QA 스크립트는 실행 당시의 경로를 포함한 원문이다. 재실행 시 `appDir`와 출력 경로를 해당 checkout에 맞추고 production build를 먼저 준비한다. 승인 테스트나 CI 명령을 대체하지 않는다.

## 회고

- Brain: 새 기록 없음. 실행 환경 교훈은 기존 node-toolchain-isolation에 있다.
- Skills: 변경 없음.
- Structural: 공용 구조·하네스 변경 없음.
- Todos: 새 범위 추가 없음.
