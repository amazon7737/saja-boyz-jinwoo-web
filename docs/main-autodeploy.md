# 흉흉 main 자동배포

운영 기준은 `team-poem/saja-boyz-jinwoo`의 **main**이다. `dev`는 운영 배포 대상이 아니다.

```text
조직 main 최종 병합
  → 조직 app-check 성공
  → fork sync-upstream-main (15분 주기 또는 수동 실행)
  → fork main에 원본 이력을 유지하는 동기화 병합
  → Vercel Git 연동 빌드
  → 빌드 성공 시 hyunghyung.vercel.app 갱신
```

- fork 기본 브랜치와 Vercel Production Branch를 `main`으로 설정한다.
- GitHub 예약 실행은 지연될 수 있으며 정확한 15분 SLA가 아니다. 공개 저장소의 예약 실행은 장기 비활동 시 비활성화될 수 있으므로 Actions 상태를 확인한다.
- 최초 설정 시 이미 포함된 조직 main 커밋은 다시 배포하지 않는다. 기존 dev 기반 운영 화면은 다음 main 릴리스까지 유지한다. dev → main 기능 통합은 별도 PR에서 진행한다.
- `production-sync` GitHub environment의 `UPSTREAM_SYNC_DEPLOY_KEY`는 이 fork에만 쓰기 권한이 있는 전용 SSH deploy key다. 해당 environment는 `main`에서만 사용한다.
- 일반 `GITHUB_TOKEN` push의 후속 workflow 제한을 피하고 Git 연동 이벤트를 발생시키기 위해 전용 deploy key로 push한다. 사용자 계정의 광범위 PAT나 Vercel 인증 토큰은 저장하지 않는다.
- 동기화 커밋은 사용자가 승인한 자동화 명의로 생성한다. 조직의 원본 커밋과 저자 정보는 그대로 보존한다. Vercel Hobby 계정에 연결된 GitHub 소유자 `amazon7737`의 자동화다.
- 조직 CI 실패, 병합 충돌, push 실패 시 기존 운영 배포는 그대로 유지된다. 강제 push나 dev 자동 병합은 하지 않는다.
- fork의 CI/배포 설정 파일은 조직 소스와 충돌할 수 있다. 충돌 시 Actions 로그를 보고 별도 PR로 해결한다.
- `sync-upstream-main` 성공은 동기화 성공이지 운영 배포 성공이 아니다. Vercel의 `Ready`, main 커밋, 운영 페이지 응답까지 확인한다.
- Vercel Git 연결, 계정 권한, 빌드 환경변수가 유효해야 실제 배포된다. 이번 설정 검증을 위해 과거 main을 운영에 재배포하지 않는다.

수동 동기화: GitHub Actions → `sync-upstream-main` → Run workflow → `main`.
중지: 이 workflow를 Disable 한다. Vercel 운영 브랜치를 dev로 바꾸지 않는다.
