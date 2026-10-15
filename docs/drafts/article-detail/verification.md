# 기사 상세 초안 검증 기록

2026-10-10 · 제품 기준 HEAD `e97241a` · dev 기준 `f5bc8cf`

## 기존 동작과 운영 API

- Node.js 24 런타임으로 `./node_modules/.bin/vitest run` 실행: 12 파일, 40 테스트 PASS, 116.59초. 협업 훅 테스트의 샘플 동료 충돌 메시지는 테스트 픽스처 출력이며 실제 이 브랜치의 파일 충돌이 아니다.
- 운영 `GET /news/2378404d1e9e182697a17deb150bf51757c6fd3728d13872c699fcf9713e8ff0`를 읽어 기사 객체, `image_status=ready`, 해당 ID의 상대 이미지 URL 반환을 확인했다. 뉴스 수집이나 이미지 생성을 요청하지 않았다. 이번 조회는 이미지 파일 자체를 다시 다운로드한 검증은 아니다.
- Figma 상세 11:2043 및 공유 34:3311의 구조와 렌더를 확인했다.

## 최종 신규 probe

고정 Sobaya `83af28d`의 `probe.sh`로 각 본문을 공통 헤더와 함께 실행했다. 임시 파일은 제거됐으며 기존 src 파일은 변경하지 않았다. RED는 초안이 실행되고 현재 없는 동작 때문에 실패했다는 증거다. 모든 뒤쪽 단언이 독립적으로 검증됐다는 뜻은 아니다. 구현 뒤 각 checkpoint에서 전체 suite를 다시 검증한다.

| 항목 | 결과 | 초기 실패 근거 |
| --- | --- | --- |
| 1. articleDetailRequestAndContent | RED | 현재 상세 페이지가 항상 notFound로 종료 |
| 2. articleDetailFailureStates | RED | 유효 ID의 API 조회 1회 기대와 실제 0회가 다름 |
| 3. articleDetailSafePresentation | RED | 현재 상세 페이지가 항상 notFound로 종료 |
| 4. articleDetailTimeout | RED | 현재 상세 페이지가 항상 notFound로 종료 |
| 5. articleDetailImageFailure | RED | 현재 상세 페이지가 항상 notFound로 종료 |
| 6. articleDetailShareUrl | RED | 현재 상세 페이지가 항상 notFound로 종료 |
| 7. articleDetailLinksFromListAndSearch | RED | 카드 제목의 내부 상세 링크가 없음 |
| 8. articleDetailRouteBoundaries | RED | 상세 loading/not-found 진입점이 없음 |

## 기존 테스트 대체안과 초안 품질

- 기존 네 대체 본문은 각각 probe GREEN. 신규 기능 항목으로 중복 등록하지 않는다. 과거 상세 링크 금지 조건을 제거한 상태에서도 baseline을 유지하고, 실제 링크 존재는 새 진입 테스트가 요구한다.
- `git apply --check docs/drafts/article-detail/existing-tests.patch` PASS. 실제 패치를 적용하지 않았다.
- 신규 헤더 + 누적 본문 1~8 모두 ESLint 오류·경고 0.
- 가상 CompilerHost로 전체 tsconfig에 신규 테스트를 포함한 TypeScript 검사: 진단 0. 제품 소스나 .next 파일을 쓰지 않았다.
- 독립 초안 검토 후 추가 조치 사항 없음. 처음 발견한 glob 제네릭 타입 오류, 위험한 상대 링크 차단 누락, clipboard 완료 전 상태 검증 누락, HTML 파서가 중첩 링크를 숨기는 문제를 수정했다.
- 검토본 15개 코드 블록에서 새 `// 검토:` 줄만 제거하면 실행 헤더·본문과 바이트 단위로 일치한다.

## 검증하지 않은 것과 후속 단계

- 프런트 제품 구현·브라우저 QA·최종 빌드·gate·독립 완료 리뷰·PR은 아직 하지 않았다. 사용자가 정확한 테스트 대체안과 신규 입력을 승인한 후 진행한다.
- 네이티브 공유창과 클립보드는 mock을 사용한다. 실제 OS 공유 UI, 권한 동작, 이미지 외관, 모바일 배치는 구현 후 별도로 확인한다.
- 현재 앱에 승인 baseline은 없다. 직접 doctor는 기존 협업 pre-commit 래퍼를 사용자 훅으로 경고하며, 공통 git-dir의 실제 Sobaya 훅은 이미 고정 런타임을 가리킨다. 기존 훅과 팀 lock을 유지한다.

## 검토 입력 식별

| 파일 | SHA-256 |
| --- | --- |
| failed-test.draft.md | `c10f5d3cf8db2e629a57bc84d47d4849628de39bb86a85bf604ffd9153a4b4c6` |
| replacement-tests.md | `a4fc8af9e924b71770d279c67a0fce0d52b78db658db7d1955f0be58d6c3670a` |
| existing-tests.patch | `1cb2bef1cb5e208087fefb6ae92fa968fea1d64051788b4ba0b514ef91559d6c` |
