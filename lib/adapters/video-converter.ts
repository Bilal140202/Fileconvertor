import type { ConversionAdapter } from '../types/adapters';
import type {
  ConversionContext,
  ConversionInput,
  ConversionOutput,
  VideoConvertOptions,
  VideoCodec,
  VideoFormat
} from '../types/conversion';
import { throwIfAborted } from '../utils/abort';
import {
  loadFFmpeg,
  setupProgressHandler,
  clearFFmpegFiles,
  executeFFmpeg,
  extractVideoMetadata
} from '../utils/ffmpeg';

export class UnsupportedVideoFormatError extends Error {
  readonly format: string;

  constructor(message: string, format: string) {
    super(message);
    this.name = 'UnsupportedVideoFormatError';
    this.format = format;
  }
}

function buildOutputFileName(inputFileName: string, outputFormat: VideoFormat): string {
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${outputFormat}`;
}

function getCodecArgs(outputFormat: VideoFormat, codec?: VideoCodec): string[] {
  if (codec) {
    const codecMap: Record<VideoCodec, string> = {
      h264: 'libx264',
      vp8: 'libvpx',
      vp9: 'libvpx-vp9'
    };
    return ['-c:v', codecMap[codec]];
  }

  const defaultCodecs: Record<VideoFormat, string> = {
    mp4: 'libx264',
    webm: 'libvpx-vp9',
    mov: 'libx264',
    mkv: 'libx264',
    avi: 'libx264',
    flv: 'libx264'
  };

  return ['-c:v', defaultCodecs[outputFormat]];
}

function getAudioCodecArgs(outputFormat: VideoFormat): string[] {
  const audioCodecs: Record<VideoFormat, string> = {
    mp4: 'aac',
    webm: 'libopus',
    mov: 'aac',
    mkv: 'aac',
    avi: 'mp3',
    flv: 'aac'
  };

  return ['-c:a', audioCodecs[outputFormat]];
}

function buildFFmpegCommand(
  inputFileName: string,
  outputFileName: string,
  options: VideoConvertOptions,
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

  args.push(...getCodecArgs(options.outputFormat, options.codec));

  if (options.bitrate) {
    args.push('-b:v', `${options.bitrate}k`);
  }

  if (options.resolution?.width || options.resolution?.height) {
    const width = options.resolution.width ?? -1;
    const height = options.resolution.height ?? -1;

    let scaleFilter = `scale=${width}:${height}`;

    if (options.scaleMode === 'fit') {
      scaleFilter += ':force_original_aspect_ratio=decrease';
    } else if (options.scaleMode === 'fill') {
      scaleFilter += ':force_original_aspect_ratio=increase';
    }

    args.push('-vf', scaleFilter);
  }

  if (options.frameRate) {
    args.push('-r', options.frameRate.toString());
  }

  if (options.audioTrack !== undefined) {
    args.push('-map', `0:v:0`, '-map', `0:a:${options.audioTrack}`);
  }

  if (options.subtitleTrack !== undefined && options.burnSubtitles) {
    const currentVf = args.findIndex((arg) => arg === '-vf');
    if (currentVf >= 0) {
      args[currentVf + 1] += `,subtitles=${inputFileName}:si=${options.subtitleTrack}`;
    } else {
      args.push('-vf', `subtitles=${inputFileName}:si=${options.subtitleTrack}`);
    }
  } else if (options.subtitleTrack !== undefined) {
    args.push('-map', `0:s:${options.subtitleTrack}`);
  }

  args.push(...getAudioCodecArgs(options.outputFormat));

  args.push('-y', outputFileName);

  return args;
}

export async function convertVideo(
  input: ConversionInput,
  options: VideoConvertOptions,
  ctx: ConversionContext
): Promise<ConversionOutput> {
  const inputFileName = 'input_video';
  const outputFileName = `output.${options.outputFormat}`;

  ctx.emitProgress({ percent: 0.02, stage: 'load', message: 'Loading FFmpeg' });
  throwIfAborted(ctx.signal);

  const ffmpeg = await loadFFmpeg();

  ctx.emitProgress({ percent: 0.05, stage: 'setup', message: 'Preparing video' });
  throwIfAborted(ctx.signal);

  clearFFmpegFiles(ffmpeg, inputFileName, outputFileName);

  await ffmpeg.writeFile(inputFileName, input.data);

  ctx.emitProgress({ percent: 0.1, stage: 'analyze', message: 'Analyzing video' });
  throwIfAborted(ctx.signal);

  const metadata = await extractVideoMetadata(ffmpeg, inputFileName);

  ctx.emitProgress({ percent: 0.15, stage: 'convert', message: 'Converting video' });
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

  const outputMimeType = videoFormatToMimeType(options.outputFormat);

  return {
    fileName: buildOutputFileName(input.fileName, options.outputFormat),
    mimeType: outputMimeType,
    data: outputData instanceof Uint8Array ? outputData : new Uint8Array(outputData as unknown as ArrayBuffer)
  };
}

export function videoFormatToMimeType(format: VideoFormat): string {
  const mimeTypes: Record<VideoFormat, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    flv: 'video/x-flv'
  };

  return mimeTypes[format];
}

export function mimeTypeToVideoFormat(mimeType: string): VideoFormat | null {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();

  const formatMap: Record<string, VideoFormat> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'video/x-msvideo': 'avi',
    'video/x-flv': 'flv'
  };

  return formatMap[mime] ?? null;
}

export const videoConverterAdapter: ConversionAdapter<VideoConvertOptions> = {
  id: 'video-converter',
  convert: convertVideo
};
