export type ImageFormat =
  | 'png'
  | 'jpeg'
  | 'jpg'
  | 'webp'
  | 'gif'
  | 'svg'
  | 'tiff'
  | 'ico'
  | 'bmp';

export interface ConversionInput {
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}

export interface ConversionOutput {
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}

export interface ConversionProgress {
  percent: number;
  stage?: string;
  message?: string;
}

export interface ConversionContext {
  signal: AbortSignal;
  emitProgress: (progress: ConversionProgress) => void;
}

export interface ImageTransformOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  backgroundColor?: string;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
  };
}

export interface ImageConvertOptions extends ImageTransformOptions {
  outputFormat: ImageFormat;
  quality?: number;
}

export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'mkv' | 'avi' | 'flv';
export type VideoCodec = 'h264' | 'vp8' | 'vp9';
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'vorbis';
export type ScaleMode = 'fit' | 'fill' | 'stretch';

export interface VideoConvertOptions {
  outputFormat: VideoFormat;
  codec?: VideoCodec;
  bitrate?: number;
  resolution?: {
    width?: number;
    height?: number;
  };
  frameRate?: number;
  trim?: {
    start?: number;
    end?: number;
  };
  scaleMode?: ScaleMode;
  audioTrack?: number;
  subtitleTrack?: number;
  burnSubtitles?: boolean;
}

export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number;
  frameRate?: number;
  size?: number;
}

export type AudioFormat = 'mp3' | 'aac' | 'ogg' | 'wav' | 'flac';

export interface AudioConvertOptions {
  outputFormat: AudioFormat;
  codec?: AudioCodec;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  trim?: {
    start?: number;
    end?: number;
  };
}
