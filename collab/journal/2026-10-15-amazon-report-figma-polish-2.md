# codex/report-figma-polish · amazon · 2026-10-15

- claim: collab/active/codex--report-figma-polish/claim.md

## 이벤트

- changed src/app/report/page.tsx Figma11:2221 기준 필드 높이·위치 아이콘·첨부 영역·하단 제출 배치와 닫기44px 클릭 영역 마감 → 기존 접수/재시도/오류 복구 계약을 유지하며 후속 시안 검토는 verification.md의 실제 상태·예외를 참고할 것.
- done src/app/report/page.tsx 전체102테스트·정적 검사·production build와 320/393/가로 브라우저 검증 완료 → 이 브랜치의 제보 본문 디자인을 중복 구현하지 말고 dev PR을 검토할 것.

## 남은 것

- dev 대상 PR 리뷰·병합. 운영 배포는 기존 dev→main 통합 흐름을 따른다.
- 이번 범위에 지도 지역 숫자 원, 목록·상세의 후속 시각 마감은 포함하지 않았다. 공용 카드 변경은 담당 간 범위 확인 후 별도 작업으로 진행한다.
- 모바일 OS 키보드와 실기기 safe-area는 데스크톱 반응형 검증과 별개다.
- 하네스 pin·공유 hook·기존 spec은 변경하지 않았다. 현재 checkout에서 활성 step/loop는 없으며 테스트와 빌드가 통과한 경계다.
