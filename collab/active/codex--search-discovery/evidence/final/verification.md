# 최종 검증

- 검토된 소스·테스트 HEAD: `05c26e8401666db22bbd101b9398770abe845816`. 뒤의 최종 커밋은 계획 보관·저널·증거·claim만 포함한다.
- 소바야 7개 항목 완료, 최종 전체 121개 테스트 통과, 신선한 Astra 읽기 전용 리뷰 완료. 기존 115개 유지 + 신규 6개. 기존 보안 테스트 1개의 JSON-LD 허용 selector만 승인대로 변경했다.
- 기존 테스트 파일 27개 SHA256 동일, 상세 8개와 신규 6개 정확 본문 동일. 테스트 순서는 러너가 마지막 보안 항목을 복원하면서 바뀌었다. 기대값 완화·skip 없음.
- 기본 `pnpm run build`(Turbopack/TypeScript), `tsc --noEmit --incremental false`, 포맷 통과. 린트 오류 0개, 이번 변경 이전부터 있던 미사용 변수 경고 3개 유지.
- 운영 모드 로컬 Next 서버 + 검증용 기사 fixture + 실제 Chrome: HTTP·브라우저 96개 검사 통과, 모바일 320/393px, 15개 화면 캡처. 보고서의 제품 파일 91개 SHA256과 최종 소스 일치.
- Google/Facebook/Twitter/Kakao 일반·공유 요청의 실제 제목·canonical·OG/Twitter·공통 PNG, 상세 요청 1회·요청 간 격리, 요약 정리·JSON-LD 탈출 방지, API 오류 noindex, robots/sitemap 상한·장애 fallback, 아카이브·공유 복사·가로 넘침·지도 높이·실제 오류 복귀 확인.
- 사용자 제공 Google 확인 태그가 7개 실제 HTML head에 정확히 한 번 나온다. Search Console 계정 확인이나 운영 배포를 완료했다고 주장하지 않는다.
- 기사 fixture는 실제 사건이 아닌 로컬 검증 자료다. 테스트 브라우저의 외부 POST는 차단했고 기존 Naver SDK 텔레메트리 시도 2건을 별도 기록했다. 애플리케이션 제보 POST는 0건.

## 발견 후 처리한 사항

- 승인 테스트의 `module` 변수 린트 오류는 사용자에게 정확 변수명 수정안을 별도 승인받았다. 테스트 의미는 그대로다.
- 목록의 안내 링크가 중복 nav를 만들던 회귀는 일반 div로 고쳤고 기존 검사를 유지했다.
- 추가 HTTP QA의 “모든 notFound는 HTTP404” 가정은 Next 공식 스트리밍 동작과 달랐다. 스트리밍 뒤에는 HTTP200 + noindex가 정상이며 기사별 오류 UI는 브라우저에서 복구된다. 불필요한 layout 실험은 제거했다. 서버 경계 신호와 실제 Chrome 복귀 UI, 비스트리밍 전역 미일치 URL의 HTTP404를 각각 검증했다. [공식 근거](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).
- 어댑터의 임시 디렉터리 입력 처리와 일시 503 재연결 실패는 원인을 확인하고 같은 승인 항목에서 재개했다. 하네스·런타임·보호 테스트를 수정하지 않았다. 중간 실패를 최종 통과로 대체해 숨기지 않도록 coordinator-diagnostics.txt에 경위를 남겼다.

## 재현

기본 빌드 뒤 아래 스크립트를 `.mjs`로 복사해 `SEO_APP`에 체크아웃 절대 경로를 지정하고 Node로 실행한다. 로컬 3000/41037 포트를 사용하며 실행 후 서버·브라우저를 정리한다. Chrome과 프로젝트의 기존 playwright-core/jsdom을 재사용한다.

- `production-qa.mjs.txt`: 실제 운영 HTML과 브라우저 검사. 빌드 시 지도 공개 client ID와 로컬 검증용 API 설정을 사용한다. 운영 데이터 쓰기 없음.
- `test-integrity.mjs.txt`: 이전 테스트 파일 hash·정확 승인 본문·브랜드 PNG를 비교한다.

실제 운영 수집·소유권 확인은 별도 dev→main 배포 후 docs/search-discovery.md대로 수행한다. 사이트맵은 최근 20개 원시 행에 한정되고, 과거 기사는 아카이브 링크로 발견한다. 검색 순위·AI 인용이나 전체 사건 수집을 보장하지 않는다.
