import type { ConversionAdapter } from '../types/adapters';
import { audioConverterAdapter } from './audio-converter';
import { imageConverterAdapter } from './image-converter';

type AdapterId = 'image-converter' | 'audio-converter';

const adapters: Record<AdapterId, ConversionAdapter<any>> = {
  'image-converter': imageConverterAdapter,
  'audio-converter': audioConverterAdapter
};

export function getAdapter(id: AdapterId): ConversionAdapter<any> {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown adapter: ${id}`);
  }
  return adapter;
}

export function registerAdapter(id: AdapterId, adapter: ConversionAdapter<any>): void {
  adapters[id] = adapter;
}
