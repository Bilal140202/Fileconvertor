# Audio Converter Usage Guide

## Overview

The audio converter adapter provides client-side audio conversion using FFmpeg.wasm. It supports multiple audio formats with control over encoding parameters.

## Supported Formats

### Audio Formats
- MP3 (audio/mpeg)
- AAC (audio/aac)
- OGG (audio/ogg)
- WAV (audio/wav)
- FLAC (audio/flac)

## Audio Codecs

- **AAC** (`aac`) - Modern, efficient codec
- **MP3** (`mp3`) - Most compatible
- **Opus** (`opus`) - Best quality/size ratio
- **Vorbis** (`vorbis`) - Open source codec for OGG

## Basic Usage

```typescript
import { convertAudio } from './lib/adapters/audio-converter';

const input = {
  fileName: 'input.wav',
  mimeType: 'audio/wav',
  data: audioBytes // Uint8Array
};

const options = {
  outputFormat: 'mp3'
};

const context = {
  signal: new AbortController().signal,
  emitProgress: (progress) => {
    console.log(`Progress: ${progress.percent * 100}%`);
  }
};

const output = await convertAudio(input, options, context);
// output.data contains the converted audio
```

## Advanced Options

### Codec and Bitrate

```typescript
const options = {
  outputFormat: 'mp3',
  codec: 'mp3',
  bitrate: 192 // kb/s
};
```

Common bitrates:
- Low quality: 64-96 kb/s
- Medium quality: 128-160 kb/s
- High quality: 192-320 kb/s

### Sample Rate

```typescript
const options = {
  outputFormat: 'mp3',
  sampleRate: 44100 // Hz
};
```

Common sample rates:
- 8000 Hz - Phone quality
- 16000 Hz - Voice recording
- 22050 Hz - Low quality music
- 44100 Hz - CD quality
- 48000 Hz - Professional audio

### Channels

```typescript
const options = {
  outputFormat: 'mp3',
  channels: 2 // 1 = mono, 2 = stereo
};
```

### Trim Audio

```typescript
const options = {
  outputFormat: 'mp3',
  trim: {
    start: 10,  // seconds
    end: 30     // seconds
  }
};
```

## Example: Complete Audio Conversion

```typescript
import { convertAudio } from './lib/adapters/audio-converter';

async function convertToMP3(audioFile: File) {
  const audioBytes = new Uint8Array(await audioFile.arrayBuffer());

  const output = await convertAudio(
    {
      fileName: audioFile.name,
      mimeType: audioFile.type,
      data: audioBytes
    },
    {
      outputFormat: 'mp3',
      bitrate: 192,
      sampleRate: 44100,
      channels: 2
    },
    {
      signal: new AbortController().signal,
      emitProgress: (progress) => {
        console.log(`Converting: ${Math.round(progress.percent * 100)}%`);
      }
    }
  );

  return output;
}
```

## Extract Audio from Video

```typescript
import { convertAudio } from './lib/adapters/audio-converter';

// Input can be a video file
const input = {
  fileName: 'video.mp4',
  mimeType: 'video/mp4',
  data: videoBytes
};

const options = {
  outputFormat: 'mp3',
  bitrate: 192
};

const audioOutput = await convertAudio(input, options, context);
// videoBytes now contains just the audio track as MP3
```
