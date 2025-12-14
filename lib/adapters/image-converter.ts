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

function buildOutputFileName(inputFileName: string, outputFormat: ImageFormat): string {
  const safeFormat = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${safeFormat}`;
}

async function loadImageProcessor(): Promise<unknown> {
  const { ImagePool } = await import('@squoosh/lib');
  return new ImagePool(1);
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

  const pool = await loadImageProcessor();

  ctx.emitProgress({ percent: 0.06, stage: 'decode', message: `Decoding ${inputFormat}` });
  throwIfAborted(ctx.signal);

  const image = (pool as { ingestImage: (data: Uint8Array) => unknown }).ingestImage(input.data);

  const preprocessOptions: Record<string, unknown> = {};

  if (options.resize?.width || options.resize?.height) {
    ctx.emitProgress({ percent: 0.2, stage: 'resize', message: 'Resizing' });
    throwIfAborted(ctx.signal);
    preprocessOptions.resize = {
      enabled: true,
      width: options.resize.width,
      height: options.resize.height
    };
  }

  if (options.rotate) {
    ctx.emitProgress({ percent: 0.35, stage: 'rotate', message: 'Rotating' });
    throwIfAborted(ctx.signal);
    preprocessOptions.rotate = {
      enabled: true,
      numRotations: Math.round(options.rotate / 90) % 4
    };
  }

  await (image as { preprocess: (options: Record<string, unknown>) => Promise<void> }).preprocess(preprocessOptions);

  ctx.emitProgress({ percent: 0.6, stage: 'encode', message: `Encoding ${outputFormat}` });
  throwIfAborted(ctx.signal);

  const quality = options.quality ?? 80;

  const encodeOptions: Record<string, unknown> = {};

  if (outputFormat === 'png') {
    encodeOptions.oxipng = { quality };
  } else if (outputFormat === 'jpeg') {
    encodeOptions.mozjpeg = { quality };
  } else if (outputFormat === 'webp') {
    encodeOptions.webp = { quality };
  } else {
    throw new UnsupportedImageFormatError(`Unsupported output format: ${outputFormat}`, outputFormat);
  }

  try {
    await (image as { encode: (options: Record<string, unknown>) => Promise<void> }).encode(encodeOptions);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UnsupportedImageFormatError(message, outputFormat);
  }

  ctx.emitProgress({ percent: 0.9, stage: 'render', message: 'Rendering output' });
  throwIfAborted(ctx.signal);

  let outputBuffer: Uint8Array;

  const encodedWith = (image as { encodedWith: Record<string, Promise<{ binary: Uint8Array }> | undefined> }).encodedWith;

  if (outputFormat === 'png' && encodedWith.oxipng !== undefined) {
    outputBuffer = (await encodedWith.oxipng).binary;
  } else if (outputFormat === 'jpeg' && encodedWith.mozjpeg !== undefined) {
    outputBuffer = (await encodedWith.mozjpeg).binary;
  } else if (outputFormat === 'webp' && encodedWith.webp !== undefined) {
    outputBuffer = (await encodedWith.webp).binary;
  } else {
    throw new UnsupportedImageFormatError(`Failed to encode as ${outputFormat}`, outputFormat);
  }

  await (pool as { close: () => Promise<void> }).close();

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
