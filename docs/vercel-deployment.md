# Vercel 배포 가이드

프런트 원본은 `team-poem/saja-boyz-jinwoo`이고, 개인 테스트 배포는 fork `amazon7737/saja-boyz-jinwoo-web`의 `dev`를 Vercel Hobby의 Next.js 프로젝트로 배포한다. 뉴스 수집·이미지 생성·파일 저장은 기존 OCI의 `team-poem/poem-news`가 계속 담당한다.

## 현재 배포 기준

2026-10-14 확인 시점의 상태다. 실제 배포 직전에 GitHub와 운영 API를 다시 확인한다.

| 대상          | 확인한 상태                                        | 배포할 때 필요한 작업                     |
| ------------- | -------------------------------------------------- | ----------------------------------------- |
| 프런트 `dev`  | `20b9471`, PR #1~#15 반영                          | 개인 fork의 같은 SHA로 테스트 배포        |
| 프런트 `main` | `c8ee953`, 위 기능 PR 미반영                       | 검증 후 별도 `dev → main` 통합 PR 필요    |
| 프런트 PR #16 | `7cf4d32`, 실제 제보 접수 구현, 아직 열림          | 제보를 제공하려면 먼저 `dev`에 병합       |
| 운영 뉴스 API | HTTPS `/health` 정상, `/news`·`/map/articles` 제공 | 기존 공개 조회 API에 연결                 |
| 운영 제보 API | `/openapi.json`에 `/reports` 없음                  | Go 제보 기능 재배포·활성화 후 프런트 연결 |

현재 `dev`의 제보 화면은 입력·첨부 선택 화면이다. 실제 접수 기능이 배포됐다고 안내하지 않는다. PR #16의 제보 연결 설정은 아래에서 별도 단계로 다룬다.

### 현재 공개 테스트 주소

