import { createFont, woff2 } from 'fonteditor-core';
import opentype from 'opentype.js';

import type { ByteArray } from '../types/files';

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export interface FontMetadata {
  family?: string;
  subfamily?: string;
  version?: string;
  weightClass?: number;
  glyphCount?: number;
  unitsPerEm?: number;
}

export interface FontConvertOptions {
  from: FontFormat;
  to: FontFormat;
  subsetText?: string;
}

let woff2Ready: Promise<void> | undefined;
async function ensureWoff2Ready(): Promise<void> {
  if (!woff2Ready) {
    woff2Ready = woff2.init().then(() => undefined);
  }
  await woff2Ready;
}

function uniqueCodePoints(text: string): number[] {
  const set = new Set<number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp != null) set.add(cp);
  }
  return Array.from(set);
}

function toUint8Array(data: ArrayBuffer | Buffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return new Uint8Array(data);
  return new Uint8Array(data);
}

function extractMetadata(fontObject: any): FontMetadata {
  return {
    family: fontObject?.name?.fontFamily,
    subfamily: fontObject?.name?.fontSubFamily,
    version: fontObject?.name?.version,
    weightClass: fontObject?.['OS/2']?.usWeightClass,
    glyphCount: fontObject?.maxp?.numGlyphs,
    unitsPerEm: fontObject?.head?.unitsPerEm ?? fontObject?.head?.unitsPerE
  };
}

export async function convertFont(
  input: ByteArray,
  opts: FontConvertOptions
): Promise<{ data: Uint8Array; metadata: FontMetadata }> {
  if (opts.from === 'woff2' || opts.to === 'woff2') {
    await ensureWoff2Ready();
  }

  const subset = opts.subsetText ? uniqueCodePoints(opts.subsetText) : undefined;

  const font = createFont(Buffer.from(input), {
    type: opts.from,
    subset
  });

  const fontObject = font.get();
  const metadata = extractMetadata(fontObject);

  const out = font.write({
    type: opts.to,
    hinting: false,
    kerning: false
  });

  return { data: toUint8Array(out as any), metadata };
}

export async function getFontSampleSvg(
  input: ByteArray,
  opts: { format: FontFormat; text: string; fontSize?: number }
): Promise<string> {
  const fontData = opts.format === 'woff2' ? (await convertFont(input, { from: 'woff2', to: 'ttf' })).data : input;
  const buffer = fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength);
  const font = opentype.parse(buffer);

  const fontSize = opts.fontSize ?? 48;
  const path = font.getPath(opts.text, 0, fontSize, fontSize);
  const bbox = path.getBoundingBox();

  const width = Math.max(1, bbox.x2 - bbox.x1);
  const height = Math.max(1, bbox.y2 - bbox.y1);

  const svgPath = path.toPathData(2);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x1} ${bbox.y1} ${width} ${height}"><path d="${svgPath}"/></svg>`;
}
