import type { ConversionAdapter } from '../types/adapters';
import type {
  AudioConvertOptions,
  AudioFormat,
  ConversionContext,
  ConversionInput,
  ConversionOutput
} from '../types/conversion';
import { throwIfAborted } from '../utils/abort';
import { buildFFmpegArgs, executeFFmpeg } from '../utils/ffmpeg';
import { audioFormatToMimeType, mimeTypeToAudioFormat, normalizeAudioFormat } from '../utils/mime';

export class UnsupportedAudioFormatError extends Error {
  readonly format: string;

  constructor(message: string, format: string) {
    super(message);
    this.name = 'UnsupportedAudioFormatError';
    this.format = format;
  }
}

export class AudioDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioDecodeError';
  }
}

function buildOutputFileName(inputFileName: string, outputFormat: AudioFormat): string {
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${outputFormat}`;
}

export async function convertAudio(
  input: ConversionInput,
  options: AudioConvertOptions,
  ctx: ConversionContext
): Promise<ConversionOutput> {
  const inputFormat = mimeTypeToAudioFormat(input.mimeType);
  const outputFormat = normalizeAudioFormat(options.outputFormat);

  ctx.emitProgress({ percent: 0.02, stage: 'load', message: 'Loading FFmpeg' });
  throwIfAborted(ctx.signal);

  if (inputFormat === 'wma') {
    try {
      ctx.emitProgress({ percent: 0.05, stage: 'decode', message: `Decoding ${inputFormat}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('DRM') || message.includes('protected')) {
        throw new AudioDecodeError('Unsupported DRM-protected WMA file');
      }
      throw new AudioDecodeError(`Failed to decode WMA: ${message}`);
    }
  }

  ctx.emitProgress({ percent: 0.1, stage: 'prepare', message: 'Preparing conversion' });
  throwIfAborted(ctx.signal);

  const inputExtension = getExtensionForFormat(inputFormat);
  const outputExtension = getExtensionForFormat(outputFormat);
  const inputName = `input.${inputExtension}`;
  const outputName = `output.${outputExtension}`;

  const ffmpegArgs = buildFFmpegArgs({
    outputFormat: outputFormat,
    codec: options.codec,
    bitrate: options.bitrate,
    sampleRate: options.sampleRate,
    channels: options.channels,
    trim: options.trim,
    speed: options.speed,
    volumeNormalization: options.volumeNormalization,
    fade: options.fade,
    eqPreset: options.eqPreset,
    metadata: options.metadata
  });

  ctx.emitProgress({ percent: 0.15, stage: 'convert', message: `Converting to ${outputFormat}` });
  throwIfAborted(ctx.signal);

  let outputBuffer: Uint8Array;
  try {
    outputBuffer = await executeFFmpeg({
      inputName,
      inputData: input.data,
      outputName,
      args: ffmpegArgs,
      ctx
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    
    if (message.includes('Invalid data') || message.includes('decode')) {
      throw new AudioDecodeError(`Failed to decode audio: ${message}`);
    }
    
    throw new UnsupportedAudioFormatError(
      `Audio conversion failed: ${message}`,
      outputFormat
    );
  }

  ctx.emitProgress({ percent: 1, stage: 'complete' });

  const outputMimeType = audioFormatToMimeType(outputFormat);

  return {
    fileName: buildOutputFileName(input.fileName, outputFormat),
    mimeType: outputMimeType,
    data: outputBuffer
  };
}

function getExtensionForFormat(format: AudioFormat): string {
  return format;
}

export const audioConverterAdapter: ConversionAdapter<AudioConvertOptions> = {
  id: 'audio-converter',
  convert: convertAudio
};
