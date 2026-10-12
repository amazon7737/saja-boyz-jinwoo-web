from pathlib import Path
import shutil, subprocess, json, re
root=Path.cwd()
qa=Path('/tmp/map-viewport-product-qa')
qa.mkdir(exist_ok=True)
for name in ['src','public']:
  dst=qa/name
  if dst.exists(): shutil.rmtree(dst)
  shutil.copytree(root/name,dst)
for name in ['package.json','pnpm-lock.yaml','tsconfig.json','next-env.d.ts','next.config.ts','postcss.config.mjs','eslint.config.mjs','.prettierrc.json']:
  if (root/name).exists(): shutil.copyfile(root/name,qa/name)
if not (qa/'node_modules').exists(): (qa/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
client=None
for source in [root/'.env.local',root.parent/'saja-boyz-jinwoo/.env.local',root.parent/'saja-boyz-jinwoo-codex--naver-map-foundation/.env.local']:
  if source.exists():
    m=re.search(r'^NEXT_PUBLIC_NAVER_MAP_CLIENT_ID\s*=\s*([^\n]+)',source.read_text(),re.M)
    if m: client=m.group(1).strip().strip('\"\''); break
if not client: raise SystemExit('Ignored local map Client ID missing')
(qa/'.env.local').write_text('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID='+client+'\nNEXT_TELEMETRY_DISABLED=1\n')
print('격리 QA 소스 준비 완료, 공개 지도 ID만 사용')
