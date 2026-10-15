# 오류 경계 구현 검증

- 기준 dev: dc020b9(PR #4 병합). 승인 baseline: bd400db.
- 검증·리뷰 소스 HEAD: 9debf1c786b4c795864326266c7723212fb396fd.
- pinned Sobaya83af28d. 승인된 정확 테스트3개, 각각 RED → GREEN. 마지막 receipt는 기존23개 포함 전체26개 통과를 기록한다.
- 최종 loop의 gate(format/lint/전체 스위트/보호 입력/체크포인트)와 별도 fresh read-only Astra 리뷰 완료. completion.json status=complete, review.head가 소스 HEAD와 동일.
- typecheck와 실제 앱 Turbopack production build를 별도로 실행해 PASS. 원본 앱 정상 라우트만 빌드됨.
- source-sha256.json에 최종 소스·테스트·의존성 지문을 기록했다. 최종 보관 커밋은 승인 계획 이동·claim·저널·증거만 변경한다.

## 브라우저
네이티브 Chrome을 cua_repl로 조작했다. 실제 서버/API 오류의 결과는 evidence/browser-observations.md 및 합성 API 요청 로그에 기록했다. QA 복사본의 제품 오류 경계·공용 셸·기존 API/이미지 소스가 원본과 동일함을 browser-source-checks.json으로 확인했다.

- 공용 분류 오류: 안전 안내, 원인 해소 후 재시도 복구.
- 일반 렌더링 오류: 상위 공통 안내, 오류 화면에서 검색 이동 가능.
- 원본 앱 production: 정상 기사·이미지404 대체·API503 후 링크 재시도 복구.
- QA production: 루트 layout 오류에 안전 안내만 표시, 원인 해소 후 retry로 정상 내용과 헤더/주 메뉴 복구.
- 원본 앱에 오류 주입 소스 없음. QA는 별도 임시 복사본과 합성 API만 사용했다.

## 재시도 보완
reset-only는 서버 콘텐츠를 재조회하지 않아 페이지가 복구되지 않는 실제 사례를 확인했다. 미완료 마지막 승인 항목을 재개해 optional retry 우선/reset 호환으로 수정했다. 앱 측 qa-worker command adapter로 구체적인 발견을 전달했고 모델·호출 예산·검증·승인 테스트는 바꾸지 않았다. Sobaya 소스 변경 없음.

## 검증 한계
- 승인 테스트는 reset 호환을 검사한다. Next.js retry 실제 서버 재조회는 별도 브라우저 관찰로 확인했다.
- 독립 리뷰는 소스·타입 검토로 구체적인 결함이 없다고 판단했다. 읽기 전용 환경에서 테스트 임시 파일 생성이 EPERM으로 차단돼 리뷰어가 스위트/브라우저를 독립 재실행했다고 주장하지 않는다. 전체 실행은 호스트 Sobaya gate와 브라우저 관찰로 증명한다.
- QA dev 초기 루트 오류의 retry가 복구되지 않은 사례가 있었다. 같은 제품 소스의 QA production에서는 복구됨을 확인했다. dev overlay의 오류 상세 표시를 production 정보 노출로 해석하지 않는다.
- 글로벌 오류 UI에는 기본 브라우저 스타일을 사용한다. 지도·검색·상세·제보 기능은 구현하지 않았다.

## 기록
- evidence/completion.json
- evidence/independent-review.json
- evidence/browser-observations.md
- evidence/browser-source-checks.json
- evidence/browser-api-requests.ndjson
- evidence/source-sha256.json
