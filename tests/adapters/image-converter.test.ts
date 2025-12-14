import { describe, expect, it } from 'vitest';

import { convertImage } from '../../lib/adapters/image-converter';
import type { ConversionContext, ConversionInput } from '../../lib/types/conversion';
import { loadFixtureBytesFromBase64, loadFixtureText } from '../utils/fixtures';

async function loadSharp(): Promise<any> {
  const mod: any = await import('@img/sharp-wasm');
  const maybeInit = mod.initialize ?? mod.init ?? mod.default?.initialize ?? mod.default?.init;
  if (typeof maybeInit === 'function') await maybeInit();
  return mod.default ?? mod;
}

function ctx(): ConversionContext {
  return {
    signal: new AbortController().signal,
    emitProgress: () => undefined
  };
}

describe('image-converter adapter', () => {
  it('converts SVG -> PNG with resize', async () => {
    const svg = await loadFixtureText('red-square.svg');

    const input: ConversionInput = {
      fileName: 'fixture.svg',
      mimeType: 'image/svg+xml',
      data: new TextEncoder().encode(svg)
    };

    const output = await convertImage(input, { outputFormat: 'png', resize: { width: 4, height: 4 } }, ctx());

    expect(output.mimeType).toBe('image/png');

    const sharp = await loadSharp();
    const meta = await sharp(output.data).metadata();
    expect(meta.width).toBe(4);
    expect(meta.height).toBe(4);
    expect(meta.format).toBe('png');
  });

  it('applies crop', async () => {
    const svg = await loadFixtureText('red-square.svg');

    const input: ConversionInput = {
      fileName: 'fixture.svg',
      mimeType: 'image/svg+xml',
      data: new TextEncoder().encode(svg)
    };

    const output = await convertImage(
      input,
      { outputFormat: 'png', crop: { x: 0, y: 0, width: 1, height: 1 } },
      ctx()
    );

    const sharp = await loadSharp();
    const meta = await sharp(output.data).metadata();

    expect(meta.width).toBe(1);
    expect(meta.height).toBe(1);
  });

  it('applies brightness filter', async () => {
    const svg = await loadFixtureText('red-square.svg');

    const input: ConversionInput = {
      fileName: 'fixture.svg',
      mimeType: 'image/svg+xml',
      data: new TextEncoder().encode(svg)
    };

    const sharp = await loadSharp();

    const base = await convertImage(input, { outputFormat: 'png' }, ctx());
    const bright = await convertImage(input, { outputFormat: 'png', filters: { brightness: 50 } }, ctx());

    const baseRaw = await sharp(base.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const brightRaw = await sharp(bright.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const mean = (buf: Buffer) => buf.reduce((sum, v) => sum + v, 0) / buf.length;

    expect(mean(brightRaw.data)).toBeGreaterThan(mean(baseRaw.data));
  });

  it('converts PNG -> WEBP', async () => {
    const bytes = await loadFixtureBytesFromBase64('transparent-1x1.png.base64');

    const input: ConversionInput = {
      fileName: 'fixture.png',
      mimeType: 'image/png',
      data: bytes
    };

    const output = await convertImage(input, { outputFormat: 'webp', quality: 80 }, ctx());
    expect(output.mimeType).toBe('image/webp');

    const sharp = await loadSharp();
    const meta = await sharp(output.data).metadata();

    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(1);
    expect(meta.height).toBe(1);
  });
});
