#!/bin/sh
# 새 화면은 Tailwind를 사용한다. 기존 사건 배지의 CSS Module만 유지한다.
set -eu
cd "$(dirname "$0")/.."

if ! modules=$(find src -type f \( -name '*.module.css' -o -name '*.module.scss' -o -name '*.module.sass' -o -name '*.module.less' \) \
  ! -path 'src/features/incident-list/ui/incident-list/incident-list.module.css'); then
  echo '스타일 파일 목록을 확인하지 못했습니다.' >&2
  exit 1
fi

if [ -n "$modules" ]; then
  printf '새 CSS Module은 허용하지 않습니다. Tailwind 유틸리티를 사용해 주세요:\n%s\n' "$modules" >&2
  exit 1
fi

echo '스타일 검사 통과: 기존 사건 배지 외 CSS Module 없음'
