# 제보 초안 검증 기록

2026-10-13 · 구현 전 검토 · 사용자 범위 및 정확한 실행 입력 승인 대기

## 기준선

- 원격 dev: `b405d3a792929ace597de7366e838578dbb52675`.
- 작업 선언 커밋: `ed5c63b` (`codex/report-form`). 앱 제품 코드·기존 테스트·package.json·lockfile·AGENTS.md는 dev와 동일하다.
- 팀 고정 Sobaya: `83af28db653c29a54be880ae49671725b6bbbcc4`.
- Node `24.19.0`, pnpm `10.34.6`. 같은 lockfile의 기존 pagination worktree node_modules를 로컬에서 연결했다. 링크는 Git에 포함하지 않는다.
- 기본 호스트 Node 26/pnpm 자동 전환은 네트워크 접근 실패로 첫 커밋의 포맷 검사를 실행하지 못했다. 기존 Node 24와 정확한 pnpm 실행 경로를 지정한 후 포맷·lint가 통과했다. 의존성·승인 검사를 완화하지 않았다.

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| 기존 전체 `./node_modules/.bin/vitest run` | 16개 파일, 61개 테스트 PASS. 121.91초. `SOBAYA_ROOT`를 해제해 fixture가 자기 하네스를 사용하도록 했다. |
| 기존 소스 포맷·lint | 작업 선언 커밋 훅에서 PASS. |
| 기존 `pnpm run typecheck` | Next route typegen 및 TypeScript PASS. |
| 정확한 초안 헤더 + 6개 테스트의 가상 파일 TypeScript 검사 | PASS. 소스에 실행 테스트 파일을 추가하지 않고 검사했다. |
| 동일 초안 전체 ESLint stdin 검사 | PASS. 실행 대상 경로를 `src/app/report/report-form.test.ts`로 지정했다. |
| 후보 6개 개별 Sobaya probe | 전부 실제 assertion 실패로 RED, exit 0. 임시 probe 파일은 도구가 제거했다. |

첫 첨부 probe는 하네스가 문자열 `split(',')` 안의 `it('`를 두 번째 test 선언으로 오인하여 실행하지 못했다. 초안의 동일 의미 표현 `split(/,/)`로 바꾼 뒤 재실행했다. 도구·승인 기준·기존 테스트를 변경하지 않았다.

최종 probe 로그: [1](../../../collab/active/codex--report-form/evidence/probe-1.txt), [2](../../../collab/active/codex--report-form/evidence/probe-2.txt), [3](../../../collab/active/codex--report-form/evidence/probe-3.txt), [4](../../../collab/active/codex--report-form/evidence/probe-4.txt), [5](../../../collab/active/codex--report-form/evidence/probe-5.txt), [6](../../../collab/active/codex--report-form/evidence/probe-6.txt).

현재 페이지는 준비 안내만 렌더한다. 첫 후보는 제보 제목이 다르고, 나머지는 폼/필드/파일 입력이 없어 실패한다. 뒤쪽 assertion까지 실행된 것은 아니다. 이후 첫 항목 구현이 다른 항목도 만족시키면 ALREADY GREEN으로 기록하며 억지로 실패를 만들지 않는다.

## 독립 초안 리뷰 반영

- 기본 HTML 제출을 막지 않고도 통과하던 허점을 수정해 cancelable submit 이벤트의 `defaultPrevented`를 검사한다.
- 첨부 개수 초과 뒤 기존 3개 모두와 개수가 보존되는지 확인한다.
- 사용자 문자열의 HTML 비실행 검사 범위를 `img[src="x"]`, `[onerror]`로 좁혀 정상 디자인 이미지를 금지하지 않는다.
- 오류 도움말이 비어 있지 않다는 약한 조건 대신 해당 필드의 구체적 오류 문구를 검사한다.
- 파일 fixture에 `item(index)`를 포함해 표준 FileList 접근 방식을 불필요하게 막지 않는다.

## 증거의 한계

- 실제 제보 API, 저장소, 승인된 신규 테스트는 없다. `approve.sh`, 구현 worker, final gate, 완료 리뷰를 실행하지 않았다.
- 폼은 아직 구현하지 않았으므로 신규 기능의 브라우저 검증·빌드를 완료했다고 주장하지 않는다.
- jsdom의 `files`는 실제 OS 파일 선택창의 FileList가 아닌 배열 기반 metadata fixture이고, 용량은 `size` 속성으로 모사한다. 실제 파일 내용 검사·네이티브 재선택을 검증하지 않는다.
- fetch 및 Storage.setItem spy는 그 호출만 확인한다. 모든 네트워크 경로·모든 저장소 접근을 포괄하지 않는다. 기본 제출 차단은 별도 확인하며 구현 후 브라우저 요청 기록도 확인해야 한다.
- Figma 렌더·컨텍스트는 확인했으나, AppShell 유지와 CTA 명칭 변경은 사용자가 검토할 제안이다.
