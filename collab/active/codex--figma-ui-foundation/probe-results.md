# 승인 전 소바야 probe 결과

기준 dev fc9b0af, claim 커밋 539bf6b. 제품 코드·기존 테스트는 수정하지 않았다.

| 초안                                                     | 실제 RED 근거                                        |
| -------------------------------------------------------- | ---------------------------------------------------- |
| foundationDedicatedScreensPreserveTheirContent           | /report에서 기존 공통 header가 남아 null 요구에 실패 |
| foundationNavigationAnnouncesItsCurrentDestination       | 현재 경로를 알리는 aria-current 링크가 없어 실패     |
| foundationBrandHasALocalAccessibleSvgAndSearchLink       | 흉흉 홈 링크에 접근 가능한 로고 img가 없어 실패      |
| foundationUnconnectedArticleFiltersCannotPretendToFilter | 기사 필터 영역이 없어 실패                           |

각 후보는 소바야 probe.sh의 실제 이름 테스트로 실행됐다. 문법·missing import·미설치 의존성 오류가 아니다. 테스트 헤더·본문을 먼저 Prettier로 정리했고 승인용 Markdown의 코드 블록이 정확한 초안 파일과 같음을 확인했다.

현재 명세와 정확한 테스트는 제안이다. 사용자 승인 전에는 approve.sh 또는 제품 소스 구현을 실행하지 않는다.
