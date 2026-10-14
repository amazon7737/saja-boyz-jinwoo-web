# codex/figma-ui-foundation · easter721 · 2026-10-14
- claim: collab/active/codex--figma-ui-foundation/claim.md

## 이벤트
- added src/components/layout/ Brand·SearchHeader·ArticleFilters·BottomNavigation 공통 기반 → 새 공통 UI를 중복 구현하지 말고 각 컴포넌트 폴더를 사용할 것
- changed src/components/layout/app-shell/app-shell.tsx 지도/목록/검색 조합과 상세·제보 전용 화면 구분 → 전용 화면에 공통 검색 헤더·주 메뉴를 추가하지 말 것
- changed src/app/globals.css Inter/Pretendard 공식 로컬 폰트와 #f8fafc 배경·기본 line-height 적용 → 외부 폰트 CDN과 임의 대체 폰트를 추가하지 말 것
- changed src/features/map/ui/map-home/map-home.tsx 전체 높이 지도와 공개 SDK 컨트롤 배치 연결 → 기본 로고·저작권·축척 및 init/resize/선택 여유·종료 정리를 유지할 것
- changed docs/ui-contract.md 과거 scaffold·가상 필터 계약을 실제 구현으로 교체 → 현재 경로·API 계약을 확인하고 필터는 준비 중 disabled를 유지할 것
- rule docs/figma-analysis.md 링크45:3421을 전체 기준으로 삼지 않고 화면별 밝은 시안과 실제 데이터로 대조 → 지역 고정 대표 좌표/고유 기사 수 숫자 원(1건 포함), 크기 변화는 다음 지도 작업에서 구현할 것
- done codex/figma-ui-foundation 공통 기반 구현·모든 화면 대조·gate·새 독립 review 완료 → dev 대상 PR에서 공통 기반을 먼저 검토할 것

## 검증
- 검증·독립 리뷰 소스 HEAD: ce49cd7cc6be41e5164ef21dba5f42298f7442a4. Sobaya83af28d, baseline 7b20675a418aee55fb96227fab36c73896c2ff4b, 네 RED/GREEN receipt와 기존97+신규4=101개 유지.
- review.sh의 내부 전체 gate(format:check·lint·정확한 전체 Vitest)와 read-only Astra 독립 리뷰 통과. review.head가 검증 당시 HEAD와 일치하고 미완료 항목은 없다. 상세 결과는 active 산출물 final-review.json.
- 기본 production build·타입 검증 통과. 실제 Chrome/Naver SDK/운영 API 읽기 전용 화면, 로컬 폰트/SHA256·52/68/54/64×24px 실측, 320/393/가로/1440px, 검색→상세·새로고침·공유 미지원 복사, 합성6기사 시트·빈 결과·404·API500 검증 통과. 운영 제보 POST·배포는 하지 않았다.
- 원본 테스트·mock·fixture·테스트 명령·의존성 보존. 부모는 검증/문서/Git, 제품 소스는 네 Sobaya 항목과 여섯 앱 측 어댑터 보강 작업이 담당했다. 보강을 추가 TDD receipt로 표시하지 않는다.
- 이 마지막 커밋은 저널·claim·리뷰 증거·계획 보관만 변경한다. 최종 브랜치 HEAD와 위 소스 HEAD의 차이는 해당 메타데이터이며 이 뒤 Sobaya 명령을 다시 실행하지 않는다.

## 남은 것
- 전체 디자인 완료가 아니다. 지역 숫자 원/개수별 크기/가로 카드 → 검색·목록 카드 → 상세·선택/공유 시트·제보 본문 순서로 새 dev 기반 claim과 Sobaya 승인 항목을 만들어 진행한다.
- API에 없는 카테고리·상태·발생 시각·타임라인·인용 수·주소 검색은 계약을 먼저 정한다. 디자인 예시 데이터를 실제 정보로 만들어 넣지 않는다.
- 모바일 OS 공유창은 실제 기기로 확인한다. Web Share/복사와 제보60초 제한/입력·첨부/재시도 키/오류 경계를 유지한다.
- 정확한 화면별 기준·남은 차이는 active 산출물 visual-verification.md와 browser-metrics.json. 실패했던 padding/새 컨트롤 방식은 최종 소스에 남아 있지 않다.
