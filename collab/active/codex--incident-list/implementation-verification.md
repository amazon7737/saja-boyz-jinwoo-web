# 사건 목록 본문 구현 검증

## 검증 대상

- 승인 baseline: `ba204a87dcf61458c83523fc658f705b7a2024f8`.
- Sobaya의 다섯 체크포인트가 통과한 뒤 명세의 Figma 크기·배치를 컴포넌트와 CSS Module에 반영했다. 승인된 테스트, 실행 지원, 명세는 변경하지 않았다.
- 컴포넌트 SHA-256: `6c5ac582bf859cbfcb3912344b9fb7c1b61c348a6769a9ee1880de9382e6038a`.
- CSS Module SHA-256: `275df9eb0e292e0daeee50485580e3beebdc4241a8c20ad10a1e8a8b5416faff`.
- 실제 라우트와 API는 연결하지 않았다. 샘플 데이터·검토 도구는 임시 프리뷰에만 있다.

## 자동 검사

- Node 24.19.0 / pnpm 10.34.6에서 `pnpm run check` 성공: lint, typecheck, 전체 Vitest 12개, production build. 전체 테스트 실행 시간 129.69초.
- 전체 테스트에는 기존 필터 테스트 4개와 셸 하네스 3개가 포함된다. 셸 테스트의 기존 제한시간과 본문은 유지했다.
- `pnpm run format:check` 성공.
- 별도 읽기 전용 에이전트가 명세·승인 테스트와 최종 소스를 대조하여 조치할 기능·접근성 회귀나 범위 위반을 발견하지 못했다. Sobaya의 HEAD 기준 최종 gate·review는 소스 커밋 후 별도로 수행한다.

## 브라우저 검증

앱과 동일한 컴포넌트·CSS·공용 타입·라벨·전역 스타일을 복사한 임시 Next 프리뷰에서 확인했다. 합성 사건 데이터와 고정 시각을 사용했으며 화면에 “컴포넌트 검토용 · 샘플 데이터”를 명시했다.

- 393px 화면: 문서 너비와 scrollWidth가 모두 393px. 목록 좌우 여백 16px, 위아래 8px, 카드 간격 12px, 카드 padding 12px·radius 14px, 썸네일 80×80px·radius 8px, 제목 14px·메타 11px를 실제 DOM 스타일로 확인했다. 사진 다섯 장이 로드됐다.
- 사진 없음: 첫 카드의 이미지가 제거되고 같은 80×80px 자리에 “사진 없음”이 나타났다. 카드와 링크는 유지됐다.
- 빈 결과: 카드·상세 링크 0개, role=status에 두 안내 문구 표시, aria-busy 없음.
- 로딩: 카드·상세 링크 0개, role=status 및 aria-busy=true, “사건을 불러오는 중” 표시.
- 키보드 Tab으로 첫 카드 링크에 진입하고 3px 포커스 테두리를 확인했다.
- 특수문자 id `sample/서울 ?` 카드 클릭이 `/incidents/sample%2F%EC%84%9C%EC%9A%B8%20%3F`로 이동했다. 임시 상세 페이지가 받은 경로 구간은 하나였고, percent-encoded 값에 decodeURIComponent를 한 번 적용하면 원본 id가 됐다. 실제 상세/API 연결 시 소비 측의 decode-once 계약을 확인해야 한다.
- 콘솔 오류는 없었다. 소스 복사 시 개발 서버의 Fast Refresh 전체 새로고침 경고 1개가 발생했다.
- 현재 샘플에서 가로 넘침은 없었다. 모든 길이의 제목·주소나 실제 API 데이터, production 상세 페이지 동작까지 검증한 것은 아니다.

로컬 증거: `/private/tmp/jinwoo-final-check.log`, `/private/tmp/jinwoo-incident-list-final.jpg`, `/private/tmp/jinwoo-incident-preview-kLt2JU/source-fingerprint.txt`. 임시 경로의 파일은 저장소에 포함하지 않는다.
