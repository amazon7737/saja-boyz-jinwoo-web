# 포털 시트 회귀 테스트 조회 범위 정정

사용자의 전 과정 승인 범위에서 테스트 초안의 조회 위치 오류를 바로잡는다. 시트는 원래 document.body에 포털로 렌더링되므로 host만 조회하면 기능이 올바른 상태에서도 검증이 실패한다. 구현을 테스트에 맞추어 비포털로 바꾸지 않는다. 기대 기사2개·원 크기·대표점·키보드·포커스·카메라 검증은 그대로 유지한다.

```diff
- const sheet = host.querySelector('[aria-label="선택한 기사"]');
+ const sheet = document.querySelector('[aria-label="선택한 기사"]');
```

Sobaya defect 기록은 지우지 않고 보존한다. 현재 코드와 수정된 정확 테스트를 새 baseline으로 커밋한 뒤 approve --replace로 다시 검증한다. 원래 나머지108개 테스트·의존성·명령은 변경하지 않는다.

계획 코드 블록 끝의 불필요한 빈 줄을 제거해 Sobaya가 테스트를 추가해도 Prettier 형식과 일치하게 정규화했다. 테스트 본문 로직·기대값은 포털 조회 한 줄 외에 바꾸지 않았다.
