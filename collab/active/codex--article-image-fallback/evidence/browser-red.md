# 이미지 404 후속 — 실제 브라우저 RED 증거

- 관찰일: 2026-10-05. 합성 데이터 fixture로 재현했다. 실제 운영 뉴스의 이미지 장애라고 주장하지 않는다.
- 앱 checkout HEAD: `7a2672a6941343b5d96546b9ced3546f97393fa5`.
- 기능 소스: `fec482341f83561706b1cf176bb6d1d66aa81463`와 현재 HEAD의 `src`, `.env.example`, `vitest.config.ts` diff가 없음을 실행 전후 확인했다. 주요 SHA-256은 `browser-source-sha256.txt`에 기록했다.
- 기존 production build ID: `7WqW9aY6CnyXftku8KUzT` (전후 동일). 재빌드하지 않았다.
- 실행 Node: `/Users/kangminkim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`, v24.19.0. 지정 pnpm10 경로가 포함된 실행 PATH로 기존 Next binary를 시작했다.
- 별도 앱: `http://127.0.0.1:3004/incidents`, NEWS_API_BASE_URL=`http://127.0.0.1:39072`, Next start session10785/PID90572.
- 별도 fixture: `browser-fixture.mjs.txt`, FIXTURE_PORT=39072, mode=image404, session66938/PID90540. 기존 fixture를 별도 폴더에 복사했으며 원본39071은 변경하지 않았다.

## 실제 결과

Chrome CUA에서 실제 페이지를 열고 393×852 화면과 DOM을 직접 확인했다. img error를 JavaScript로 만들어 호출하지 않았다.

- fixture request1: `GET /news?offset=0&limit=20` → HTTP200, completed=true.
- fixture request2: `GET /images/6ef0a29fc6bc91e5f7e265a9b964278903e06157da1d944b6eea54e1e0fa9338.jpg` → **HTTP404**, completed=true.
- 첫 ready 카드에 **깨진 img와 ‘AI 생성 이미지’ 캡션이 남음**. `img.complete=true`, naturalWidth/naturalHeight=0, 실제 표시 크기80×80.
- 첫 카드가 ‘이미지 없음’으로 전환되지 않음. 두 번째 disabled 카드는 기존 ‘이미지 없음’ 상태.
- 두 카드의 제목·본문·발행 시각·원문 링크는 유지됨. 목록 alert 없음.
- 화면 clientWidth=scrollWidth=393으로 가로 넘침 없음.

## 증거

- `browser-image404-red-393.jpg`: 393×852 JPEG. 실제 깨진 이미지와 캡션이 보이는 화면을 직접 확인했다.
- `browser-observation.json`: 관찰 시각·source HEAD·DOM 값·URL 기록.
- `browser-fixture-requests.ndjson`: 실제 브라우저가 일으킨 news200과 이미지404의 요청·응답 종료 기록. 준비용 curl 요청은 포함되지 않음.
- `browser-source-sha256.txt`: 원본 소스 fingerprint.

## 복원

본인이 시작한 session10785/PID90572(port3004)와 session66938/PID90540(port39072)만 종료했다. 종료 후 lsof에서 기존 PID26874(port3002)와 PID43555(port39071)가 그대로 남았고 임시 포트는 닫혔다.

Chrome은 `http://127.0.0.1:3002/incidents`로 돌아와 실제 API 기사4개·ready 이미지naturalWidth1024·alert0을 다시 확인했다. viewport override는 reset했고 정상 앱 탭을 deliverable로 유지했다. 앱 Git working tree는 실행 전후 clean. 구현·승인 테스트·소스·브랜치·PR·운영 API POST를 변경하거나 실행하지 않았다.

## 재현용 아카이브

`browser-fixture.mjs.txt`, `browser-fixture-sample-image.jpg`, `browser-fixture-mode.txt`를 별도 임시 폴더의 `server.mjs`, `sample-image.jpg`, `mode.txt`로 복사하면 동일 fixture를 재현할 수 있다. 이는 실행 중인 앱이나 승인 테스트에 설치한 코드가 아니라 당시 수동 진단의 아카이브다.
