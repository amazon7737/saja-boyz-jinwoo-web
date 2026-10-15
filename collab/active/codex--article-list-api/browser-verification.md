# 기사 목록 라우트 — 실제 브라우저 검증 기록

최신 검증 revision은 `fec482341f83561706b1cf176bb6d1d66aa81463`이다. 맨 아래 추가 기록에 실 API 4카드·RFC/ISO/KST·ready 이미지·393px 재확인 결과가 있다. 아래의 기존 `최종` 표현은 당시 `7ed5e41` 검증 시점을 뜻하며, 해당 기록과 스크린샷을 그대로 보존했다. 이전 보고서 사본: `/private/tmp/jinwoo-article-route-browser-verification-7ed5e41.md`.

2026-10-04, CUA Chrome으로 실제 production 앱을 열어 관찰했다. 테스트 결과를 화면 관찰로 대신하지 않았다. 앱 코드·공식 테스트·승인 명세는 수정하지 않았으며, 임시 fixture 모드와 증거 파일만 썼다.

## 대상과 revision

| 항목 | 값 |
|---|---|
| 앱 | `/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-list-api` |
| 전체 상태 검증 revision | `55b3f03697c24bc1c22a8539e9a2e575a38e36b5` |
| 최종 재확인 revision | `7ed5e4126922dd3695e3d86c7fe8728ae5062935` |
| 실 API 앱 | http://127.0.0.1:3002/incidents, 최종 server session 93218 |
| 합성 API 앱 | http://127.0.0.1:3003/incidents, 최종 server session 13191 |
| 합성 API | http://127.0.0.1:39071, fixture session 52195 |
| fixture | `/private/tmp/jinwoo-article-api-browser-fixture/` |
| 최종 fixture 모드 | `success` |
| Figma 직접 확인한 목록 | https://www.figma.com/design/TCSILMzViAVqeHRphoyHCH?node-id=11-2153 |
| Figma 전체 프레임 | https://www.figma.com/design/TCSILMzViAVqeHRphoyHCH?node-id=11-2123 |

55b3f03 이후 변경은 날짜 파싱 보완이다. 아래 전체 상태 검증은 55b3f03에 귀속되며, 최종 HEAD에서 반복한 범위는 다음 표에 별도로 적었다. 잘못된 날짜 `02/30/2026`의 최종 fallback은 이 브라우저 검증에서 직접 실행하지 않았다. 해당 helper 검사와 하네스 결과는 코디네이터의 별도 증거다.

## 최종 HEAD에서 새로 확인한 결과

| 항목 | 실제 관찰 | 증거 |
|---|---|---|
| 실 API 목록 | 카드 4개. 첫 ready 이미지가 실제 로드됨(`complete=true`, `naturalWidth=1024`, 표시 80×80). 나머지 3개는 `이미지 없음`. | 실 API URL 새로고침, DOM·스크린샷 |
| 실 API 모바일 | `innerWidth=clientWidth=scrollWidth=393`. 카드 x=16, width=361. 가로 넘침 없음. | `jinwoo-article-real-393-7ed5e41.jpg` |
| 실 API 발행 날짜 | `기사 발행` 표시와 KST 시각을 관찰. 아래 날짜 대응표 참조. | 실제 time 텍스트 및 datetime |
| 합성 정상 | 카드 2개. A ready 이미지 실제 로드, B disabled placeholder. 393px에서 카드 폭 361, 높이 123/122, 가로 넘침 없음. | 최종 fixture request 30–31 |
| 합성 HTTP 503 | 카드 0, 보이는 alert에 `기사를 불러오지 못했어요`와 `다시 시도`. 내부 marker 노출 없음. | request 32, 실제 AX·화면 |
| 503 → 성공 | fixture를 success로 바꾼 후 보이는 `다시 시도`를 실제 클릭. alert가 사라지고 카드 2개로 회복. | request 33–34 |
| 합성 긴 제목 | 393px에서 카드 폭 361, 높이 123/122. 제목 한 줄 말줄임, 요약 두 줄 제한. 발행 시각·원문 링크 유지, 가로 넘침 없음. | request 35–36, `jinwoo-article-long-title-393-7ed5e41.jpg` |

최종 실 API 날짜 대응:

