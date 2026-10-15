# 지도·검색 후속 검증
검증 제품 소스: 6a2640113347a3aa244eea28c5ec90a064e7f2ba. 이후 저널·계획 보관 커밋은 src/public 제품 파일을 바꾸지 않는다.

- Sobaya 승인 항목5개 체크 완료. 초기 승인25c97b2와 교체 승인565c759의 이력은 런타임에 보존했다.
- 기존109개 중 동일 좌표 표시 기준1개만 승인 변경, 나머지108개 본문 보존. 신규 지도3개와 검색 강조1개를 추가해27파일·113개 전체 테스트, 실패/skip0.
- 테스트·지원 파일·AGENTS·의존성31개 해시가 승인된 교체 기준과 동일. 5개 정확 계획 본문이 현재 테스트에 포함됨을 대조했다.
- format:check·lint·typecheck·기본 production build 통과. 워커의 포트 거부 오류가 생성 캐시에 남아 처음 기본 빌드가 즉시 실패했으나 .next만 별도 보관하고 동일 명령으로 통과했다. 의존성·검증 명령·런타임은 변경하지 않았다.
- 최종 review.sh의 전체 gate와 별도 Astra 읽기 전용 리뷰 통과. 초기 리뷰의 정렬 누락/묶음 변경 후 포커스 대상 소실은 보정했다. 시각 마감은 같은 소바야 앱 실행 어댑터를 이용했으며 추가 TDD 항목 영수증으로 표시하지 않는다.
- 원격21920e6의 dev bf299905(PR22) 동기화를 merge로 보존했다. 제보 코드는 origin/dev와 바이트 동일하다.

## 실제 Chrome / Naver SDK
393×790와320×790에서 실제 production 빌드·Naver SDK를 사용했다. 합성 fixture와 운영 공개GET을 구분했다.
운영 울산2지역이48px 숫자2로 합쳐지고 확대하면 각각1로 분리된다. 합계는 고유 article_id이며 대표점은 원본 지역 좌표다.
화면 캡처는 테스트가 지도를 직접 이동·확대해서 찍은 것으로 앱의 자동 카메라 이동을 의미하지 않는다.
동일 묶음에서 리사이즈 시 마커 DOM·선택 시트 유지, 실제 묶음 변경 시 오래된 시트 해제, Enter/닫기 포커스 복귀와 기간·카드·카메라 동기화를 확인했다.
출처 링크와 기사 위치 보기의 세로 중심은 두 폭에서 모두130px, 차이0px이며 가로 넘침이 없다.
운영 ai/Ai 검색은 각5개 제목의 원래 AI 표기를 그대로 강조한다. 제목·설명 반복/혼합 대소문자·리터럴 특수문자는 회귀 테스트에서도 검증했다.
해당 실행은 운영GET6회, 쓰기0회, pageerror0개다.

[브라우저 결과](evidence/followup/browser-report.json) · [원 겹침](evidence/followup/map-live-cluster.png) · [확대 분리](evidence/followup/map-live-split.png) · [ai 검색](evidence/followup/search-live-lowercase.png) · [Ai 검색](evidence/followup/search-live-mixedcase.png)

실기기 OS 공유창·가상 키보드·safe-area는 이번 후속 검증에 포함하지 않는다. GitHub 코멘트는 문구 승인 전 게시하지 않는다.
