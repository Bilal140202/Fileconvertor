import { describe, expect, it } from 'vitest';
import opentype from 'opentype.js';

import { convertFont } from '../../lib/adapters/font-converter';

function makeTestTtf(): Uint8Array {
  const empty = new opentype.Path();

  const rect = new opentype.Path();
  rect.moveTo(50, 0);
  rect.lineTo(450, 0);
  rect.lineTo(450, 700);
  rect.lineTo(50, 700);
  rect.close();

  const glyphNotdef = new opentype.Glyph({
    name: '.notdef',
    unicode: undefined as any,
    advanceWidth: 500,
    path: empty
  });

  const glyphA = new opentype.Glyph({
    name: 'A',
    unicode: 65,
    advanceWidth: 500,
    path: rect
  });

  const glyphB = new opentype.Glyph({
    name: 'B',
    unicode: 66,
    advanceWidth: 500,
    path: rect
  });

  const font = new opentype.Font({
    familyName: 'TestFont',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [glyphNotdef, glyphA, glyphB]
  });

  const buf = font.toArrayBuffer();
  return new Uint8Array(buf);
}

function parseFont(u8: Uint8Array): opentype.Font {
  const buffer = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  return opentype.parse(buffer);
}

describe('font-converter', () => {
  it('converts TTF -> WOFF -> TTF and preserves basic naming', async () => {
    const ttf = makeTestTtf();

    const woff = await convertFont(ttf, { from: 'ttf', to: 'woff' });
    expect(woff.data.byteLength).toBeGreaterThan(100);

    const ttf2 = await convertFont(woff.data, { from: 'woff', to: 'ttf' });
    const parsed = parseFont(ttf2.data);

    expect(parsed.names.fontFamily.en).toBe('TestFont');
  });

  it('converts TTF -> OTF -> TTF', async () => {
    const ttf = makeTestTtf();

    const otf = await convertFont(ttf, { from: 'ttf', to: 'otf' });
    expect(otf.data.byteLength).toBeGreaterThan(100);

    const ttf2 = await convertFont(otf.data, { from: 'otf', to: 'ttf' });
    expect(ttf2.data.byteLength).toBeGreaterThan(100);
  });

  it('supports subsetting via subsetText', async () => {
    const ttf = makeTestTtf();

    const full = await convertFont(ttf, { from: 'ttf', to: 'woff' });
    const subset = await convertFont(ttf, { from: 'ttf', to: 'woff', subsetText: 'A' });

    expect(subset.data.byteLength).toBeLessThan(full.data.byteLength);
  });
});
