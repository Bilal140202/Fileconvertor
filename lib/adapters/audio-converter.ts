import type { ConversionAdapter } from '../types/adapters';
import type {
  ConversionContext,
  ConversionInput,
  ConversionOutput,
  AudioConvertOptions,
  AudioFormat,
  AudioCodec
} from '../types/conversion';
import { throwIfAborted } from '../utils/abort';
import {
  loadFFmpeg,
  setupProgressHandler,
  clearFFmpegFiles,
  executeFFmpeg,
  extractVideoMetadata
} from '../utils/ffmpeg';

export class UnsupportedAudioFormatError extends Error {
  readonly format: string;

  constructor(message: string, format: string) {
    super(message);
    this.name = 'UnsupportedAudioFormatError';
    this.format = format;
  }
}

function buildOutputFileName(inputFileName: string, outputFormat: AudioFormat): string {
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${outputFormat}`;
}

function getAudioCodecArgs(outputFormat: AudioFormat, codec?: AudioCodec): string[] {
  if (codec) {
    const codecMap: Record<AudioCodec, string> = {
      aac: 'aac',
      mp3: 'libmp3lame',
      opus: 'libopus',
      vorbis: 'libvorbis'
    };
    return ['-c:a', codecMap[codec]];
  }

  const defaultCodecs: Record<AudioFormat, string> = {
    mp3: 'libmp3lame',
    aac: 'aac',
    ogg: 'libvorbis',
    wav: 'pcm_s16le',
    flac: 'flac'
  };

  return ['-c:a', defaultCodecs[outputFormat]];
}

function buildFFmpegCommand(
  inputFileName: string,
  outputFileName: string,
  options: AudioConvertOptions,
  metadata?: { duration?: number }
): string[] {
  const args: string[] = [];

  if (options.trim?.start !== undefined && options.trim.start > 0) {
    args.push('-ss', options.trim.start.toString());
  }

  args.push('-i', inputFileName);

  if (options.trim?.end !== undefined && metadata?.duration) {
    const duration = options.trim.end - (options.trim.start ?? 0);
    if (duration > 0) {
      args.push('-t', duration.toString());
    }
  }

  args.push('-vn');

  args.push(...getAudioCodecArgs(options.outputFormat, options.codec));

  if (options.bitrate) {
    args.push('-b:a', `${options.bitrate}k`);
  }

  if (options.sampleRate) {
    args.push('-ar', options.sampleRate.toString());
  }

  if (options.channels) {
    args.push('-ac', options.channels.toString());
  }

  args.push('-y', outputFileName);

  return args;
}

export async function convertAudio(
  input: ConversionInput,
  options: AudioConvertOptions,
  ctx: ConversionContext
): Promise<ConversionOutput> {
  const inputFileName = 'input_audio';
  const outputFileName = `output.${options.outputFormat}`;

  ctx.emitProgress({ percent: 0.02, stage: 'load', message: 'Loading FFmpeg' });
  throwIfAborted(ctx.signal);

  const ffmpeg = await loadFFmpeg();

  ctx.emitProgress({ percent: 0.05, stage: 'setup', message: 'Preparing audio' });
  throwIfAborted(ctx.signal);

  clearFFmpegFiles(ffmpeg, inputFileName, outputFileName);

  await ffmpeg.writeFile(inputFileName, input.data);

  ctx.emitProgress({ percent: 0.1, stage: 'analyze', message: 'Analyzing audio' });
  throwIfAborted(ctx.signal);

  const metadata = await extractVideoMetadata(ffmpeg, inputFileName);

  ctx.emitProgress({ percent: 0.15, stage: 'convert', message: 'Converting audio' });
  throwIfAborted(ctx.signal);

  setupProgressHandler(ffmpeg, metadata.duration, ({ ratio }) => {
    const percent = 0.15 + ratio * 0.8;
    ctx.emitProgress({
      percent,
      stage: 'convert',
      message: `Converting: ${Math.round(ratio * 100)}%`
    });
  });

  const ffmpegArgs = buildFFmpegCommand(inputFileName, outputFileName, options, metadata);

  await executeFFmpeg(ffmpeg, ffmpegArgs, ctx.signal);

  ctx.emitProgress({ percent: 0.96, stage: 'finalize', message: 'Finalizing output' });
  throwIfAborted(ctx.signal);

  const outputData = await ffmpeg.readFile(outputFileName);

  clearFFmpegFiles(ffmpeg, inputFileName, outputFileName);

  ctx.emitProgress({ percent: 1, stage: 'complete' });

  const outputMimeType = audioFormatToMimeType(options.outputFormat);

  return {
    fileName: buildOutputFileName(input.fileName, options.outputFormat),
    mimeType: outputMimeType,
    data: outputData instanceof Uint8Array ? outputData : new Uint8Array(outputData as unknown as ArrayBuffer)
  };
}

export function audioFormatToMimeType(format: AudioFormat): string {
  const mimeTypes: Record<AudioFormat, string> = {
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    flac: 'audio/flac'
  };

  return mimeTypes[format];
}

export function mimeTypeToAudioFormat(mimeType: string): AudioFormat | null {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();

  const formatMap: Record<string, AudioFormat> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/flac': 'flac'
  };

  return formatMap[mime] ?? null;
}

export const audioConverterAdapter: ConversionAdapter<AudioConvertOptions> = {
  id: 'audio-converter',
  convert: convertAudio
};