| 기사 | 화면 KST | time datetime |
|---|---|---|
| 현대엔지니어링, 8700억 군산 AI 데이터센터 수주 | 2026-09-28 13:34 KST | 2026-09-28T04:34:00.000Z |
| [오늘의 날씨] 전국 맑고 한낮 31도…일교차 최대 15도 | 2026-09-20 00:01 KST | 2026-09-19T15:01:00.000Z |
| [내일 날씨] 전국 낮밤 기온차 15도…남해동부먼바다 물결 3.5m 강풍·너... | 2026-09-19 22:46 KST | 2026-09-19T13:46:00.000Z |
| [전국 자역별 오늘의 날씨 및 내일날씨]25호 태풍 두쥐안 경로,당분간 낮... | 2026-09-19 18:16 KST | 2026-09-19T09:16:00.000Z |

합성 날짜는 A `2026-10-04 09:00 KST`, B `2026-10-03 18:30 KST`로 표시됐다. 실 API 원문 href가 kfenews.co.kr, news.tf.co.kr, mhns.co.kr, economytalk.kr로 연결되는 것은 DOM에서 확인했다. 외부 언론사 페이지를 실제 방문하지는 않았다. 실제 이동과 키보드 동작은 아래 로컬 합성 원문으로 확인했다.

## 전체 상태 검증 — 55b3f03

| 상태·항목 | 실제 관찰 | 판정·증거 |
|---|---|---|
| 정상 success | 기사 2개. A ready 이미지 80×80 및 `AI 생성 이미지`, B `이미지 없음`. 제목의 b 태그와 amp 엔티티, 요약의 quot 엔티티가 일반 텍스트로 표시됨. | 확인. requests 13(news),14(image) |
| API 요청 | 실제 GET `/news?offset=0&limit=20`. 검증 로그에 수집 POST 없음. | 확인. fixture requests snapshot |
| API 필드 범위 | 사건 분류·진행 상태·위치·발생 시각 등 없는 필드가 카드에 추가되지 않음. `/incidents/` 상세 링크 없음. | 확인. 화면·DOM |
| 키보드 포커스 | `사건 검색` 링크에서 Tab을 누른 뒤 `기사 원문`에 포커스. `:focus-visible=true`, 빨강 rgb(232,25,44) 3px solid outline, offset 4px. | 확인. 실제 키 입력·DOM·스크린샷 |
| 원문 실제 이동 | 포커스한 첫 `기사 원문`에서 Enter. 로컬 `/source/a`에 도착, `합성 기사 원문 A` 표시. | 확인. request 15(source 200). request 16 favicon 404는 fixture 아이콘 미제공 |
| duplicate | API 3행 A/중복 A/B → 카드 2개. 첫 A 유지, `[중복 샘플 A]` 제목 없음. total 3을 사건 수로 표시하지 않음. | 확인. requests 17–18 |
| long-title | 320px와 393px 모두 가로 넘침 없음. 제목의 전체 DOM 텍스트는 유지되며 화면은 한 줄 말줄임, 요약 두 줄 제한. 발행 시각·원문 링크 접근 가능. | 확인. requests 19–20, 실제 두 폭 스크린샷 |
| empty | 카드 0. 보이는 role=status에 `아직 수집된 기사가 없어요`, aria-busy 없음. 미구현 필터 변경 안내 없음. | 확인. request 21 |
| HTTP 503 | 보이는 role=alert에 `기사를 불러오지 못했어요`와 `/incidents` 재시도 링크. 내부 marker `FIXTURE_INTERNAL_ERROR_NOT_FOR_UI` 없음. | 확인. request 22 |
| 503 → success | 모드 변경 후 `다시 시도` 링크 실제 클릭으로 카드 2개 회복. | 확인. requests 23–24 |
| delay 2초 | 응답 전 실제 로딩 화면을 직접 관찰·촬영. role=status, aria-busy=true, `사건을 불러오는 중`, 높이 160, 보이는 카드 0. 응답 후 로딩이 사라지고 카드 2개 표시. | 확인. request 25, elapsed 2002ms, news GET 1회; request 26 image |
| timeout | 7초 대기 fixture 요청을 앱이 5000ms에 종료. 그 후 보이는 오류 alert와 재시도, 카드 0. | 확인. request 27, completed:false. 로그 status 200은 전송 완료를 뜻하지 않음 |
| image404 | news는 200이고 이미지 요청만 404. 카드 2개와 기사 텍스트·원문 링크 유지. img complete=true, naturalWidth=0, 80×80 상자. 깨진 이미지 표시와 AI 생성 이미지 캡션이 남음. | 관찰된 제한. requests 28–29. 자동 placeholder 전환은 없음 |

