# 초안 검증

- fa31761 실제 Chrome/Next 지연 재현: 2.5초에도 이전 URL·입력·결과가 남고 status 없음. 응답 후 새 결과는 정상 표시.
- 현재 정확 probe 초안은 추천 API 요청 발생을 확인한 뒤 응답을 보류하고 상태 표시를 기다린다. recommendedKeywordShowsPendingUntilResultsArrive assertion RED. 로딩 표시 없음(2500ms)이 실패점이며 도구/의존성 오류가 아니다. 실행 약10초.
- 최초 초안은 없는 public 디렉터리 복사로 준비 오류가 났다. 이를 제품 RED로 기록하지 않았고 해당 복사를 제거한 초안에서 위 동작 RED를 다시 확인했다.
- Prettier 포맷·ESLint stdin 통과. 실제 임시 Next build의 타입 검사도 성공했다. probe는 임시 테스트·복사본·서버를 정리했으며 제품 src 변경 없음.
- probe는 제공된 동일 playwright-core 1.62.1을 ignored node_modules에 임시 연결해 실행했다. 승인 후 연결을 제거하고 정확 devDependency를 pnpm 설치/lock으로 커밋한다. 로컬 런타임 경로를 제품/테스트에 넣지 않는다.
- GitHub Chrome 제공은 공식 runner-images에서 확인했다. 최종 CI 결과까지 확인 예정이다.
