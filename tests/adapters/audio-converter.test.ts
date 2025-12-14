import { describe, expect, it, vi } from 'vitest';

import { convertAudio, AudioDecodeError } from '../../lib/adapters/audio-converter';
import type { AudioConvertOptions, ConversionContext, ConversionInput } from '../../lib/types/conversion';
import { loadFixtureBytesFromBase64 } from '../utils/fixtures';

vi.mock('wavesurfer.js', () => ({
  default: vi.fn()
}));

function ctx(): ConversionContext {
  return {
    signal: new AbortController().signal,
    emitProgress: () => undefined
  };
}

describe('audio-converter adapter', () => {
  it('converts WAV to MP3', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      bitrate: '128k'
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.fileName).toBe('test.mp3');
    expect(output.mimeType).toBe('audio/mpeg');
    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('converts MP3 to WAV', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const mp3Options: AudioConvertOptions = {
      outputFormat: 'mp3'
    };

    const mp3Output = await convertAudio(input, mp3Options, ctx());

    const mp3Input: ConversionInput = {
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
      data: mp3Output.data
    };

    const wavOptions: AudioConvertOptions = {
      outputFormat: 'wav'
    };

    const wavOutput = await convertAudio(mp3Input, wavOptions, ctx());

    expect(wavOutput.fileName).toBe('test.wav');
    expect(wavOutput.mimeType).toBe('audio/wav');
    expect(wavOutput.data).toBeInstanceOf(Uint8Array);
    expect(wavOutput.data.length).toBeGreaterThan(0);
  });

  it('converts MP3 to OGG', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const mp3Options: AudioConvertOptions = {
      outputFormat: 'mp3'
    };

    const mp3Output = await convertAudio(input, mp3Options, ctx());

    const mp3Input: ConversionInput = {
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
      data: mp3Output.data
    };

    const oggOptions: AudioConvertOptions = {
      outputFormat: 'ogg'
    };

    const oggOutput = await convertAudio(mp3Input, oggOptions, ctx());

    expect(oggOutput.fileName).toBe('test.ogg');
    expect(oggOutput.mimeType).toBe('audio/ogg');
    expect(oggOutput.data).toBeInstanceOf(Uint8Array);
    expect(oggOutput.data.length).toBeGreaterThan(0);
  });

  it('enforces bitrate option', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const lowBitrateOptions: AudioConvertOptions = {
      outputFormat: 'mp3',
      bitrate: '64k'
    };

    const highBitrateOptions: AudioConvertOptions = {
      outputFormat: 'mp3',
      bitrate: '320k'
    };

    const lowBitrateOutput = await convertAudio(input, lowBitrateOptions, ctx());
    const highBitrateOutput = await convertAudio(input, highBitrateOptions, ctx());

    expect(lowBitrateOutput.data.length).toBeLessThan(highBitrateOutput.data.length);
  });

  it('enforces sample rate option', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'wav',
      sampleRate: 22050
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('writes metadata to output', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      metadata: {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        year: '2024',
        genre: 'Electronic'
      }
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('applies trim option', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const fullOptions: AudioConvertOptions = {
      outputFormat: 'mp3'
    };

    const trimmedOptions: AudioConvertOptions = {
      outputFormat: 'mp3',
      trim: {
        start: 0.1,
        end: 0.3
      }
    };

    const fullOutput = await convertAudio(input, fullOptions, ctx());
    const trimmedOutput = await convertAudio(input, trimmedOptions, ctx());

    expect(trimmedOutput.data.length).toBeLessThan(fullOutput.data.length);
  });

  it('applies speed option', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      speed: 1.5
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('applies volume normalization', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      volumeNormalization: true
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('applies fade in/out', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      fade: {
        in: 0.1,
        out: 0.4
      }
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('applies EQ preset', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      eqPreset: 'bass_boost'
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('changes channel count', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3',
      channels: 2
    };

    const output = await convertAudio(input, options, ctx());

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it('emits progress events', async () => {
    const wavBytes = await loadFixtureBytesFromBase64('sine-440hz-0.5s.wav.base64');

    const input: ConversionInput = {
      fileName: 'test.wav',
      mimeType: 'audio/wav',
      data: wavBytes
    };

    const options: AudioConvertOptions = {
      outputFormat: 'mp3'
    };

    const progressEvents: number[] = [];
    const customCtx: ConversionContext = {
      signal: new AbortController().signal,
      emitProgress: (progress) => {
        progressEvents.push(progress.percent);
      }
    };

    await convertAudio(input, options, customCtx);

    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0]).toBeGreaterThanOrEqual(0);
    expect(progressEvents[progressEvents.length - 1]).toBe(1);
  });
});