Next 스트리밍 중 숨겨진 서버 DOM의 rect=0이 잠시 측정된 경우는 화면 판정에서 제외했다. 실제 양수 치수와 화면·AX가 맞는 시점으로 재확인했다. 로딩·오류도 숨겨진 마크업의 존재만으로 통과 처리하지 않았다.

## 화면 폭과 Figma 비교 — 실제 관찰

| 항목 | 결과 |
|---|---|
| 320px 긴 콘텐츠 | clientWidth=scrollWidth=320. 카드 x=16, width=288, 높이 123/122. 이 fixture의 발행 줄 높이 13. 원문 링크가 카드 안에 남음. |
| 393px | clientWidth=scrollWidth=393. 카드 x=16, width=361. 바깥 여백 16px이 한 번 적용됨. |
| 데스크톱 | 실제 viewport 1457px, clientWidth=scrollWidth=1457. 카드 x=424.5, width=608. 공용 max-width 640 컨테이너가 가운데 정렬. |
| 카드 구조 | 이미지 왼쪽, 텍스트 오른쪽. 이미지 80×80. card padding 12, radius 14, column gap 12, row gap 6. |
| 글자 규격 | 실제 computed style: 제목 14px/800/17px, 발행 메타 11px/13px, 요약 12px/16px. |
| 공용 UI | 393px 실 API에서 헤더 1개·하단 nav 1개. 마지막 카드 하단 659.6, nav 상단 764로 현재 4카드가 가려지지 않음. |
| 콘솔 | production 검증 중 조회한 real/fixture warn·error 로그는 모두 빈 배열. 이전 임시 dev preview의 확장 삽입 hydration 경고는 이 production 검사에서 관찰되지 않음. |

Figma get_design_context와 제공 스크린샷을 직접 확인한 기준은 393px 목록, 좌우 16px, 세로 카드 간격 12px, 카드 361×120, padding 12, radius 14, 이미지 80×80, 이미지와 본문 간격 12px, 제목 14px/800, 메타 11px, 요약 12px/16px이다. 새 카드의 컴팩트한 좌우 구조·기본 치수·타이포그래피는 이 기준에 맞는다.

기사 API에는 기존 Figma 사건 카드의 분류·상태·위치·발생 시각이 없다. 이를 생략하고 발행 시각·원문 링크·AI 캡션을 넣은 것은 승인된 차이다. 실제 새 카드 높이는 122–123px이므로 원본 120px과 완전 동일하다고 주장하지 않는다. 공용 헤더·하단 메뉴 및 기존 전역 글꼴 차이는 이번 카드 변경 범위 밖이다. 320px·데스크톱·빈 상태·로딩·오류는 브라우저 동작을 검증했으며, 대응 Figma 별도 시안과의 정확한 일치는 확인하지 않았다. 1280px 조정 시도에서 실제 폭이 바뀌지 않은 측정은 데스크톱 증거에서 제외했다.

## 한계와 미검증

- 이미지 URL이 ready여도 404가 나면 자동 대체 이미지가 되지 않는다. 깨진 이미지와 AI 캡션이 남는다. 승인에 없는 자동 fallback 요구를 새 합격 조건으로 추가하지 않았다.
- 외부 기사 원문 사이트 자체의 정상 응답·콘텐츠는 방문 검증하지 않았다. 로컬 fixture 원문으로 실제 키보드 이동을 검증했다.
- 최종 7ed5e41에서 중복·빈 상태·2초 로딩·5초 timeout·320px·데스크톱·image404를 전부 반복하지 않았다. 해당 결과는 55b3f03에 귀속한다. 두 revision의 차이인 날짜 파싱에 대해서는 정상 RFC/실 API 날짜만 최종 화면에서 새로 확인했다.
- 자동 하네스·공식 suite·build는 이 검증 담당자가 실행하지 않았다. 이 문서는 실제 화면·요청 관찰 증거다.

## 증거 파일

- 최종 실 API 393×852 JPEG: `evidence/browser-real-393-7ed5e41.jpg`
- 최종 합성 긴 제목 393×852 JPEG: `evidence/browser-long-title-393-7ed5e41.jpg`
- 두 저장 이미지는 파일 저장 후 view_image로 직접 열어 확인했다.
- 이전 source SHA-256: `evidence/source-55b3f03.txt`
- 최종 source SHA-256: `evidence/source-7ed5e41.txt`
- 이전 요청 snapshot: `evidence/requests-55b3f03.ndjson` (request 29까지)
- 최종 요청 snapshot: `evidence/requests-7ed5e41.ndjson` (request 36까지, 앞 revision 요청도 포함)
- 원본 누적 요청 로그: `/private/tmp/jinwoo-article-api-browser-fixture/requests.ndjson`

