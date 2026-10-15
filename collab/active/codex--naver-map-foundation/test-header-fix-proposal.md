# jsdom 타입 준비 오류 수정안

2026-10-10 · 승인 baseline 53dd2873c4bb62b371c0e02ec4b5078e52ec72e7.

## 확인된 문제
최초 초안의 import { JSDOM } from jsdom에는 타입 선언이 없다. pnpm run typecheck에서 TS7016이 나고 기존 recommendedKeywordShowsPendingUntilResultsArrive의 임시 Next 빌드도 이 새 테스트의 타입 오류 때문에 실패한다. 현재 전체 35개 실행 결과: 기존 33개 PASS, 기존 브라우저 테스트는 빌드 준비 오류, 신규 첫 지도 테스트는 예상 assertion RED. 제품 워커는 아직 호출되지 않았다.

## 정확 변경
- test-header-type-fix.txt의 header로 failed-test.md 지도 섹션의 header만 교체하고 수정된 입력을 커밋한 HEAD로 sobaya approve --replace를 기록한다.
- 기존 프로젝트 테스트처럼 @vitest-environment jsdom을 선언하고 Vitest가 제공하는 window/document로 mount·cleanup한다. 직접 JSDOM import·생성을 없애고 global/SDK script/위치 mock cleanup을 해당 환경에서 수행한다.
- 신규 6개 본문·기대값·SDK fixture 동작과 기존 34개 테스트·명령·의존성은 그대로 유지한다. 타입 에러를 숨기는 ignore/expect-error를 추가하지 않는다.
- 현재 런타임이 삽입한 첫 지도 테스트는 동일 body·새 승인 header로 다시 materialize한다. 승인 입력을 업데이트한 뒤 전체 RED→소바야 구현→GREEN/gate/리뷰를 재개한다.

## 검증
- 원본 작업 트리를 건드리지 않는 임시 프로젝트에서 새 header와 그대로인 6개 본문으로 next typegen 및 tsc --noEmit 통과.
- 새 header로 첫 항목 probe는 실행된 테스트의 assertion RED: 지도 오류 안내가 현재 HomePage에 없음. 라이브러리/타입 준비 오류가 아님.
- 정확 header 전체는 test-header-type-fix.txt에 있다. 아직 승인된 failed-test.md와 제품 테스트는 고치지 않았다.
