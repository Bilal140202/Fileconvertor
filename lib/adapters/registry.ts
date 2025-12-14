import type { ConversionAdapter } from '../types/adapters';
import { imageConverterAdapter } from './image-converter';
import { videoConverterAdapter } from './video-converter';
import { audioConverterAdapter } from './audio-converter';

export type AdapterType = 'image' | 'video' | 'audio';

export const adapterRegistry = {
  image: imageConverterAdapter,
  video: videoConverterAdapter,
  audio: audioConverterAdapter
} as const;

export function getAdapter<T>(type: AdapterType): ConversionAdapter<T> {
  const adapter = adapterRegistry[type];
  if (!adapter) {
    throw new Error(`Unknown adapter type: ${type}`);
  }
  return adapter as ConversionAdapter<T>;
}

export function detectAdapterType(mimeType: string): AdapterType | null {
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/')) {
    return 'image';
  }

  if (mime.startsWith('video/')) {
    return 'video';
  }

  if (mime.startsWith('audio/')) {
    return 'audio';
  }

  return null;
}
