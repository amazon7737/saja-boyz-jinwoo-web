import { realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const nextRequire = createRequire(
  realpathSync(new URL('../node_modules/next/package.json', import.meta.url)),
);
const sharp = nextRequire('sharp');

const source = await readFile(
  new URL('../public/og/site.svg', import.meta.url),
);
await writeFile(
  new URL('../public/og/site-v2.png', import.meta.url),
  await sharp(source).png().toBuffer(),
);

console.log('Figma 공유 이미지 SVG에서 1200×630 PNG 생성 완료');
