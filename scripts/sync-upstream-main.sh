#!/usr/bin/env bash
# 조직 main만 가져온다. 실제 push와 인증은 workflow의 마지막 단계에서 수행한다.
set -euo pipefail

upstream_repo=team-poem/saja-boyz-jinwoo
: "${GITHUB_OUTPUT:?GitHub Actions output file is required}"
: "${GITHUB_STEP_SUMMARY:?GitHub Actions summary file is required}"
echo 'changed=false' >> "$GITHUB_OUTPUT"

git fetch --no-tags "https://github.com/$upstream_repo.git" refs/heads/main
upstream_sha="$(git rev-parse FETCH_HEAD)"
if git merge-base --is-ancestor "$upstream_sha" HEAD; then
  echo "조직 main $upstream_sha 는 이미 반영됨. 배포하지 않습니다." >> "$GITHUB_STEP_SUMMARY"
  exit 0
fi

# latest dev, PR head, 실패/진행 중인 main은 배포하지 않는다.
run_state="$(gh api --method GET "repos/$upstream_repo/actions/workflows/app-check.yml/runs" \
  -f branch=main -f event=push -f head_sha="$upstream_sha" -f per_page=1 \
  --jq '.workflow_runs[0] | [.status // "missing", .conclusion // "pending"] | join(":")')"
if [ "$run_state" != 'completed:success' ]; then
  echo "조직 main $upstream_sha CI가 아직 성공하지 않았습니다: $run_state" >> "$GITHUB_STEP_SUMMARY"
  if [ "$run_state" = 'completed:failure' ] || [ "$run_state" = 'completed:cancelled' ]; then
    exit 1
  fi
  exit 0
fi

# 사용자 승인 자동화의 동기화 커밋. 원본 커밋과 저자 정보는 부모 이력에 유지한다.
git config user.name 'amazon7737 (upstream sync)'
git config user.email '76634341+amazon7737@users.noreply.github.com'
if ! git merge --no-ff --no-edit "$upstream_sha" \
  -m "ci(sync): 조직 main ${upstream_sha:0:12} 운영 동기화" \
  -m "Automated upstream-main sync; original authors are preserved in parent commits."; then
  git merge --abort || true
  echo '동기화 충돌: 운영 브랜치를 변경하지 않았습니다. 수동 해결이 필요합니다.' >> "$GITHUB_STEP_SUMMARY"
  exit 1
fi
echo 'changed=true' >> "$GITHUB_OUTPUT"
echo "조직 main $upstream_sha CI 성공 확인 및 병합 완료." >> "$GITHUB_STEP_SUMMARY"
