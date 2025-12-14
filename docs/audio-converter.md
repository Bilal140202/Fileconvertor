# Audio Converter - Phase 2D

## Overview

The audio converter adapter provides comprehensive audio file conversion capabilities using FFmpeg.wasm, supporting multiple formats and audio processing options.

## Supported Formats

- **MP3** (MPEG Audio Layer III)
- **WAV** (Waveform Audio File Format)
- **OGG** (Ogg Vorbis)
- **AAC** (Advanced Audio Coding)
- **FLAC** (Free Lossless Audio Codec)
- **WMA** (Windows Media Audio) - with DRM detection
- **OPUS** (Opus Interactive Audio Codec)

## Features

### 1. Audio Conversion Options

- **Codec Selection**: Choose specific audio codec for encoding
- **Bitrate Control**: Set audio bitrate (64k, 128k, 192k, 256k, 320k)
- **Sample Rate**: Adjust sample rate (8000, 16000, 22050, 44100, 48000, 96000 Hz)
- **Channel Configuration**: Convert between mono and stereo

### 2. Audio Processing

- **Trim**: Cut audio from start to end time (in seconds)
- **Speed Adjustment**: Time-stretch audio (0.5x to 2x)
- **Volume Normalization**: Apply loudness normalization
- **Fade Effects**: Add fade-in and fade-out effects
- **EQ Presets**: Apply equalizer presets
  - Bass Boost
  - Treble Boost
  - Vocal Enhancement
  - Flat (no EQ)

### 3. Metadata Editing

Support for ID3 tag editing via FFmpeg metadata flags:
- Title
- Artist
- Album
- Year
- Genre
- Comment

### 4. Waveform Visualization

The `AudioPreview` component provides:
- Interactive waveform display using WaveSurfer.js
- Play/pause controls
- Duration and current time display
- A/B trim markers for visual trim verification
- Metadata display (codec, bitrate, artist, etc.)

### 5. Queue & Progress

- Real-time progress tracking via FFmpeg progress events
- Automatic retry mechanism for decode errors (up to 2 retries)
- Descriptive error messages for common issues:
  - DRM-protected WMA files
  - Unsupported codec errors
  - Decode failures
- Batch processing support with ZIP download
- Job cancellation support

## Architecture

### Components

1. **lib/adapters/audio-converter.ts**: Main conversion adapter
2. **lib/utils/ffmpeg.ts**: Shared FFmpeg helper with progress tracking
3. **components/converter/AudioPreview.tsx**: Waveform preview component
4. **components/converter/AudioOptionsPanel.tsx**: Options UI panel
5. **lib/adapters/registry.ts**: Adapter registration system

### Error Handling

- `UnsupportedAudioFormatError`: Thrown for unsupported formats
- `AudioDecodeError`: Thrown for decode failures (triggers retry logic)
- Automatic retry for transient decode errors
- User-friendly error messages in toast notifications

## Usage Example

```typescript
import { convertAudio } from './lib/adapters/audio-converter';

const input: ConversionInput = {
  fileName: 'song.mp3',
  mimeType: 'audio/mpeg',
  data: new Uint8Array(audioBuffer)
};

const options: AudioConvertOptions = {
  outputFormat: 'wav',
  bitrate: '320k',
  sampleRate: 48000,
  channels: 2,
  trim: { start: 10, end: 30 },
  speed: 1.2,
  volumeNormalization: true,
  fade: { in: 1, out: 2 },
  eqPreset: 'bass_boost',
  metadata: {
    title: 'My Song',
    artist: 'Artist Name',
    album: 'Album Name'
  }
};

const context: ConversionContext = {
  signal: abortController.signal,
  emitProgress: (progress) => console.log(progress)
};

const output = await convertAudio(input, options, context);
```

## Testing

Comprehensive test suite in `tests/adapters/audio-converter.test.ts` covering:
- Format conversions (MP3↔WAV, MP3↔OGG)
- Bitrate enforcement
- Sample rate adjustment
- Metadata writing
- Trim functionality
- Speed adjustment
- Volume normalization
- Fade effects
- EQ presets
- Channel count changes
- Progress event emission

Test fixtures use generated sine wave audio for deterministic results.

## Integration Points

1. **Worker**: Audio conversion runs in a Web Worker for non-blocking UI
2. **Queue**: Integrates with `useConversionQueue` for batch processing
3. **Registry**: Registered as `audio-converter` in the adapter registry
4. **Types**: Full TypeScript support with type-safe options

## Performance Considerations

- FFmpeg.wasm loads once and is reused for all conversions
- Large audio files are processed incrementally with progress updates
- Web Worker prevents UI blocking during conversion
- Waveform rendering is optimized for smooth playback
