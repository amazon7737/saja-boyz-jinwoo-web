# 구현 분담 · easter721 / amazon

2026-10-01 사용자가 승인한 분담. amazon의 작업 시작·claim은 아직 확인되지 않았다. 상대 claim을 대신 작성하지 않는다.

## 순서

1. **공용 기반 선행 PR**: easter721, `codex/shared-ui-foundation`. 검색 헤더·필터·배지·하단 메뉴·사건 데이터 계약을 제공한다.
2. 선행 PR은 dev를 대상으로 리뷰 후 squash merge한다. dev에서 각자 기능 브랜치와 claim을 만든다. 일찍 시작해야 하면 공용 브랜치를 base로 하는 스택 PR을 쓰고 claim에 `base: codex/shared-ui-foundation`을 명시한다. dev→main 통합도 별도 리뷰 PR로 진행한다.
3. easter721은 지도·검색, amazon은 목록·상세·제보를 병렬 구현한다. 기능별 PR과 저널로 통합한다.

## 담당 영역

2026-10-14 추가 배정: 사용자가 실제 기사 좌표부터 지도 마커까지 연결하도록 요청하여 **amazon이 이번 지도 기사 API 소비·동일 좌표 묶음 마커·선택 카드 연결을 맡는다.** `codex/map-article-markers`는 easter721의 SDK·내 위치·뷰포트 복원을 재사용한다. 기존 분류/필터/줌 클러스터 및 검색 담당은 유지한다. 서버의 지역 대표 좌표 처리와 아침 수집은 별도 서버 브랜치에서 진행한다.

2026-10-13 추가 배정: **amazon이 실제 제보 접수를 맡는다.** PR #15의 입력 화면을 재사용해 프런트 전송·응답 처리와 `team-poem/poem-news`의 Go 접수 API·서버 저장·첨부 계약을 준비한다. 작업 브랜치는 `codex/report-submission`(프런트)과 `codex/report-intake`(서버)이며, 새 정책·테스트는 별도 검토 후 구현한다. 기존 지도·검색 분담은 유지한다.

| 담당      | 화면·기능                                             | 담당 파일                                                                                                    |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| easter721 | 공용 레이아웃·토큰·공용 UI·사건 계약                  | src/components/ui/, src/components/layout/, src/app/layout.tsx, src/app/globals.css, src/features/incidents/ |
| easter721 | 지도 홈·필터·마커·클러스터·내 위치·핫한 사건·바텀시트 | src/app/page.tsx, src/features/map/ (후속 추가)                                                              |
| easter721 | 검색 시작·입력·최근 검색·검색 결과                    | src/app/search/, src/features/search/ (후속 추가)                                                            |
| amazon    | 사건 목록·카드·빈 결과·로딩                           | src/app/incidents/page.tsx, src/features/incident-list/ (추가 가능)                                          |
| amazon    | 사건 상세·타임라인·출처·공유                          | src/app/incidents/[id]/, src/features/incident-detail/ (추가 가능)                                           |
| amazon    | 제보 폼·입력 검증·첨부·제출 상태                      | src/app/report/, src/features/report/ (추가 가능)                                                            |

공용 파일은 easter721이 관리한다. 모든 담당자는 화면 스타일에 Tailwind 유틸리티와 공용 디자인 토큰을 사용하며 새 CSS Module을 추가하지 않는다. 기존 사건 배지의 `src/features/incident-list/ui/incident-list/incident-list.module.css`만 예외로 유지한다. [스타일 기준과 검사](architecture.md#스타일)를 따른다. 공용 API 변경이 필요하면 `ask @easter721` 저널 이벤트로 알려 순서를 조율한다. package.json·pnpm-lock.yaml 등 허브 파일은 두 사람이 동시에 수정하지 않는다.

## amazon 시작 안내

- [Figma 화면·섹션별 노드](figma-analysis.md)에서 목록 `11:2123`, 상세 `11:2043`, 제보 `11:2221`을 조회한다.
- 공유 시안 `34:3311`은 문구가 혼재하므로 동작을 확인한 뒤 구현한다.
- [공용 UI·데이터 계약](ui-contract.md)을 읽고 제공 컴포넌트·타입·라벨·필터 어댑터를 재사용한다.
- 목록에서는 AppShell이 검색 헤더·필터·내비게이션을 이미 렌더한다. 화면에서 중복으로 추가하지 않는다.
- 상세·제보는 AppShell이 공용 검색 헤더·내비게이션을 숨긴다. 각 화면의 뒤로가기·닫기·CTA를 직접 구현한다.
- 샘플 사건은 실제 기사로 오해하지 않도록 샘플 표시와 fixture 경계를 유지한다. 실제 뉴스 API·제보 저장·인증은 후속 결정이다.

현재 선행 PR은 **공용 기반만** 만든다. 지도 SDK·검색 결과·목록·상세·제보 완성본이 아니다.

## 공용 기반 인수

첫 레이아웃 루프 4개 통과는 중간 체크포인트다. [단계별 인수 조건](shared-foundation-acceptance.md)의 공용 컴포넌트·URL 어댑터·실제 상호작용 검증과 sobaya gate·독립 review까지 완료되어야 amazon이 공용 기반을 인수한다.

2026-10-15 지도 홈 후속: easter721의 `codex/figma-map-home`은 고정 지역별 고유 기사 숫자 원·실제 기사 carousel·발행일 기간 필터·필터 popup/전체 시트를 담당한다. 기존 SDK·내 위치·뷰포트·기사 상세 연결은 재사용한다. 카테고리/상태 실제 선택은 서버 필드 계약이 없어서 미제공 안내로 남기고 region_id/지역 단계·분류/상태 enum/unknown·인기 정렬 계약 문서화를 요청한다. 제보11:2221 보정은 amazon7737의 PR22를 참조하며 이 브랜치에서 중복 구현하지 않는다.

- 사용자 추가 피드백으로 codex/figma-map-home이 검색/목록/상세 표시 밀도와 절제된 공통 인터랙션도 보정한다. API·제보(PR22)는 변경하지 않는다. 주소 매치/분류/상태/타임라인/인용수 계약은 서버 확인이 남아 있다.