- [웹앱](https://hyunghyung.vercel.app), [뉴스 목록](https://hyunghyung.vercel.app/incidents)
- [개인 fork](https://github.com/amazon7737/saja-boyz-jinwoo-web), [Vercel 프로젝트](https://vercel.com/amazon7737s-projects/saja-boyz-jinwoo)
- 2026-10-14 지도 키 반영 후 Git 소스로 재배포: `dev`의 `20b9471d839fa2b96ca6c1c255890faf27d8367c`, 배포 `dpl_7Sj4jtRngvm2qZzuXHdsDhrAXrV6`, 상태 `READY`. 플랜은 기존 Hobby를 유지했다.
- 최초 CLI 배포에서는 공개 브라우저로 기사 4건, 기존 생성 이미지 1건, 목록 → 상세 → 뒤로가기, 상세 직접 진입·새로고침, 키워드 검색을 확인했고 주요 경로 5개가 HTTPS 200을 반환했다.
- 현재 `hyunghyung.vercel.app`에서는 `/`·`/incidents`·`/search`의 HTTPS 200과 실제 브라우저의 지도 → 목록 → 지도 왕복·새로고침을 확인했다.
- 지도 Client ID를 Preview·Production에 등록하고 Ncloud Maps의 Web 서비스 URL에 현재 운영 주소를 추가했다. 공개 브라우저에서 실제 지도 타일과 NAVER 출처 표시를 확인했다. 위치 권한 허용·거부와 실기기 검증은 별도로 남아 있다.
- 개인 fork의 Git 연결과 Production Branch `dev` 설정이 완료됐다. 이번 빌드는 API로 요청한 Git 소스 배포이며, 실제 push 이벤트가 자동 배포를 만드는 흐름은 아직 별도로 검증하지 않았다. 제보는 **제보 접수 준비 중** 화면이며 아직 실제 접수를 제공하지 않는다.
- 현재 프로젝트 도메인은 `hyunghyung.vercel.app`이다. 최초 배포 때 사용한 `saja-boyz-jinwoo.vercel.app`는 프로젝트에서 빠져 404를 반환하므로 현재 링크로 대체한다.

자세한 배포 ID·소스·검증 결과는 [Git·지도 연결 기록](../collab/active/codex--vercel-preparation/map-deployment.md)에 남긴다. [최초 CLI 배포 기록](../collab/active/codex--vercel-preparation/deployment.md)은 당시 상태를 보존한 과거 체크포인트다.

## Vercel 프로젝트 설정

배포 계정과 프로젝트를 확정한 다음 GitHub 저장소를 연결한다. 이 저장소는 독립 앱이므로 로컬 Sobaya 경로 `apps/...`를 Root Directory에 입력하지 않는다.

### Hobby 계정과 조직 저장소

현재 원본 저장소는 **공개 조직 저장소**이고, 확인한 `amazon7737s-projects` 계정은 Hobby다. 2026-10-14 공식 문서의 설명 범위가 다르다. [Limits](https://vercel.com/docs/limits#connecting-a-project-to-a-git-repository)는 Hobby에서 조직 소유 Git 저장소 연결을 지원하지 않는다고 하고, [Git 배포 문서](https://vercel.com/docs/git#using-hobby-teams)는 비공개 조직 저장소를 제한한다고 설명한다. 따라서 공개 저장소라는 사실만으로 Hobby 직접 연결이 보장된다고 판단하지 않는다.

- 무료 테스트 배포를 준비하려면 개인 GitHub 계정에 원본의 공개 fork를 만들고 그 fork를 Hobby에 연결하는 안을 선택할 수 있다. 원본 개발·PR은 `team-poem`에 유지하며, fork의 `dev`와 `main`을 원본에서 동기화한 뒤 배포 커밋 SHA를 확인한다. fork는 자동으로 최신 원본을 따라가지 않는다.
- 조직 저장소를 직접 연결하는 팀 운영은 Pro에서 준비할 수 있다. 플랜 변경이나 결제는 별도 선택 사항이다.
- Hobby는 개인 비상업적 사용 범위이므로 실제 서비스 용도에 맞는 플랜도 확인한다. [Hobby 사용 범위](https://vercel.com/docs/plans/hobby)

사용자가 개인 fork의 Hobby 배포를 선택해 아래 프로젝트를 생성했다. 개인 fork의 기본 브랜치는 최신 기능이 들어 있는 `dev`다. 조직 원본의 기본 브랜치·PR·머지 상태는 변경하지 않았다. 최초 배포는 CLI로 수행했고, 사용자 본인 인증 후 기존 Vercel GitHub 앱에 새 fork만 추가해 프로젝트에 연결했다. 연결 직후 Production Branch가 `main`으로 잡혀 `dev`로 수정하고 실제 Git 소스 SHA를 확인했다.

| 설정             | 값                                                      |
| ---------------- | ------------------------------------------------------- |
| 소스 저장소      | `amazon7737/saja-boyz-jinwoo-web`                       |
| Vercel 계정      | `amazon7737s-projects` — Hobby                          |
| Vercel 프로젝트  | `saja-boyz-jinwoo`                                      |
| Framework Preset | Next.js                                                 |
| Root Directory   | 저장소 루트, 비워 두기                                  |
| Node.js Version  | `24.x` — `package.json`의 `>=24 <25`와 일치             |
| Package manager  | `pnpm@10.34.6` — `package.json`의 `packageManager` 사용 |
| Install Command  | `pnpm install --frozen-lockfile`                        |
| Build Command    | `pnpm run build`                                        |
| Output Directory | Next.js 기본값, Override 끄기                           |
| 이번 배포 소스   | 개인 fork의 `dev`, `20b9471`                            |
| Git 자동 배포    | 개인 fork 연결 완료, Production Branch `dev`            |

Vercel 환경변수에 `ENABLE_EXPERIMENTAL_COREPACK=1`을 Preview와 Production 모두 추가해 고정된 pnpm 버전을 사용한다. 빌드 로그에서 Node 24와 pnpm 10.34.6을 확인한다. [Vercel Corepack 설정](https://vercel.com/docs/builds/configure-a-build#corepack)

`next.config.ts`는 그대로 사용한다. 목록·상세의 서버 렌더링과 더 보기의 Server Actions가 필요하므로 `output: 'export'`, 정적 `out` 디렉터리, SPA 전체 rewrite를 설정하지 않는다. 별도 `vercel.json`이나 배포 전용 GitHub Actions도 필요하지 않다. [Next.js 지원](https://vercel.com/docs/frameworks/full-stack/nextjs)

프로젝트 Import의 첫 배포도 대상 브랜치·커밋을 확인한다. 이번 개인 테스트 배포는 사용자의 선택에 따라 `dev`를 Production URL에 배포한다. 아직 오래된 `main`을 최신 기능으로 오인하지 않는다. 향후 조직 원본의 `main`을 정식 배포 기준으로 전환하려면 별도 통합 PR과 검증이 필요하다. Git 연동 후에는 연결된 fork 브랜치의 push가 자동 배포를 만들 수 있다. [Git 배포](https://vercel.com/docs/git)

### 원본 변경을 fork에 반영

원본에 PR이 머지돼도 개인 fork는 자동으로 갱신되지 않는다. 배포할 기능이 원본 `dev`에 병합됐는지 확인한 뒤 아래처럼 동기화한다.

```sh
gh repo sync amazon7737/saja-boyz-jinwoo-web --source team-poem/saja-boyz-jinwoo --branch dev
gh api repos/amazon7737/saja-boyz-jinwoo-web/branches/dev --jq '.commit.sha'
```

충돌하면 강제로 덮어쓰지 않고 원인을 확인한다. 현재는 Git 연결이 완료됐으므로 동기화로 fork의 `dev`가 갱신되면 Vercel의 자동 배포를 확인한다. GitHub 앱 접근 범위, Production Branch `dev`, 실제 배포 SHA가 일치하는지 확인하고, 동기화가 변경 없는 작업이었다면 새 배포가 생성되지 않을 수 있다. 원본 개발과 기능 PR은 계속 `team-poem/saja-boyz-jinwoo`에서 진행한다.

## 환경변수

Settings의 Environment Variables에서 프로젝트 단위로 등록한다. 아래 값은 주소·공개 식별자·빌드 설정이므로 Config로 관리할 수 있다. 실제 Client ID는 문서나 Git에 복사하지 않는다.

| 이름                              | 값                                         | 환경 / 용도                                           |
| --------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `NEWS_API_BASE_URL`               | `https://poem-news.168.107.37.12.sslip.io` | Preview·Production, Next.js 서버에서 뉴스 조회        |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 기존 Naver Maps 웹 Client ID               | Preview·Production 등록 완료, 빌드 시 브라우저에 포함 |
| `ENABLE_EXPERIMENTAL_COREPACK`    | `1`                                        | Preview·Production, pnpm 버전 고정                    |
| `NEXT_PUBLIC_REPORT_API_BASE_URL` | 제보 활성화 후 위 API의 HTTPS 주소         | **PR #16 포함 + 서버 준비 완료 시에만** 설정          |

`NEWS_API_BASE_URL`은 서버 전용으로 유지한다. 네이버 뉴스 검색 Secret, Cloudflare 토큰, 수집 API 인증키는 OCI에만 두며 프런트로 옮기지 않는다. `NEXT_PUBLIC_` 값은 공개되는 값이고 빌드 후 바뀌지 않으므로 수정 후 새 배포가 필요하다. Vercel의 환경변수 수정은 기존 배포에 소급 적용되지 않는다. [환경변수와 환경별 범위](https://vercel.com/docs/environment-variables)

로컬은 `.env.example`을 참고한 ignored `.env.local`을 사용한다. `.env` 파일 전체를 Vercel로 업로드하지 않는다. CLI 연결 정보와 내려받은 환경 파일이 담기는 `.vercel/`도 Git에서 제외한다.

이번 Client ID는 사용자가 로컬 `.env.local`에 입력한 값을 해당 변수만 읽어 반영했다. Client Secret은 필요하지 않으며 키 값과 환경 파일은 Git에 넣지 않았다.

## 네이버 지도 도메인

1. Vercel에서 실제 생성된 HTTPS 주소와 `dev` 브랜치의 고정 Preview 주소를 확인한다. 프로젝트 이름으로 주소를 추측하지 않는다.
2. 네이버 Maps 콘솔의 해당 애플리케이션에서 Dynamic Map 활성화를 확인한다.
3. Web 서비스 URL에 검증할 Preview 주소와 실제 운영 주소를 등록한다. 개발용 `http://localhost:3000`은 필요하면 유지한다.
4. 해당 환경의 Client ID를 넣고 새로 빌드한 뒤 `/`에서 지도 타일·네이버 출처와 내 위치 권한 허용/거부를 확인한다.

매번 달라지는 배포 URL까지 자동으로 인증되는 것은 아니다. 초기에는 등록한 고정 Preview 주소로 QA한다. Client Secret은 웹 SDK에 넣지 않는다. 상세 동작은 [지도 연결 가이드](map-integration.md)를 참고한다.

2026-10-14 `poem-map` 애플리케이션은 Dynamic Map을 사용하며 기존 일 1,000회 한도를 유지했다. Web 서비스 URL은 기존 `http://localhost:3000`과 아래 주소로 설정했다.

- `https://hyunghyung.vercel.app` — 현재 공개 운영 주소, 실제 지도 표시 검증 완료
- `https://saja-boyz-jinwoo-amazon7737s-projects.vercel.app` — 고정 계정 별칭
- `https://saja-boyz-jinwoo-git-dev-amazon7737s-projects.vercel.app` — 고정 브랜치 별칭

계정·브랜치 별칭의 Vercel 인증 보호는 유지한다. 네이버 허용 도메인 등록은 Vercel 접근 인증을 해제하지 않는다. 향후 도메인 변경 시 Vercel의 실제 프로젝트 도메인과 Ncloud 등록을 함께 갱신한다. 배포 메타데이터에 남은 과거 alias 목록만으로 현재 주소를 판단하지 않는다.

## 실제 제보 활성화 — PR #16 포함 이후

프런트 병합과 서버 배포는 각각 확인한다. 서버 저장소의 머지만으로 운영 API가 바뀌지 않는다.

1. Go의 제보 기능을 OCI에 배포하고 `/openapi.json`에서 `/reports` 계약을 확인한다.
2. 서버에 `REPORTS_ENABLED=true`, `REPORTS_ALLOWED_ORIGINS`에 **허용할 웹앱의 정확한 origin**을 설정한다. origin에는 경로·끝의 `/`를 넣지 않는다. 상세 입력 형식·저장 한도는 서버 배포 문서를 따른다.
3. 제보와 첨부를 보관할 영속 저장소, 쓰기 권한, 용량 제한을 확인한다. Traefik이 `/reports`의 POST와 OPTIONS를 API로 전달해야 한다.
4. 고정 Preview origin의 CORS preflight에서 `POST`, `Content-Type`, `Idempotency-Key` 허용을 확인한다. 임의의 `*.vercel.app` 전체를 허용하지 않는다.
5. 준비된 환경에만 `NEXT_PUBLIC_REPORT_API_BASE_URL`을 설정하고 새 빌드를 만든다. 운영 API를 사용하는 Preview는 실제 저장소에 접수하므로 저장 확인은 식별 가능한 테스트 제보 1건으로 제한한다.
6. 브라우저에서 첨부 포함 제출 → 접수번호 확인 → 서버의 제보/첨부 보관 확인을 수행한다. 오류·시간 초과 때 입력과 파일이 유지되고 재시도가 중복 접수를 만들지 않는지도 확인한다.

첨부는 브라우저에서 OCI로 직접 보내는 현재 구조를 유지한다. Vercel 함수로 업로드 프록시를 추가하지 않는다. 서버가 준비되지 않았으면 PR #16의 접수 주소를 비워 두어 연결 준비 안내를 표시한다.

## 배포 전 확인

새 checkout에서 Node 24를 선택하고 아래 명령을 실행한다. 다른 worktree의 `node_modules` 심링크 대신 이 checkout에 직접 설치한다.

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run format:check
pnpm run build
```

추가로 `pnpm exec prettier --check docs/vercel-deployment.md`로 이 가이드 형식을 검사한다. 빌드만 통과해도 환경변수가 없으면 안내 화면이 보일 수 있으므로 실제 URL 검증이 필요하다.

| 경로 / 기능               | 실제 배포에서 확인할 것                                        |
| ------------------------- | -------------------------------------------------------------- |
| `/`                       | 지도 인증·타일, 위치 권한 허용/거부, 화면 왕복 후 지도 복원    |
| `/incidents`              | 운영 API 기사 제목·이미지, 목록 더 보기와 오류 후 재시도       |
| `/search`                 | 키워드 검색·빈 결과·최근 검색·더 보기                          |
| `/incidents/{article_id}` | 목록과 같은 기사의 상세, 새 탭/공유 링크 직접 진입, 뒤로가기   |
| `/report`                 | 배포 버전에 맞는 입력 화면 또는 실제 접수, 첨부 유지·오류 복구 |

Preview 보호는 유지하고 팀이 접근 가능한 방식으로 검증한다. 읽기 검증 때문에 수집 API를 호출하거나 이미지를 새로 생성할 필요는 없다. CORS preflight 성공만으로 제보 저장 성공을 판정하지 않는다.

배포 전 선택한 브랜치의 기능 범위와 CI, Vercel 환경변수, 네이버 도메인, 필요한 경우 제보 CORS를 최종 확인한다. 조직 원본의 `main`으로 정식 전환할 때는 별도 `dev → main` 통합 PR도 확인한다. 배포 후에도 위 화면들을 확인하고 실패하면 Vercel의 이전 정상 배포로 복구한다. 프런트 rollback은 OCI의 데이터·설정·서버 버전을 되돌리지 않으므로 서버 문제는 별도 처리한다.

## 공식 근거

확인일: 2026-10-14. 플랫폼 설정과 지원 버전은 실제 적용 시 다시 확인한다.

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Node.js 지원 버전](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [패키지 매니저](https://vercel.com/docs/package-managers), [Corepack과 빌드 설정](https://vercel.com/docs/builds/configure-a-build#corepack)
- [Git 기반 배포](https://vercel.com/docs/git), [환경변수](https://vercel.com/docs/environment-variables)