최종 핵심 source SHA-256:

```
cba41b5d022a425bc4f8eb41a2c6bf1d1d77cf61c457faef8f8d0beae65befce  src/app/incidents/page.tsx
cb4a436e1aae171bab8d43e463612ff4bad166e01524742276fb9f18b57540f3  src/app/incidents/loading.tsx
b4bea9087f6272ee741596539ec2da789aaa036b0e2f70187d71ef65f478429f  src/features/article-list/article-list.tsx
be0dc4d0ca0f710195433ff7c2957838798b702e34aa60ec29accf4b429d29ea  src/features/article-list/article-list.module.css
```

검증 종료 시 fixture 모드는 success로 복원했다. 임시 viewport override는 reset했다. 실 API 미리보기 탭은 deliverable로 유지했다. 앱 서버와 fixture 서버는 코디네이터 후속 확인을 위해 중지하지 않았다.

## 최종 엄격 날짜 파싱 보완 후 재확인 — fec4823

앱 HEAD를 Git으로 다시 읽어 `fec482341f83561706b1cf176bb6d1d66aa81463`임을 확인했다. `article-list.tsx` SHA-256은 `5c573a4d9d3dedbf764a3a4f6068d2e2bfae3d6ce564c2a94c0f986391c4bad9`이다. 전체 대상 source fingerprint는 `evidence/source-fec4823.txt`에 기록했다.

코디네이터가 재시작한 production server 2494의 http://127.0.0.1:3002/incidents 를 실제 새로고침했다. Chrome CUA에서 393×852 viewport를 설정하고 화면과 DOM을 직접 확인했다. 이 차수에는 fixture 앱·모드와 복잡한 상태 및 원문 이동 검증을 반복하지 않았다.

| 재확인 항목 | 실제 결과 |
|---|---|
| 실 API 목록 | 보이는 카드 4개. 첫 ready 이미지와 나머지 3개의 `이미지 없음` 유지. |
| 실제 ready 이미지 | complete=true, naturalWidth=1024, 화면 80×80. 기존과 같은 실제 이미지 URL. |
| 393px 레이아웃 | innerWidth=clientWidth=scrollWidth=393. 카드 x=16, 폭 361, 높이 123/122/122/122. 가로 넘침 없음. |
| 발행 시각 | 4개 모두 `기사 발행`과 유효한 ISO datetime/KST 텍스트 유지. 아래 원본 RFC 응답과 대응. |
| 화면 저장 | `evidence/browser-real-393-fec4823.jpg`, JPEG 393×852, 48,110bytes. 저장된 파일을 view_image original로 직접 열어 전체 화면을 확인함. |

공개 API의 `/news?offset=0&limit=20`을 읽기 전용 GET으로 새로 조회했다. total=4, image_status는 ready/disabled/disabled/disabled였다. 원래 RFC pubDate와 브라우저 출력의 대응은 다음과 같다.

| 카드 순서 | API 원본 pubDate | 실제 time datetime | 실제 KST 텍스트 |
|---|---|---|---|
| 1 | Mon, 28 Sep 2026 13:34:00 +0900 | 2026-09-28T04:34:00.000Z | 2026-09-28 13:34 KST |
| 2 | Sun, 20 Sep 2026 00:01:00 +0900 | 2026-09-19T15:01:00.000Z | 2026-09-20 00:01 KST |
| 3 | Sat, 19 Sep 2026 22:46:00 +0900 | 2026-09-19T13:46:00.000Z | 2026-09-19 22:46 KST |
| 4 | Sat, 19 Sep 2026 18:16:00 +0900 | 2026-09-19T09:16:00.000Z | 2026-09-19 18:16 KST |

이 차수에서도 앱 소스·승인 테스트 변경, 테스트 실행, 빌드를 하지 않았다. 잘못된 timezone offset 및 trailing junk 진단의 통과 여부는 코디네이터의 별도 증거이며 이 브라우저 차수에서 새로 실행한 항목이 아니다. 앞 revision의 이미지 404 제한 및 상태별 검증 범위는 그대로 유지한다. 종료 시 viewport override를 reset하고 실 API 탭을 deliverable로 다시 표시했다.
