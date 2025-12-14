import {
  brotliCompressSync,
  brotliDecompressSync,
  constants,
  gzipSync,
  gunzipSync
} from 'node:zlib';

export type CompressionAlgorithm = 'gzip' | 'brotli';

export interface CompressOptions {
  algorithm: CompressionAlgorithm;
  level?: number;
}

export interface CompressionResult {
  data: Uint8Array;
  ratio: number; // compressed / original
}

function clamp(level: number | undefined, { min, max, fallback }: { min: number; max: number; fallback: number }): number {
  if (level == null || Number.isNaN(level)) return fallback;
  return Math.min(max, Math.max(min, Math.round(level)));
}

export function compressData(input: Uint8Array, opts: CompressOptions): CompressionResult {
  if (!input.length) return { data: new Uint8Array(), ratio: 1 };

  if (opts.algorithm === 'gzip') {
    const level = clamp(opts.level, { min: 0, max: 9, fallback: 6 });
    const compressed = gzipSync(input, { level });
    return { data: new Uint8Array(compressed), ratio: compressed.length / input.length };
  }

  const quality = clamp(opts.level, { min: 0, max: 11, fallback: 6 });
  const compressed = brotliCompressSync(input, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: quality
    }
  });

  return { data: new Uint8Array(compressed), ratio: compressed.length / input.length };
}

export function decompressData(input: Uint8Array, algorithm: CompressionAlgorithm): Uint8Array {
  if (algorithm === 'gzip') return new Uint8Array(gunzipSync(input));
  return new Uint8Array(brotliDecompressSync(input));
}
