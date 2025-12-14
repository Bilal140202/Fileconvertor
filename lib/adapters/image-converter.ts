import type { ConversionAdapter } from '../types/adapters';
import type { ConversionContext, ConversionInput, ConversionOutput, ImageConvertOptions, ImageFormat } from '../types/conversion';
import { throwIfAborted } from '../utils/abort';
import { imageFormatToMimeType, mimeTypeToImageFormat, normalizeImageFormat } from '../utils/mime';

export class UnsupportedImageFormatError extends Error {
  readonly format: string;

  constructor(message: string, format: string) {
    super(message);
    this.name = 'UnsupportedImageFormatError';
    this.format = format;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildOutputFileName(inputFileName: string, outputFormat: ImageFormat): string {
  const safeFormat = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${safeFormat}`;
}

async function loadSharp(): Promise<any> {
  const mod: any = await import('@img/sharp-wasm');

  const maybeInit = mod.initialize ?? mod.init ?? mod.default?.initialize ?? mod.default?.init;
  if (typeof maybeInit === 'function') await maybeInit();

  const sharp = mod.default ?? mod;
  if (typeof sharp !== 'function') throw new Error('Failed to load @img/sharp-wasm');
  return sharp;
}

export async function convertImage(
  input: ConversionInput,
  options: ImageConvertOptions,
  ctx: ConversionContext
): Promise<ConversionOutput> {
  const inputFormat = mimeTypeToImageFormat(input.mimeType);
  const outputFormat = normalizeImageFormat(options.outputFormat);

  if (outputFormat === 'svg') {
    throw new UnsupportedImageFormatError('SVG output is not supported.', outputFormat);
  }

  ctx.emitProgress({ percent: 0.02, stage: 'load', message: 'Loading codecs' });
  throwIfAborted(ctx.signal);

  const sharp = await loadSharp();

  ctx.emitProgress({ percent: 0.06, stage: 'decode', message: `Decoding ${inputFormat}` });
  throwIfAborted(ctx.signal);

  let pipeline = sharp(input.data);

  if (options.crop) {
    ctx.emitProgress({ percent: 0.18, stage: 'crop', message: 'Cropping' });
    throwIfAborted(ctx.signal);
    pipeline = pipeline.extract({
      left: Math.max(0, Math.floor(options.crop.x)),
      top: Math.max(0, Math.floor(options.crop.y)),
      width: Math.max(1, Math.floor(options.crop.width)),
      height: Math.max(1, Math.floor(options.crop.height))
    });
  }

  if (options.resize?.width || options.resize?.height) {
    ctx.emitProgress({ percent: 0.3, stage: 'resize', message: 'Resizing' });
    throwIfAborted(ctx.signal);
    pipeline = pipeline.resize({
      width: options.resize.width,
      height: options.resize.height,
      fit: options.resize.fit ?? 'inside'
    });
  }

  if (typeof options.rotate === 'number' && Number.isFinite(options.rotate) && options.rotate !== 0) {
    ctx.emitProgress({ percent: 0.42, stage: 'rotate', message: 'Rotating' });
    throwIfAborted(ctx.signal);
    pipeline = pipeline.rotate(options.rotate);
  }

  if (options.flip) {
    ctx.emitProgress({ percent: 0.48, stage: 'flip', message: 'Flipping' });
    throwIfAborted(ctx.signal);
    pipeline = pipeline.flip();
  }

  if (options.flop) {
    ctx.emitProgress({ percent: 0.52, stage: 'flop', message: 'Flopping' });
    throwIfAborted(ctx.signal);
    pipeline = pipeline.flop();
  }

  if (options.filters) {
    const { brightness, contrast, saturation, hue } = options.filters;

    const hasModulate =
      typeof brightness === 'number' || typeof saturation === 'number' || typeof hue === 'number';

    if (hasModulate) {
      ctx.emitProgress({ percent: 0.6, stage: 'filters', message: 'Applying filters' });
      throwIfAborted(ctx.signal);
      pipeline = pipeline.modulate({
        brightness: typeof brightness === 'number' ? 1 + clampNumber(brightness, -100, 100) / 100 : undefined,
        saturation: typeof saturation === 'number' ? 1 + clampNumber(saturation, -100, 100) / 100 : undefined,
        hue: typeof hue === 'number' ? clampNumber(hue, -180, 180) : undefined
      });
    }

    if (typeof contrast === 'number' && Number.isFinite(contrast) && contrast !== 0) {
      const c = 1 + clampNumber(contrast, -100, 100) / 100;
      const b = -(128 * c) + 128;
      pipeline = pipeline.linear(c, b);
    }
  }

  const shouldFlatten = outputFormat === 'jpeg' || outputFormat === 'bmp';
  if (shouldFlatten) {
    pipeline = pipeline.flatten({ background: options.backgroundColor ?? '#ffffff' });
  }

  ctx.emitProgress({ percent: 0.74, stage: 'encode', message: `Encoding ${outputFormat}` });
  throwIfAborted(ctx.signal);

  const quality = typeof options.quality === 'number' ? clampNumber(options.quality, 1, 100) : undefined;

  try {
    if (outputFormat === 'png') {
      pipeline = pipeline.toFormat('png', {
        compressionLevel: quality == null ? undefined : clampNumber(9 - Math.round((quality / 100) * 9), 0, 9)
      });
    } else if (outputFormat === 'jpeg') {
      pipeline = pipeline.toFormat('jpeg', { quality, mozjpeg: true });
    } else if (outputFormat === 'webp') {
      pipeline = pipeline.toFormat('webp', { quality });
    } else if (outputFormat === 'gif') {
      pipeline = pipeline.toFormat('gif');
    } else if (outputFormat === 'tiff') {
      pipeline = pipeline.toFormat('tiff', { quality });
    } else if (outputFormat === 'ico') {
      pipeline = pipeline.toFormat('ico');
    } else if (outputFormat === 'bmp') {
      pipeline = pipeline.toFormat('bmp');
    } else {
      throw new UnsupportedImageFormatError(`Unsupported output format: ${outputFormat}`, outputFormat);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UnsupportedImageFormatError(message, outputFormat);
  }

  ctx.emitProgress({ percent: 0.9, stage: 'render', message: 'Rendering output' });
  throwIfAborted(ctx.signal);

  const outputBuffer: Uint8Array = await pipeline.toBuffer();

  ctx.emitProgress({ percent: 1, stage: 'complete' });

  const outputMimeType = imageFormatToMimeType(outputFormat);

  return {
    fileName: buildOutputFileName(input.fileName, outputFormat),
    mimeType: outputMimeType,
    data: outputBuffer
  };
}

export const imageConverterAdapter: ConversionAdapter<ImageConvertOptions> = {
  id: 'image-converter',
  convert: convertImage
};
