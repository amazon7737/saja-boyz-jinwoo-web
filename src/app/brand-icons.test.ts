// file: src/app/brand-icons.test.ts
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { expect, test } from 'vitest';

const sharp = createRequire(
  realpathSync(join(process.cwd(), 'node_modules/next/package.json')),
)('sharp');

test('brandIconShowsMapPinAndSignals', async () => {
  const { data }: { data: Buffer } = await sharp(
    readFileSync('src/app/icon.png'),
  )
    .flatten({ background: '#fff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  function redIn(x1: number, y1: number, x2: number, y2: number) {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) {
        const index = (y * 96 + x) * 3;
        if (
          data[index] > 190 &&
          data[index + 1] < 140 &&
          data[index + 2] < 155
        ) {
          return true;
        }
      }
    }
    return false;
  }

  expect(redIn(8, 34, 23, 52), '왼쪽 전파 신호').toBe(true);
  expect(redIn(72, 34, 88, 52), '오른쪽 전파 신호').toBe(true);
  expect(redIn(42, 66, 52, 75), '지도 핀 하단').toBe(true);
  expect(redIn(45, 41, 48, 44), '지도 핀 안쪽 흰 원').toBe(false);
});

test('brandIconsKeepTheSameSymbolAtEverySize', async () => {
  const symbol = readFileSync('src/app/icon.svg');

  async function inspect(input: Buffer, size: number, label: string) {
    const {
      data,
      info,
    }: { data: Buffer; info: { width: number; height: number } } = await sharp(
      input,
    )
      .flatten({ background: '#fff' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect.soft(info.width, label + ' 정사각 너비').toBe(size);
    expect.soft(info.height, label + ' 정사각 높이').toBe(size);
    const reference: Buffer = await sharp(symbol, { density: 288 })
      .resize(size, size)
      .flatten({ background: '#fff' })
      .removeAlpha()
      .raw()
      .toBuffer();
    const meanDifference =
      data.reduce(
        (sum, value, index) => sum + Math.abs(value - reference[index]),
        0,
      ) / data.length;
    expect.soft(meanDifference, label + ' SVG 심벌과 일치').toBeLessThan(3);

    const pixel = (x: number, y: number): number[] =>
      Array.from(data.subarray((y * size + x) * 3, (y * size + x) * 3 + 3));
    for (const [x, y] of [
      [1, 1],
      [size - 2, 1],
      [1, size - 2],
      [size - 2, size - 2],
    ]) {
      expect
        .soft(
          pixel(x, y).every((value) => value > 240),
          label + ' 밝은 모서리',
        )
        .toBe(true);
    }
  }

  await inspect(readFileSync('src/app/icon.png'), 96, 'PNG96');
  await inspect(readFileSync('src/app/apple-icon.png'), 180, 'Apple180');
  const ico = readFileSync('src/app/favicon.ico');
  expect(ico.readUInt16LE(0)).toBe(0);
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    expect(ico[entry]).toBe(size);
    expect(ico[entry + 1]).toBe(size);
    const length = ico.readUInt32LE(entry + 8),
      offset = ico.readUInt32LE(entry + 12);
    expect(offset + length).toBeLessThanOrEqual(ico.length);
    await inspect(ico.subarray(offset, offset + length), size, 'ICO' + size);
  }
});
