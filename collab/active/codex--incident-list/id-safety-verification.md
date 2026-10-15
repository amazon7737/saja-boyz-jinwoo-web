# 승인된 ID 예외 처리 검증

- 기준선: `3b581746b16bee0fe45d5b5bcecb6b9da842bbcc`.
- 구현 체크포인트: `db70d59a244152a6d71a9229e5c97a18e2a85b31`.
- 공식 step에서 incidentUnsafeIds의 RED를 확인한 뒤 구현하고 전체 13개 테스트와 format·lint를 통과했다. 별도 typecheck·production build도 성공했다. 기존 테스트·지원 코드·제한시간은 유지했다.
- 소스 SHA-256: `6e76a15ef150b4d066b1fec72f24f337ca10445d3240d45bb2caa7f5fb94c4a1`. CSS Module은 이전 검증과 동일하다.

## 브라우저

동일 소스를 복사한 임시 프리뷰에서 393×852px 뷰포트로 확인했다. 샘플 데이터임을 화면에 명시하고 실제 라우트·API는 수정하지 않았다.

- 빈 ID·`.`·`..`·단독 상위 서로게이트·단독 하위 서로게이트 카드 각각에서 제목·요약과 “상세 정보 없음”이 표시됐다. 카드마다 링크와 포커스 가능 요소는 모두 0개였다.
- 위 다섯 카드 뒤 정상 ID 카드에는 상세 링크가 1개 존재했다. 툴바 마지막 링크에서 Tab을 눌러 정상 카드로 바로 이동하고, Enter로 `/incidents/valid-after-invalid`에 도착했다. 프리뷰 목적지의 ID는 `["valid-after-invalid"]`였다.
- 일반 특수문자 ID `sample/서울 ?`의 카드도 기존 인코딩 경로로 실제 이동했고 단일 경로 구간을 유지했다. 실제 상세/API 소비 측의 decode-once 계약 확인은 후속 범위다.
- 정상 목록의 카드 5개와 80×80px 이미지 5개가 모두 로드됐다. 정상·예외 화면 모두 문서 scrollWidth가 뷰포트와 같은 393px였고 콘솔 경고·오류는 없었다.
- 임시 뷰포트 설정은 검증 후 복원했다. 프리뷰 서버는 로컬 3001 포트이며 사용자가 볼 수 있도록 일반 목록 탭을 남겼다.

로컬 화면 증거: `/private/tmp/jinwoo-id-safety-final.jpg`, `/private/tmp/jinwoo-incident-list-approved-final.jpg`. 프리뷰 소스 대조는 `/private/tmp/jinwoo-incident-preview-kLt2JU/source-fingerprint.txt`에 있다.

별도 읽기 전용 코드 검토에서 새 계약의 동작·접근성·정상 ID 보존에 대한 추가 지적이 없었다. 공식 최종 gate와 HEAD 기준 독립 review는 이 기록의 커밋 후 실행한다.
