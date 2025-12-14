import { describe, expect, it } from 'vitest';

import { audioFormatToMimeType, mimeTypeToAudioFormat } from '../../lib/adapters/audio-converter';

describe('audio-converter adapter', () => {
  describe('MIME type conversion', () => {
    it('converts audio format to MIME type', () => {
      expect(audioFormatToMimeType('mp3')).toBe('audio/mpeg');
      expect(audioFormatToMimeType('aac')).toBe('audio/aac');
      expect(audioFormatToMimeType('ogg')).toBe('audio/ogg');
      expect(audioFormatToMimeType('wav')).toBe('audio/wav');
      expect(audioFormatToMimeType('flac')).toBe('audio/flac');
    });

    it('converts MIME type to audio format', () => {
      expect(mimeTypeToAudioFormat('audio/mpeg')).toBe('mp3');
      expect(mimeTypeToAudioFormat('audio/mp3')).toBe('mp3');
      expect(mimeTypeToAudioFormat('audio/aac')).toBe('aac');
      expect(mimeTypeToAudioFormat('audio/ogg')).toBe('ogg');
      expect(mimeTypeToAudioFormat('audio/wav')).toBe('wav');
      expect(mimeTypeToAudioFormat('audio/flac')).toBe('flac');
    });

    it('returns null for unsupported MIME types', () => {
      expect(mimeTypeToAudioFormat('audio/unknown')).toBeNull();
      expect(mimeTypeToAudioFormat('video/mp4')).toBeNull();
    });
  });

  describe('output filename generation', () => {
    it('replaces extension', () => {
      const result = buildOutputFileNameForTest('audio.wav', 'mp3');
      expect(result).toBe('audio.mp3');
    });

    it('adds extension when missing', () => {
      const result = buildOutputFileNameForTest('audio', 'aac');
      expect(result).toBe('audio.aac');
    });

    it('handles multiple dots in filename', () => {
      const result = buildOutputFileNameForTest('my.audio.file.flac', 'mp3');
      expect(result).toBe('my.audio.file.mp3');
    });
  });
});

function buildOutputFileNameForTest(inputFileName: string, outputFormat: string): string {
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${outputFormat}`;
}
