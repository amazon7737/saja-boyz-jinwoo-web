import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? process.cwd());
const evidence = dirname(fileURLToPath(import.meta.url));
if (!existsSync(join(source, 'node_modules'))) throw new Error('제품 앱에서 pnpm install을 먼저 실행하세요.');
const qa = mkdtempSync(join(tmpdir(), 'saja-pr5-review-qa-'));
cpSync(join(source, 'src'), join(qa, 'src'), { recursive: true });
for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'next.config.ts', 'next-env.d.ts']) cpSync(join(source, name), join(qa, name));
symlinkSync(join(source, 'node_modules'), join(qa, 'node_modules'), 'dir');
for (const [fixture, target] of [['fault-client.tsx.txt', 'qa-fault.tsx'], ['qa-controls.tsx.txt', 'qa-controls.tsx']]) cpSync(join(evidence, fixture), join(qa, 'src/components', target));
const layoutPath = join(qa, 'src/app/layout.tsx');
const layout = readFileSync(layoutPath, 'utf8');
const shell = '<AppShell>{children}</AppShell>';
if (!layout.includes(shell)) throw new Error('RootLayout 변경에 맞춰 QA 삽입 위치를 확인하세요.');
writeFileSync(layoutPath, "import QAControls from '@/components/qa-controls';\n" + layout.replace(shell, '<QAControls /><AppShell>{children}</AppShell>'));
for (const reason of ['network', 'configuration', 'invalid-response']) {
  const route = join(qa, 'src/app', 'qa-' + reason);
  mkdirSync(route);
  writeFileSync(join(route, 'page.tsx'), `import Fault from '@/components/qa-fault';\nexport default function Page() { return <Fault reason="${reason}" />; }\n`);
}
console.log(qa);
console.log('이 임시 앱에서 pnpm exec next build --webpack 후 pnpm exec next start --hostname 127.0.0.1 --port 3110을 실행하세요.');
