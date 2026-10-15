# codex/article-image-fallback · amazon · 2026-10-05
- claim: collab/active/codex--article-image-fallback/claim.md

## 이벤트
- added collab/active/codex--article-image-fallback/ 이미지 실패 명세·새 DOM 테스트2개·jsdom 지원안·전체 설명 주석 검토본을 준비함 → 정확한 신규 입력 승인 전 구현 완료나 승인 baseline으로 취급하지 말 것.
- rule 기존 API8개·기존13개 테스트와 서버 조회·공용 UI는 보존 대상임 → 이미지 오류 처리만 작은 client 영역으로 구현하고 솔피 공용 필터/URL 어댑터를 중복 작성하지 말 것.
- added collab/active/codex--article-image-fallback/evidence/ pinned 행동 RED2개·기존21 PASS·실제 HTTP404 브라우저 증거를 보존함 → 전체 GREEN 또는 후속 기능 완료 증거로 해석하지 말 것.
- added collab/active/codex--article-image-fallback/pagination-ui-proposal.md raw offset/중복/정렬/재시도/공용 계약의 후속 제안 → 미확정 권장값을 이번 이미지 테스트 승인에 포함하지 말 것.
- rule PR #2/#3은 외부 승인0건으로 보호 조건 미충족임 → 승인1명과 필수 CI를 충족한 뒤 선행 PR부터 squash하고 후속에는 dev를 merge할 것.

## 남은 것
- 사람이 review.md의 새 명세·정확한 테스트2개·공통 헤더·jsdom27.4.0 package/lock 지원안을 검토해야 한다. 이전 API 테스트/설정 승인은 유효하며 재승인 대상이 아니다.
- 승인 뒤에만 spec.md·failed-test.md·지원 파일을 새 baseline에 기록하고 pinned83af28d로 항목별 구현/전체23개 검증/브라우저/독립 완료 리뷰를 진행한다. 아직 소스·실제 package/lock·기존 테스트·승인 상태는 변경하지 않았다.
- 더 보기는 버튼1회/raw20행/세션전체ID중복제거를 권장하는 제안이다. 페이지 UI·URL/뒤로가기 유지·동적 offset 한계·미지원필터 표시 방식은 별도 결정이다.
- 상세의 실제 데이터, 제보 저장/첨부/인증/검토, 사건 수집 범위·갱신 주기, 배포 대상/운영 환경은 미확정이다. 운영 배포·API 수집 POST·다른 채팅 메시지는 실행하지 않았다.
- 기존 정상 로컬3002는 유지했고 404 재현용 임시3004/39072만 종료했다. 솔피의 공용 UI/URL 어댑터 공유 진척은 이전 확인 이후 바뀌지 않았다.
