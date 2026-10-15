# 실제 Next 페이지 브라우저 통합 확인

2026-10-06, Chrome, Next 16.3.8 production(webpack), 127.0.0.1:3110.
Fault 컴포넌트에는 추가 FeatureErrorBoundary가 없다. 제품 RootLayout/AppShell 안쪽에서 Next가 생성한 경계가 RouteError를 표시한다. QAControls는 AppShell 바깥의 검증 도구이며 localStorage로 오류 원인을 해소하고 console.error('기능 오류:', reason)를 관찰한다.

| 경로 | 오류 안내 | 로그 | 원인 해소 + 재시도 | 오류 활성화 후 검색 링크 이동 |
| --- | --- | --- | --- | --- |
| /qa-network | 연결을 확인해 주세요. | network | 정상 페이지 복구: network | /search 정상 준비 화면 |
| /qa-configuration | 서비스 설정을 확인해 주세요. | configuration | 정상 페이지 복구: configuration | /search 정상 준비 화면 |
| /qa-invalid-response | 응답을 확인할 수 없어요. 잠시 후 다시 시도해 주세요. | invalid-response | 정상 페이지 복구: invalid-response | /search 정상 준비 화면 |

각 오류 화면에 브랜드·사건 검색 링크·지도/제보하기/목록 내비게이션이 유지된다. 원본 SECRET_CLIENT_DETAIL은 사용자 오류 안내에 표시되지 않는다. 경로 이동은 주소창의 강제 로드가 아니라 제품 Link를 눌러 확인했다. 위 관찰은 CUA의 실제 브라우저 접근성 상태로 확인했다.

첫 워커의 구현으로 예비 확인한 뒤 최종 구현 코드로 다시 빌드하고 위 세 행의 모든 동작을 재검증했다. source-checks.json의 7개 제품 파일은 SHA-256이 모두 일치한다. 임시 앱의 QAControls와 QA 페이지는 제품 코드에 포함하지 않는다.
