# 테스트 배열 타입 교체안 — 검증 및 재개 기록

2026-10-02. 현재 승인본은 보존되어 있으며 타입 교체안은 추가 승인 대기 중이다.

## 현재 상태

- 사용자가 승인한 포맷 교체를 `8d28094360a3200f7fed087b0f8a7d95c66be63c`에 반영하고 공식 approve를 기록했다.
- 첫 loop 실행에서 외부 `SOBAYA_ROOT`가 기존 셸 fixture에 유입되어 hooks/sobaya 테스트가 실패했다. 이 설정을 제거한 재실행은 전체 suite에서 `incidentCards`만 의도한 단언 RED로 확인했다.
- 첫 worker가 시작된 뒤 아래 타입 오류를 확인하여 runner를 종료했다. 구현 소스는 여전히 승인된 null stub이며 변경이 없다. 종료 코드 130이고 worker PID/PGID 48388이 모두 사라진 것을 별도 확인했다.
- `.git/sobaya/state.json`의 기존 승인·RED 증거는 보존되어 있다. calls=1, active=incidentCards/implement, receipts=[]이며 완료 체크포인트는 없다.
- worker가 만든 untracked `.pnpm-store`는 `/private/tmp/jinwoo-typing-replacement/interrupted-worker-pnpm-store`로 옮겨 보존했다. 소스나 승인 입력에 포함하지 않는다.

## 오류와 최소 수정안

실제 `pnpm run typecheck`가 materialize된 첫 테스트 68행에서 TS2345로 실패했다.
`html.match(...) ?? []`의 추론 타입은 `[] | RegExpMatchArray`이며, `cards[0]`은 `string | undefined`이다.
카드 개수에 대한 Vitest 단언은 TypeScript 타입을 좁히지 않는다.

`failed-test.typing-proposal.md`는 첫 `incidentCards`의 `cards` 선언에 `: string[]`만 추가하고 Prettier 줄바꿈을 적용한다.
`review.typing-proposal.md`는 공유 헤더·다섯 테스트 및 기존 실행 지원의 전체 설명본이다.
타입 주석 변경이지 단순 포맷 변경은 아니다. 기존 fixture·단언·기대값은 그대로다.

## 검증 결과

- 제안의 공유 헤더와 다섯 테스트를 실제 앱 TypeScript 프로그램에 메모리상으로 합성: 오류 0건.
- 제안 전체 materialization을 앱 `.prettierrc.json`으로 검사: 통과.
- 기존 다섯 테스트와 제안 다섯 테스트를 transpile한 JavaScript가 바이트 단위로 동일하다. SHA-256: `269e704c2eb7be5cbb078e3684830472f29e41ee4e5c33f6c478c3767ec98c2d`.
- 설명본의 standalone `// 검토:` 줄만 제거한 첫 여섯 블록이 제안의 여섯 실행 블록과 정확히 일치한다.
- 공식 pinned probe로 변경된 첫 항목을 실행: 카드가 0개여서 2개 기대 단언에 실패하는 정상 RED, 종료 0.
- 별도 agent가 타입 검사·포맷·동일 JavaScript·설명본 대응을 독립 재확인했다.

## 추가 승인 후 재개

1. 사용자에게 제시한 타입 변경과 기준선 교체 승인이 있어야 한다. 승인 전 현재 테스트·plan·state를 수정하지 않는다.
2. 기존 승인 상태와 중단 실행 로그를 보관한다. 구 승인본으로 materialize된 첫 테스트는 승인된 교체 절차에서 교체하고, 제안의 정확한 실행 블록을 새 plan에 반영한다.
3. 변경 입력을 커밋한 후 pinned `approve.sh APP --replace`로 새 기준선을 기록한다. 구현 stub을 기준으로 첫 항목부터 RED를 다시 측정한다.
4. pinned loop는 `sh scripts/collab.sh run -- bash <pinned>/tdd-set/bin/loop.sh <app> 5`로 실행한다. 외부 `SOBAYA_ROOT`는 export하지 않는다. Node 24.19.0/pnpm 10.34.6 PATH를 사용한다.
5. 전체 suite·format·lint·typecheck·build·gate·HEAD 기준 독립 review·브라우저 검증 후에만 완료로 판단한다.

## 준비된 화면 검증

별도 disposable preview: `/private/tmp/jinwoo-incident-preview-kLt2JU`.
최종 구현 후 `refresh-from-app.sh`, `start-preview.sh` 순서로 실행하면 port 3001에서 normal/no-image/empty/loading을 검토할 수 있다.
393px wrapper, 샘플 데이터 표시, Figma 제공 썸네일 다섯 개, 인코딩된 ID 확인용 임시 상세 목적지가 준비되어 있다.
현재는 stub 복사본이며 서버는 시작하지 않았다. 실제 앱 port 3000과 production route는 변경하지 않았다.

## 회고

승인 요청 전에 개별 RED만 확인하면 TypeScript 타입 오류를 놓칠 수 있다. 전체 계획을 실제 설정으로 합성하여 typecheck와 formatter까지 실행한 뒤 하나의 검토 패키지로 제시해야 한다.
Brain: 공유 루트 작업과 섞지 않도록 변경 없음. Skills: 변경 없음. Structural: 변경 없음. Todos: 이번 교체 승인과 실행 재개를 이 문서에 기록.

## 추가 승인 반영

사용자가 후속 메시지 “승인한다”로 위 타입 수정과 기준선 교체를 명시적으로 승인했다. 제안의 여섯 실행 블록과 실제 plan의 바이트 일치를 다시 확인했다. 이전 materialized 테스트·plan·승인 상태는 .git/sobaya-history/2026-10-02-before-typing-replacement에 보존하고, 승인된 null stub에서 새 기준선을 시작한다.
