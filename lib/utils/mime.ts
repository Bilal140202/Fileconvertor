import type { ImageFormat } from '../types/conversion';

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

export function imageFormatToMimeType(format: ImageFormat): string {
  return formatToMime[format];
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

export function isSupportedVideoMimeType(mimeType: string): boolean {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();
  return mime.startsWith('video/');
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();
  return mime.startsWith('audio/');
}

export function getMediaType(mimeType: string): 'image' | 'video' | 'audio' | null {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return null;
}
