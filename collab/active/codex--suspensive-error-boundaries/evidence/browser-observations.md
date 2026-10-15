# 브라우저 관찰

환경: 네이티브 Chrome를 cua_repl로 조작. 원본 앱의 별도 임시 복사본, Next.js 16.3.8 Webpack dev, 합성 API 39076. 실제 앱에는 오류 주입 소스 없음. 원본 AppShell/FeatureErrorBoundary/ArticleImage/IncidentsPage와 복사본 SHA-256 동일.

- /qa-network: client mount 후 FeatureError(network) throw. 연결을 확인해 주세요·다시 시도 표시. 내부 QA_SECRET_TYPED는 페이지 내용에 표시되지 않음. 흉흉/사건 검색/지도/제보/목록 유지.
- 오류 원인 해소 버튼 후 다시 시도: 정상 내용 복구 표시. fallback 제거.
- /qa-unknown: Error(QA_SECRET_UNKNOWN) throw. 화면을 표시하지 못했어요·다시 시도 표시. 내부 메시지 미표시.
- 오류 화면에서 사건 검색 링크: /search의 정상 placeholder 표시, 오류 안내 제거.
- /incidents success: 합성 기사 2개·발행 시각·원문 링크·AI 생성 이미지 정상 표시.
- 실제 image404로 전환해 reload: 첫 기사도 이미지 없음, 제목·설명·발행 시각·원문 보존.
- API 503로 전환해 reload: 기사를 불러오지 못했어요·다시 시도 링크 표시.
- API success로 복구 후 다시 시도 링크 클릭: 합성 기사 2개·AI 이미지 복원.

주의: 임시 QA 앱 dev 관찰이며 production 런타임 검증과 별도로 기록한다. Next.js dev overlay는 오류 주입에 따른 정상 개발 도구 표시다. 브라우저 console 무오류를 주장하지 않는다.

## 서버 오류 재시도 보완
- reset-only 구현은 /qa-route에서 원인 해소 후에도 오류가 남았다. Sobaya 마지막 항목을 재개해 Next.js retry가 제공되면 retry를 우선 사용하고, 없으면 reset을 사용하는 방식으로 보완했다.
- 보완 후 /qa-route dev: 원인 해소 뒤 다시 시도 → 서버 오류 복구 표시.
- /qa-global dev 초기 루트 실패: 안내는 표시되지만 재조회가 복구되지 않는 사례를 관찰했다. 개발 도구의 오류 overlay에는 의도적으로 주입한 메시지가 보인다.
- 별도 QA production build(Next.js 16.3.8 Webpack), /qa-global: 원인503 상태에서 화면을 표시하지 못했어요·다시 시도만 표시. 내부 QA_SECRET_GLOBAL 미표시. 원인을success로 해소하고 다시 시도 → 최상위 오류 복구·흉흉·사건 검색·주 메뉴 표시.
- 실제 앱 production build(Turbopack)와 타입 검사 PASS. 임시 QA 앱은 오류 주입용 root layout·별도 qa 페이지 외의 제품 소스를 원본 그대로 복사했다.

## 원본 앱 production 회귀
- 3108은 실제 앱의 최종 Turbopack production build를 실행한다. 테스트용 라우트/루트 주입 코드는 없다.
- success: 합성 기사2개, 정상 AI 이미지, KST 발행 시각, 원문 링크, 헤더/내비게이션 표시.
- 실제 image404 후 reload: 첫 카드 이미지 없음, 나머지 기사 정보 보존.
- API503 후 reload: 기존 안전한 실패 안내·다시 시도 링크 표시.
- API 원인success로 해소 후 다시 시도 링크 클릭: 두 기사·정상 이미지 복구.
