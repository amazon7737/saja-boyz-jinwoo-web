# 제보 복구 테스트 초기 타이머 교체 제안

**승인 전 교체 초안입니다. 현재 명세·승인 계획·실행 테스트는 수정하지 않았습니다.**

제보 요청 타이머 정리 검사가 기존 Next 링크의 초기 렌더 타이머까지 함께 세어 실패했습니다. 구현 소스는 `b23c5323c5e622d48289afc0a5657f787c356652` 기준입니다. 제품 동작·제한 시간·타이머 정리 요구를 바꾸지 않고, 공통 테스트 준비 단계에 한 줄을 추가하는 제안입니다.

```diff
 async function renderReport() {
   await act(async () => root.render(createElement(ReportPage)));
+  await advance(1);
 }
```

`advance`는 기존 helper입니다. 아직 어떤 제보도 제출하지 않은 초기 렌더 직후 가짜 시계를 1ms 진행하여 Next 링크의 idle callback을 실행합니다. 모든 타이머를 삭제하거나 타이머 0개 기대를 완화하지 않습니다. 제보 요청 직전 시작하는 60초 제한 및 59,999ms/60,000ms 검사는 그대로 유지합니다.

## 원인과 확인

- jsdom에서 `IntersectionObserver`가 없어 Next의 `useIntersection` → `requestIdleCallback` 대체 구현이 1ms 타이머를 예약합니다.
- 제출 전 네트워크 mock 호출 0회인 상태에서도 타이머가 1개이고, 초기 1ms를 진행하면 0개가 됩니다. [발생 위치 계측](evidence/timer-origin.txt)
- 같은 제품 소스와 승인된 6개 본문을 임시 복사본에서 실행하면 [원본 5통과·1실패](evidence/before.txt), 한 줄을 추가하면 [후보 6개 통과](evidence/after.txt)입니다.
- 제품 소스·테스트 6개 본문·기존 75개 테스트는 교체 대상이 아닙니다. [최소 차이](evidence/minimal.diff)
- 별도 복사본의 [전체 suite](evidence/full-suite.txt)는 **19개 파일·81개 테스트 통과, 종료 코드 0**입니다. [타입 검사](evidence/typecheck.txt), [lint](evidence/lint.txt), [format](evidence/format.txt)도 통과했습니다. 이 후보 실행은 최종 Sobaya gate나 독립 완료 리뷰를 대신하지 않습니다.
- [소스 동일성](evidence/source-integrity.json): 제품 소스 변경 0개, 다른 src 파일 58개는 기준 커밋과 동일하며 여섯 본문은 원문 그대로입니다.

## 승인 대상

[완전한 주석 검토본](review.ko.md)은 공통 헤더와 여섯 테스트 전체를 포함합니다. 설명용 `// 검토:` 줄만 제거하면 [header.txt](header.txt) 및 test-1.txt부터 test-6.txt와 바이트 단위로 같습니다. [대조 결과](review-verification.json)

승인하면 다음 순서로 반영합니다.

1. 현재 `spec.md`와 여섯 테스트 본문을 유지합니다. 이미 완료한 네 개 체크포인트와 기존 승인 기록을 보존합니다.
2. 현재 `failed-test.md`의 공통 헤더와 `src/app/report/report-recovery.test.ts`의 동일 helper에 위 한 줄만 추가합니다. 완료 체크 네 개와 대기 체크 두 개를 유지합니다.
3. 변경된 입력을 커밋하고 고정 Sobaya 런타임의 `approve.sh --replace`로 교체 승인을 기록합니다. 이전 기준선과 실행 기록은 보관합니다.
4. 남은 두 항목, 전체 최종 gate, 독립 완료 리뷰, 실제 Chrome 복구 흐름을 검증한 뒤 기존 PR #16에 통합합니다.

현재까지 네 개 항목의 체크포인트는 완료됐지만, 전체 기능 완료나 PR 갱신 완료를 주장하지 않습니다. [교체 전 하네스 상태](prior-harness-state.json) · [워커의 원인 판정](worker-defect.json)
