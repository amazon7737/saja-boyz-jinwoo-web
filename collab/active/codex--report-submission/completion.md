# 실제 제보 접수 구현·검증 완료

2026-10-13 · @amazon · `codex/report-submission` → `dev`

기존 제보 폼에서 브라우저가 Go API로 익명 multipart 요청을 보내고, 서버 저장이 확인된 접수번호를 표시한다. 입력·첨부는 실패 시 유지하고, 같은 내용의 재시도에는 같은 요청 키를 사용한다. 성공 후에는 **새 제보 작성**까지 입력·첨부·재제출을 잠근다. 제보를 뉴스로 자동 공개하지 않는다.

## 확정한 코드와 승인 범위

- 프런트 검증 HEAD: `da20a13fd15d3af539cb49bf07f50fc1e1f3ddca`.
- 서버 통합 HEAD: `f91d7ff98d6375e5aea7881923189dea6951319a`. 선행 서버 PR: [team-poem/poem-news#2](https://github.com/team-poem/poem-news/pull/2).
- Sobaya 고정 런타임: `83af28db653c29a54be880ae49671725b6bbbcc4`. 승인 기준선: `ac8c4a58f9a5da01cc63f57883a26c911cd46600`.
- 기존 로컬 확인 전용 테스트 4개를 승인된 신규 항목 9개로 교체했고, 첨부 회귀 테스트 2개와 승인 헤더·본문은 그대로 보존했다. 원래 승인 기록은 [approval.md](approval.md), 보관 전 해시는 [inputs-before-archive.sha256](completion/inputs-before-archive.sha256)에 있다.
- PR #15는 `20b9471d`로 dev에 squash 병합됐다. 기존 기준 `e045e01`과 dev의 tree가 모두 `7bb79d40d12e96975646a2907fd8d304a634c0b8`임을 확인하고 ancestry만 연결했다. 병합 전후 전체 tree 및 승인 입력 해시는 동일하다([전](completion/ancestry-before-inputs.sha256), [후](completion/ancestry-after-inputs.sha256)).

## 하네스·독립 리뷰

보관한 터미널 출력 `.txt`는 Git 검토를 위해 CR·행 끝 공백·마지막 빈 줄만 정리했다. 검사 메시지와 통과·실패 결과는 그대로 유지했다.

승인 항목 9개 모두 별도 체크포인트와 전체 선언 suite 검증을 완료했다. 오류 응답 항목은 이미 동작하여 `ALREADY GREEN` 근거로 검증했다. 최종 커밋에 대해 `review.sh`가 전체 gate(75개 테스트·format·lint)를 먼저 통과한 후 독립 리뷰 call 11을 수행했고, 구체적인 잔여 결함 없이 완료됐다.

[최종 status 원본](completion/harness-status.json)은 `head=review.head=da20a13…`, `status=complete`, `pending=[]`, `dirty=false`와 9개 체크포인트를 기록한다. [독립 리뷰 원본](completion/independent-review.json)은 별도 문맥의 소스·승인 원문 검토 결과다. 독립 리뷰의 중첩 Chrome 실행은 macOS `SIGABRT/EPERM` 제약으로 실패했으며, 바깥 gate의 실제 브라우저 회귀 검사와 아래 별도 E2E는 통과했다.

독립 리뷰에서 재현한 승인 계약 불일치는 제품 소스만 보완했다. 임시 수동 진단은 승인 테스트에 편입하지 않았다.

| 보완 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 잘못된 RFC3339/달력 시각과 응답 본문 실패·불완전 응답 뒤 요청 키 유지 | [8 실패·3 통과](completion/receipt-retry-before.txt) | [11 통과](completion/receipt-retry-after.txt) |
| 성공 후 거부되는 첨부 이벤트가 접수번호·잠금을 해제하는 경로 | [1 실패·11 통과](completion/success-lock-before.txt) | [12 통과](completion/success-lock-after.txt) |

## 실제 브라우저 → API → 저장 검증

Chrome 393×852에서 로컬 웹앱 `http://127.0.0.1:13444` → 로컬 HTTPS 프록시 `https://127.0.0.1:19444` → Go API로 합성 제보와 68바이트 PNG를 전송했다. 실제 사건·개인정보·운영 자격증명은 사용하지 않았다.

- OPTIONS 204 및 정확한 origin, POST 201, 한국시간→UTC 변환, 접수번호 표시를 확인했다.
- 서버 저장 디렉터리 0700·파일 0600, 원본 PNG와 저장 파일의 bytes·SHA-256 일치를 실행 중 검사했다.
- 동일 키·내용 재시도는 200과 같은 접수증, 같은 키·다른 내용은 409였다. 최종 저장은 1건이었다.
- 비공개 JSON·첨부 경로 GET은 404, 접수 목록 GET은 405였고 기존 뉴스 데이터는 변하지 않았다.
- 성공 후 필드·첨부·삭제·제출 잠금과 **새 제보 작성** 초기화를 확인했다. `page_errors`는 없었다.

[E2E JSON 원본](completion/e2e/evidence.json) · [입력 화면](completion/e2e/01-filled-form.png) · [접수 완료 화면](completion/e2e/02-pending-receipt.png). JSON에는 프런트·서버 revision, 서버 바이너리 SHA-256, 네트워크 결과, 합성 fixture/저장 메타데이터가 포함된다. TLS 개인키·실제 환경 파일·저장 볼륨 자체는 보관하지 않았다.

콘솔의 404 한 건은 별도 읽기 전용 브라우저 확인에서 기존 `/favicon.ico` 누락으로 식별됐다. 접수 API 실패가 아니다. 최초 E2E 헬퍼는 `name=description` 선택자가 meta 태그까지 잡아 실패했고, 헬퍼의 form 범위를 수정한 뒤 통과했다. 제품 코드는 이 과정에서 바꾸지 않았다.

## 빌드와 운영 연결

Node 24.19.0·pnpm 10.34.6에서 타입 검사가 통과했다. 공유 `node_modules` symlink가 checkout 밖을 가리키는 이 작업 환경에서는 기본 Turbopack 빌드가 경로 제한으로 실패했다([원본](completion/build-turbopack-environment-error.txt)). 기존 브라우저 테스트와 동일한 `pnpm run build --webpack`으로 production build를 완료했다([출력](completion/build-webpack.txt)). 의존성·Next 설정·package 스크립트는 변경하지 않았다.

E2E 빌드는 공개 환경 변수 `NEXT_PUBLIC_REPORT_API_BASE_URL=https://127.0.0.1:19444`를 사용했다. 운영 주소가 아니며 배포할 때 실제 HTTPS API 주소로 다시 빌드해야 한다. `.env.example`에는 비밀 없는 공개 주소의 빈 자리만 추가했다. 서버의 정확한 `REPORTS_ALLOWED_ORIGINS`와 `REPORTS_ENABLED` 설정 및 서버 PR #2 반영이 필요하다. 운영 API 활성화·실배포는 이번 E2E 결과에 포함되지 않는다.

## 인계

검증된 HEAD 이후에는 코드·환경 설정을 바꾸지 않고 이 기록·저널·claim 및 계획 보관만 수행한다. 보관된 계획은 [spec.md](../../journal/plans/2026-10-13-amazon-report-submission/spec.md), [failed-test.md](../../journal/plans/2026-10-13-amazon-report-submission/failed-test.md)이며 내용은 이동 전과 동일하다. 계획 보관 뒤에는 이 브랜치에서 하네스 명령을 다시 실행하지 않는다. PR 생성과 리뷰는 상위 조정 작업에서 진행한다.
