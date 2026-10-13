# 제보 요청 제한·오류 복구 검증 완료

2026-10-13 · amazon · PR #16 후속 반영

제보 요청 직전부터 JSON 본문 읽기까지 총 60초로 제한한다. 같은 AbortController로 요청과 본문 읽기를 중단하고, 종료·페이지 이탈 시 타이머를 정리한다. 오류는 실제 Suspensive 훅으로 로컬 경계에 전달하며 폼 DOM·입력·첨부·동일 내용의 재시도 키는 유지한다. 오류 닫기는 오류만 지우며 자동 재전송하지 않는다. 오류를 닫지 않고 직접 재접수하는 경로도 지원한다.

## 승인과 하네스 근거

- 검증 HEAD: `20498c3c2c1966a5288b9468337b91648dde883c`.
- 고정 런타임: `83af28db653c29a54be880ae49671725b6bbbcc4`.
- 최초 기준선 `397f81b`에서 네 항목의 전체 suite·체크포인트를 완료했다. 다섯 번째 항목의 전역 타이머 계수가 기존 Next Link 초기 idle 타이머까지 세는 문제는 별도 사본에서 재현했다.
- 사용자가 초기 렌더 뒤 제출 전 `await advance(1);` 한 줄과 기준선 교체를 명시 승인했다. 새 기준선은 `6116392cd29ab26c26e3136ebff109958bd5c6ab`이다. 제품 소스·여섯 본문·60초 경계·타이머 0개 기대는 유지했다. [교체 승인](timer-setup-approval.md). 이전 네 체크포인트와 실패 원인은 `docs/drafts/report-recovery-timer-setup/`에 보존했다.
- 남은 두 항목도 전체 suite·체크포인트를 완료했다. 최종 전체 **81개 테스트**, format·lint, 별도 `pnpm run typecheck`가 통과했다.
- [최종 상태](completion/harness-status.json)는 `status=complete`, `head=review.head=20498c3…`, `pending=[]`, `dirty=false`다. [독립 리뷰](completion/independent-review.json)는 소스·승인 블록 일치와 제보 테스트 17개 및 별도 경쟁 상황 진단 2개를 확인하고 조치할 결함이 없다고 판단했다. 독립 리뷰의 전체 suite 근거는 외부 하네스이며, 리뷰 자체가 Chrome·배포를 수행한 것은 아니다.
- 기존 75개 테스트와 다른 기능 소스는 바꾸지 않았다. 복구 테스트 파일만 추가했다. [보관 전 입력 해시](completion/inputs-before-archive.json), [최초 루프](completion/harness-original.txt), [교체 후 루프](completion/harness-replacement.txt).

## 실제 Chrome 확인

[브라우저 결과](completion/browser/evidence.json)는 위 검증 HEAD의 독립 production webpack 빌드와 로컬 HTTPS mock을 사용한다. 393×852 Chrome의 실제 fetch·AbortController·시간과 네이티브 CORS를 사용했다.

- 응답 헤더를 약 45초에 받은 뒤 55초에도 제출 잠금이 유지됐다. 본문은 끝내지 않았다.
- 연결이 요청 후 **60.002초**에 중단됐고, 화면 안내는 클릭 시작 후 **60.344초**에 관측됐다. 헤더 수신 시 제한 시간이 연장되지 않았다.
- 다섯 입력과 File·기존 폼 DOM이 유지됐고, 오류 닫기는 오류 표시만 지웠다. 자동 재접수와 늦은 성공 표시는 없었다.
- 명시적 재시도는 동일 UUID 키·동일 필드·동일 68바이트 PNG SHA-256으로 전송돼 정상 접수증을 표시했다. 성공 후 입력·첨부·제출은 잠겼다.
- 실제 OPTIONS와 POST를 확인했다. 처리되지 않은 pageerror·외부 origin 요청·정리 오류는 없었다. 의도적으로 중단된 fetch와 Next prefetch의 ERR_ABORTED, 경계가 처리한 오류 콘솔 로그, 404 콘솔 한 건은 그대로 증거에 남겼다. 이 실행은 해당 404의 URL을 별도로 수집하지 않았으므로 원인을 단정하지 않는다.
- 별도 [직접 재시도 진단](completion/direct-retry/evidence.json)은 첫 응답 503 뒤 오류 닫기 없이 정상 버튼 클릭·스크롤로 두 번째 POST 성공을 확인했다. 클릭 전 버튼 중심은 고정 하단 메뉴와 겹쳤지만 일반 actionability 스크롤로 접근됐으며 force 클릭이나 CSS 수정은 사용하지 않았다.
- 임시 빌드·HTTPS mock·Chrome은 실행 후 정리했다. [빌드 출력](completion/browser/build.txt), [시간 초과 화면](completion/browser/02-timeout.png), [재시도 성공 화면](completion/browser/04-retry-success.png).

초기 브라우저 진단의 전역 alert 선택자는 Next의 숨은 route announcer를 잘못 세어 실패했다. 폼 내부로 제한한 뒤 다시 실행했다. 별도 localhost 비교에서 Playwright route interception은 OPTIONS를 생략함을 확인하여 최종 실행은 수동 관찰만 사용했다. 진단 도구의 수정이며 제품·승인 테스트 수정은 아니다. [초기 실패](completion/browser/initial-diagnostic-locator-failure.json), [CORS 비교](completion/browser/cors-routing-probe.json), [최종 진단 소스](completion/browser/verify.cjs.txt).

## 적용 범위와 인계

이번 실행은 합성 데이터와 로컬 HTTPS mock 검증이다. Go 저장·운영 CORS·대용량 업로드 성능·Traefik 설정·운영 배포를 새로 검증하지 않았다. 기존 실제 Go 저장 E2E는 submission의 기존 완료 기록에 별도로 보존돼 있다. 서버가 이미 저장했을 가능성을 고려해 같은 내용 재시도에는 같은 키를 유지한다.

검증 HEAD 이후에는 기록·claim·계획 보관만 수행한다. spec.md와 failed-test.md를 내용 변경 없이 `collab/journal/plans/2026-10-13-amazon-report-recovery/`에 보관하며, 그 뒤 recovery 브랜치에서 Sobaya 명령을 다시 실행하지 않는다. 검증된 제품·테스트 내용을 기존 PR #16의 submission 브랜치로 통합하고 소스 동일성·전체 검사·GitHub CI를 확인한다.
