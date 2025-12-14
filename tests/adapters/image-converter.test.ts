import { describe, expect, it } from 'vitest';

import type { ConversionContext, ConversionInput } from '../../lib/types/conversion';
import { imageConverterAdapter } from '../../lib/adapters/image-converter';

function ctx(): ConversionContext {
  return {
    signal: new AbortController().signal,
    emitProgress: () => undefined
  };
}

describe('image-converter adapter', () => {
  it('has correct adapter ID', () => {
    expect(imageConverterAdapter.id).toBe('image-converter');
  });

  it('exports convert function', () => {
    expect(typeof imageConverterAdapter.convert).toBe('function');
  });

  it('throws on unsupported SVG output', async () => {
    const input: ConversionInput = {
      fileName: 'test.png',
      mimeType: 'image/png',
      data: new Uint8Array([137, 80, 78, 71])
    };

    await expect(
      imageConverterAdapter.convert(input, { outputFormat: 'svg' }, ctx())
    ).rejects.toThrow('SVG output is not supported');
  });
});
