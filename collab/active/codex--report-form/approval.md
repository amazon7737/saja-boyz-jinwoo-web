# 제보 UI 승인 기록

2026-10-13 사용자가 이 채팅에서 "승인한다"라고 답했다. 직전 승인 요청은 PR #15의 제보 입력·검증·첨부 선택 UI 범위와 docs/drafts/report-form/review.ko.md의 정확한 실행 입력을 가리킨다.

- 승인된 정책: 필수 5개 항목, 제목/장소/내용 100/200/5000자(trim 후), 선택적 JPEG·PNG·WebP·MP4·WebM 첨부 최대 3개/각 10 MiB, 오류 묶음 전체 거부와 기존 선택 보존, 입력 확인 및 미전송 안내.
- UI-first 범위다. 실제 접수 API·서버 저장·업로드·영구 브라우저 저장·지도 좌표 추출은 포함하지 않는다. 공용 AppShell과 현재 분류를 유지한다.
- `spec.md`는 승인된 proposal.md, `failed-test.md`는 승인된 failed-test.draft.md를 바이트 그대로 복사했다. 역사적 "승인 전" 표현은 원문 보존을 위해 그대로 두며, 현재 승인 여부는 이 기록과 하네스 baseline이 증명한다.
- 정확한 원본 SHA-256은 evidence/draft-inputs.json 및 검토본에 남아 있다. 복사 전 모든 해시를 확인했다. 실행 코드·헤더·기존 테스트는 바꾸지 않았다.
- 구현 전 최신 dev 78ebbc8(솔피 PR #14)을 일반 merge로 반영했다. 제보 제품 변경과 겹치지 않는다.
- 모든 누적 테스트 헤더/본문의 lint exit 0을 확인했다. 초기 항목의 미래 helper 미사용 warning은 기존 lint 계약을 변경할 이유가 아니며, 전체 6개 파일에서는 warning이 없다.
