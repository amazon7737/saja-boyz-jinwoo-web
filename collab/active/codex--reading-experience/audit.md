# 간격·로딩 감사
- 기준 origin/dev a924bdd, 제품 소스 수정 없음. 원래 체크아웃의 next-env.d.ts 사용자 변경 유지.
- Chrome320/393/640 각 지도·검색·목록·제보 캡처12장과 실측 metrics.json은 evidence/baseline/.
- 유틸리티는 정상 적용된다. 검색 form36px/내부 버튼44px 불일치, 내비 탭/가운데 버튼 gap0, 추천 chip gap 미지정과 pending 문구 확장이 확인됐다.
- sourcecard는 padding12, list card gap12, 검색 card gap8. 검색 결과도12로 정리하고 내부 본문·제목 줄간격을 읽기 편하게 조정한다. 상세 현재 gap16·본문22px는 양호해 전면 확대하지 않는다.
- /tmp 복제본에서 정확 draft10개 실행: 기존 API1 PASS, 요구 변화9 RED. 첫 실행 늦은 응답 테스트1개가 자동 요청 부재로 timeout이어서, 승인 전 요청 횟수 단언을 추가해 재실행(3개 기능 assertion RED/API1 PASS)했다. import/빌드/문법 오류 없음.
- 복제본 tsc --noEmit --incremental false 종료0. Prettier로 모든 정확 TS 초안 포맷 완료.
- RED는 현재 UI의 미구현 증거이며 전체 스위트 통과·구현 완료 증거가 아니다.
- 신규2개·기존7개 이관의 정확 초안 승인 후 Sobaya 등록·구현·전체115개·format/lint/typecheck/default build·독립 review·실제 브라우저 전후 비교·PR 진행.
- 외부 API는 조회만, 제보 전송 검증은 로컬 fixture만. 코멘트 게시 전 문구 확인 필요.
