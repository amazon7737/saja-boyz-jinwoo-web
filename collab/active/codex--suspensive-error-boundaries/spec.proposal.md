# Suspensive 오류 경계와 재시도

## 목적
현재 모든 라우트의 클라이언트 렌더링 오류와 Next.js 서버/라우트 오류에 안전한 한국어 안내와 재시도를 제공한다. shouldCatch의 오류 분류와 타입 추론을 실제 코드·타입 검사·DOM 테스트로 증명한다.

## 범위
- @suspensive/react 3.21.4를 runtime dependencies에 정확 버전으로 추가한다. React 19 지원. 다른 패키지 버전과 명령은 보존한다.
- src/components/errors/feature-error-boundary.tsx: FeatureError(reason: 'network' | 'configuration' | 'invalid-response')와 FeatureErrorBoundary를 제공한다. 내부 경계는 shouldCatch={FeatureError}, fallback과 onError는 타입 단언 없이 FeatureError의 reason을 이용한다. 일반 Error는 바깥 공용 경계로 전파한다. 사용자 UI에 원본 error.message·stack·서버 digest·응답 본문을 노출하지 않는다.
- AppShell에서 header/nav는 오류 경계 밖에 두고 main children만 공용 경계로 감싼다. 정상 화면은 동일하다. 경계는 pathname 변경 시 resetKeys로 복구한다.
- 모든 페이지에 적용되는 src/app/error.tsx와 루트 layout 오류의 src/app/global-error.tsx를 추가한다. Next.js가 전달하는 error는 서버에서 사용자 정의 타입을 보존한다고 가정하지 않는다. 재시도는 전달받은 reset()을 호출한다. global-error는 html lang=ko와 body를 직접 제공한다.
- 이미지 404/해독 실패는 기존 ArticleImage onError를 유지한다. 목록 loading.tsx, 서버 fetch/검증/타임아웃 및 예상 API 실패의 기존 한국어 alert·원문 안전 검증·재시도 링크를 보존한다. 서버 API 실패를 억지로 클라이언트 throw로 옮기지 않는다.
- 아직 placeholder인 지도·검색·상세·제보 기능은 구현하지 않는다. 공통 경계가 향후 오류를 처리할 수 있게 한다.

## 수용
새 정확 입력 테스트 3개, 기존 23개 테스트, format/lint/typecheck/build 통과. 실제 브라우저에서 정상 목록과 이미지 대체 유지, 공통/라우트 오류 안내 및 재시도 확인. 임시 오류 주입은 증거를 남기고 제거한다. Sobaya gate와 독립 리뷰 완료 뒤 dev 대상 PR을 올린다.

## 자료
- https://suspensive.org/ko/docs/react/ErrorBoundary#propsshouldcatch
- 서버 라우트 오류는 Next.js error.tsx 계약으로 처리하며, Suspensive는 클라이언트 렌더링 오류 경계를 담당한다.
