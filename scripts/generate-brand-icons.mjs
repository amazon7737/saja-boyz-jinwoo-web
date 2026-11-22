import { realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const nextRequire = createRequire(
  realpathSync(new URL('../node_modules/next/package.json', import.meta.url)),
);
const sharp = nextRequire('sharp');
const symbol = await readFile(
  new URL('../public/brand/symbol.svg', import.meta.url),
  'utf8',
);
// Figma의 가로형 심벌을 정사각 아이콘에 원래 비율로 중앙 배치한다.
const source =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" fill="#fff"/>
  <g transform="translate(4 9.2173913043) scale(1.7391304348)">${symbol.trim()}</g>
</svg>\n`);

async function png(size) {
  return sharp(source, { density: 288 })
    .resize(size, size)
    .ensureAlpha()
    .png()
    .toBuffer();
}

await writeFile(new URL('../src/app/icon.svg', import.meta.url), source);
await writeFile(new URL('../src/app/icon.png', import.meta.url), await png(96));
await writeFile(
  new URL('../src/app/apple-icon.png', import.meta.url),
  await png(180),
);

const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
}
await writeFile(
  new URL('../src/app/favicon.ico', import.meta.url),
  Buffer.concat([header, ...images]),
);

console.log('흉흉 심벌에서 SVG·PNG96·Apple180·ICO 생성 완료');
