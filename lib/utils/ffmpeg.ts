import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

export interface FFmpegProgressCallback {
  (progress: { ratio: number; time: number }): void;
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export function setupProgressHandler(
  ffmpeg: FFmpeg,
  duration: number | undefined,
  onProgress: FFmpegProgressCallback
): void {
  ffmpeg.on('progress', ({ progress, time }) => {
    const ratio = duration && duration > 0 ? Math.min(time / (duration * 1000000), 1) : progress;
    onProgress({ ratio, time });
  });
}

export function clearFFmpegFiles(ffmpeg: FFmpeg, ...fileNames: string[]): void {
  for (const fileName of fileNames) {
    try {
      ffmpeg.deleteFile(fileName);
    } catch {
      // Ignore errors when deleting files that don't exist
    }
  }
}

export async function executeFFmpeg(
  ffmpeg: FFmpeg,
  args: string[],
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const abortHandler = () => {
    ffmpeg.terminate();
  };

  signal?.addEventListener('abort', abortHandler);

  try {
    await ffmpeg.exec(args);
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }
}

export interface VideoMetadataResult {
  duration?: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number;
  frameRate?: number;
}

export async function extractVideoMetadata(
  ffmpeg: FFmpeg,
  inputFileName: string
): Promise<VideoMetadataResult> {
  const metadata: VideoMetadataResult = {};

  let output = '';
  ffmpeg.on('log', ({ message }) => {
    output += message + '\n';
  });

  try {
    await ffmpeg.exec(['-i', inputFileName, '-f', 'null', '-']);
  } catch {
    // FFmpeg returns non-zero for probe operations, but still outputs metadata
  }

  const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (durationMatch) {
    const hours = parseFloat(durationMatch[1]);
    const minutes = parseFloat(durationMatch[2]);
    const seconds = parseFloat(durationMatch[3]);
    metadata.duration = hours * 3600 + minutes * 60 + seconds;
  }

  const videoStreamMatch = output.match(/Stream #\d+:\d+.*Video: (\w+).*?(\d+)x(\d+)/);
  if (videoStreamMatch) {
    metadata.videoCodec = videoStreamMatch[1];
    metadata.width = parseInt(videoStreamMatch[2], 10);
    metadata.height = parseInt(videoStreamMatch[3], 10);
  }

  const fpsMatch = output.match(/(\d+(?:\.\d+)?)\s*fps/);
  if (fpsMatch) {
    metadata.frameRate = parseFloat(fpsMatch[1]);
  }

  const audioStreamMatch = output.match(/Stream #\d+:\d+.*Audio: (\w+)/);
  if (audioStreamMatch) {
    metadata.audioCodec = audioStreamMatch[1];
  }

  const bitrateMatch = output.match(/bitrate: (\d+)\s*kb\/s/);
  if (bitrateMatch) {
    metadata.bitrate = parseInt(bitrateMatch[1], 10);
  }

  return metadata;
}

export async function extractThumbnail(
  ffmpeg: FFmpeg,
  inputFileName: string,
  outputFileName: string,
  timestamp: number = 1
): Promise<Uint8Array> {
  await ffmpeg.exec([
    '-ss',
    timestamp.toString(),
    '-i',
    inputFileName,
    '-vframes',
    '1',
    '-q:v',
    '2',
    outputFileName
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
}
