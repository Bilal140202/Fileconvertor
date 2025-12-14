import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { ConversionContext } from '../types/conversion';

let ffmpegInstance: FFmpeg | null = null;
let initPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return initPromise;
}

export interface FFmpegExecuteOptions {
  inputName: string;
  inputData: Uint8Array;
  outputName: string;
  args: string[];
  ctx: ConversionContext;
}

export async function executeFFmpeg(options: FFmpegExecuteOptions): Promise<Uint8Array> {
  const { inputName, inputData, outputName, args, ctx } = options;
  const ffmpeg = await getFFmpeg();

  let progressHandler: ((progress: { progress: number; time: number }) => void) | null = null;

  try {
    progressHandler = ({ progress }) => {
      if (progress >= 0 && progress <= 1) {
        ctx.emitProgress({
          percent: progress,
          stage: 'encode',
          message: `Processing: ${Math.round(progress * 100)}%`
        });
      }
    };

    ffmpeg.on('progress', progressHandler);

    await ffmpeg.writeFile(inputName, inputData);

    const fullArgs = ['-i', inputName, ...args, outputName];
    await ffmpeg.exec(fullArgs);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});

    return new Uint8Array(data as ArrayBuffer);
  } finally {
    if (progressHandler) {
      ffmpeg.off('progress', progressHandler);
    }
  }
}

export function buildFFmpegArgs(options: {
  outputFormat: string;
  codec?: string;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  trim?: { start: number; end: number };
  speed?: number;
  volumeNormalization?: boolean;
  fade?: { in?: number; out?: number };
  eqPreset?: string;
  metadata?: Record<string, string>;
}): string[] {
  const args: string[] = [];

  if (options.trim) {
    args.push('-ss', options.trim.start.toString());
    args.push('-to', options.trim.end.toString());
  }

  if (options.codec) {
    args.push('-c:a', options.codec);
  } else {
    args.push('-c:a', getDefaultCodecForFormat(options.outputFormat));
  }

  if (options.bitrate) {
    args.push('-b:a', options.bitrate);
  }

  if (options.sampleRate) {
    args.push('-ar', options.sampleRate.toString());
  }

  if (options.channels) {
    args.push('-ac', options.channels.toString());
  }

  const filters: string[] = [];

  if (options.speed && options.speed !== 1) {
    filters.push(`atempo=${options.speed}`);
  }

  if (options.volumeNormalization) {
    filters.push('loudnorm');
  }

  if (options.fade?.in || options.fade?.out) {
    if (options.fade.in) {
      filters.push(`afade=t=in:st=0:d=${options.fade.in}`);
    }
    if (options.fade.out) {
      filters.push(`afade=t=out:st=${options.fade.out}:d=3`);
    }
  }

  if (options.eqPreset) {
    const eqFilter = getEQFilter(options.eqPreset);
    if (eqFilter) {
      filters.push(eqFilter);
    }
  }

  if (filters.length > 0) {
    args.push('-af', filters.join(','));
  }

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      if (value) {
        args.push('-metadata', `${key}=${value}`);
      }
    }
  }

  return args;
}

function getDefaultCodecForFormat(format: string): string {
  switch (format.toLowerCase()) {
    case 'mp3':
      return 'libmp3lame';
    case 'wav':
      return 'pcm_s16le';
    case 'ogg':
      return 'libvorbis';
    case 'aac':
      return 'aac';
    case 'flac':
      return 'flac';
    case 'opus':
      return 'libopus';
    case 'wma':
      return 'wmav2';
    default:
      return 'copy';
  }
}

function getEQFilter(preset: string): string {
  switch (preset) {
    case 'bass_boost':
      return 'equalizer=f=100:width_type=h:width=200:g=10';
    case 'treble_boost':
      return 'equalizer=f=10000:width_type=h:width=2000:g=10';
    case 'vocal':
      return 'equalizer=f=3000:width_type=h:width=1000:g=5';
    case 'flat':
    default:
      return '';
  }
}
