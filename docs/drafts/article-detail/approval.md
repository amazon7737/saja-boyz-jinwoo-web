# 기사 상세 실행 입력 승인

2026-10-11 사용자 응답: **“승인한다”**.

직전 요청에서 제시한 `review.ko.md`의 신규 테스트 8개와 기존 테스트 4개 대체안, `proposal.md` 명세의 등록을 승인했다. 구현·검증 후 `dev` 대상 PR 생성은 이미 요청받았다.

- `proposal.md`를 내용 변경 없이 `spec.md`로 등록한다.
- `failed-test.draft.md`를 내용 변경 없이 `failed-test.md`로 등록한다.
- `existing-tests.patch`만 기존 테스트에 적용한다. 공유 헤더와 나머지 테스트는 보존한다.
- 정확한 검토 입력의 해시는 `verification.md`에 있다. 초안 문서의 당시 상태 표시는 이 승인 기록으로 갱신한다.

## 구현 참고

Figma 상세 노드 `11:2043`을 2026-10-10에 컨텍스트와 렌더로 확인했다. 상세 헤더, 22px 굵은 제목, 약 190px 높이의 대표 이미지, 14px/22px 요약, 14px 모서리와 빨강 테두리의 공유 버튼을 기존 색상 토큰으로 구성한다. 공용 AppShell은 현재 상세에도 브랜드 헤더·하단 메뉴를 제공하므로 유지하고, 상세 본문 안에 목록 이동·닫기·기사 정보를 배치한다. 지도·검색 화면·전역 토큰·의존성 변경은 필요하지 않다.

시안의 닫기 아이콘 원본은 `https://www.figma.com/api/mcp/asset/23c59def-2a86-42ce-a868-6b2ad2b77cdc/91fb1.svg` (24×24)이다. 사용할 경우 프로젝트 `public/`에 보관해 참조한다. 기사 대표 이미지는 실제 API 이미지를 사용하며 시안의 샘플 사진은 사용하지 않는다.

검증용 Node.js 24 실행 경로는 `/Users/kangminkim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`이다. 원격 서버 키나 비밀값 없이 mock과 로컬 테스트 서버로 전체 테스트를 실행할 수 있다.
