# 최근 검색 테스트 초안 검증

2026-10-10 · dev f5bc8cf 기반의 제품 코드를 임시 디렉터리에 복사해 확인했다. 앱 제품 코드와 기존 40개 테스트는 변경하지 않았다.

- 잠금 파일 그대로 pnpm offline 설치. 새 의존성 없음.
- 정확 헤더·5개 본문을 하나의 테스트 파일로 구성한 복사본에서 Next typegen 및 TypeScript `--noEmit --incremental false` 통과.
- 각 본문은 sobaya `probe.sh DIRECTORY SNIPPET HEADER`로 개별 실행했다. 다섯 건 모두 명명된 테스트의 실제 assertion 실패로 RED이며 probe exit 0이다. 문법·타입·미실행·의존성 오류를 RED로 기록하지 않았다.

| 항목 | 관찰한 결과 |
| --- | --- |
| recentSearchesRestoreStoredKeywordsWithoutFetching | 최근 검색 section 미구현으로 assertion RED |
| recentSearchesRecordExecutedKeywordAndDeduplicate | 실행 검색어가 저장되지 않아 assertion RED |
| recentSearchesBoundHistoryAndDeleteOneKeyword | 최대 10개·최신순 기록 미구현으로 assertion RED |
| recentSearchesKeepLinksEncodedAndUserContentSafe | 최근 검색 링크 section 미구현으로 assertion RED |
| recentSearchesTolerateInvalidOrUnavailableStorage | 손상 저장소의 빈 최근 검색 안내 section 미구현으로 assertion RED |

RED는 초안이 현재 코드에서 실행돼 실패했다는 근거이며 기대값 자체가 맞다는 승인이나 기능 완료를 의미하지 않는다. 이 초안은 아직 사용자 승인 전이다. 구현 시작 후 하네스가 기존 40개를 포함한 전체 suite를 항목마다 검증한다.
