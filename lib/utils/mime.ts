import type { AudioFormat, ImageFormat } from '../types/conversion';

const formatToMime: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  ico: 'image/x-icon',
  bmp: 'image/bmp'
};

const audioFormatToMime: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  wma: 'audio/x-ms-wma',
  opus: 'audio/opus'
};

export function imageFormatToMimeType(format: ImageFormat): string {
  return formatToMime[format];
}

export function audioFormatToMimeType(format: AudioFormat): string {
  return audioFormatToMime[format];
}

export function normalizeImageFormat(format: string): ImageFormat {
  const f = format.toLowerCase();
  if (f === 'jpg') return 'jpeg';
  if (
    f === 'png' ||
    f === 'jpeg' ||
    f === 'webp' ||
    f === 'gif' ||
    f === 'svg' ||
    f === 'tiff' ||
    f === 'ico' ||
    f === 'bmp'
  ) {
    return f;
  }
  throw new Error(`Unsupported image format: ${format}`);
}

export function mimeTypeToImageFormat(mimeType: string): ImageFormat {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();

  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpeg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'image/tiff':
      return 'tiff';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return 'ico';
    case 'image/bmp':
      return 'bmp';
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

export function isSupportedImageMimeType(mimeType: string): boolean {
  try {
    mimeTypeToImageFormat(mimeType);
    return true;
  } catch {
    return false;
  }
}

export function normalizeAudioFormat(format: string): AudioFormat {
  const f = format.toLowerCase();
  if (
    f === 'mp3' ||
    f === 'wav' ||
    f === 'ogg' ||
    f === 'aac' ||
    f === 'flac' ||
    f === 'wma' ||
    f === 'opus'
  ) {
    return f as AudioFormat;
  }
  throw new Error(`Unsupported audio format: ${format}`);
}

export function mimeTypeToAudioFormat(mimeType: string): AudioFormat {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();

  switch (mime) {
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/ogg':
    case 'application/ogg':
      return 'ogg';
    case 'audio/aac':
    case 'audio/x-aac':
      return 'aac';
    case 'audio/flac':
    case 'audio/x-flac':
      return 'flac';
    case 'audio/x-ms-wma':
      return 'wma';
    case 'audio/opus':
      return 'opus';
    default:
      throw new Error(`Unsupported audio MIME type: ${mimeType}`);
  }
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
  try {
    mimeTypeToAudioFormat(mimeType);
    return true;
  } catch {
    return false;
  }
}
