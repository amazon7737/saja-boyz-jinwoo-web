# 서버 재시도 브라우저 발견과 구현 지침

승인된 마지막 항목 진행 중 임시 QA 서버 라우트에서 확인했다. 서버 throw 원인을 해소한 뒤 reset만 호출하면 서버 콘텐츠를 다시 조회하지 않아 오류 안내가 남는다.
Next.js 16.3.8의 retry prop으로 서버 재조회까지 수행해야 한다. 기존 정확 테스트가 전달하는 reset 콜백의 호환 동작은 보존한다. spec·테스트·의존성의 승인 입력은 변경하지 않는다.

현재 루프를 안전하게 중단하고 마지막 미완료 항목을 --resume으로 재개한다. 앱 측 command adapter는 이 구체적인 QA 결과를 워커 프롬프트에 전달한다. 모델 gpt-6-astra, 최대20호출, 900초, 수용 테스트·검증은 동일하다. Sobaya 소스는 바꾸지 않는다. 리뷰는 별도 fresh read-only 세션이다.

자료: https://nextjs.org/docs/app/api-reference/file-conventions/error#retry
