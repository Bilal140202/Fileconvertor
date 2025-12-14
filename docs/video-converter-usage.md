# Video Converter Usage Guide

## Overview

The video converter adapter provides client-side video conversion using FFmpeg.wasm. It supports multiple input and output formats with rich control over encoding parameters.

## Supported Formats

### Input Formats
- MP4 (video/mp4)
- WebM (video/webm)
- MOV (video/quicktime)
- MKV (video/x-matroska)
- AVI (video/x-msvideo)
- FLV (video/x-flv)

### Output Formats
Same as input formats

## Video Codecs

- **H.264** (`h264`) - Most compatible, good for MP4/MOV
- **VP8** (`vp8`) - Older WebM codec
- **VP9** (`vp9`) - Modern WebM codec, better compression

## Basic Usage

```typescript
import { convertVideo } from './lib/adapters/video-converter';

const input = {
  fileName: 'input.mp4',
  mimeType: 'video/mp4',
  data: videoBytes // Uint8Array
};

const options = {
  outputFormat: 'webm'
};

const context = {
  signal: new AbortController().signal,
  emitProgress: (progress) => {
    console.log(`Progress: ${progress.percent * 100}%`);
  }
};

const output = await convertVideo(input, options, context);
// output.data contains the converted video
```

## Advanced Options

### Resolution Presets

```typescript
const options = {
  outputFormat: 'mp4',
  resolution: {
    width: 1920,
    height: 1080
  },
  scaleMode: 'fit' // 'fit' | 'fill' | 'stretch'
};
```

Common presets:
- 480p: 854×480
- 720p: 1280×720
- 1080p: 1920×1080
- 1440p: 2560×1440
- 4K: 3840×2160

### Codec and Bitrate

```typescript
const options = {
  outputFormat: 'mp4',
  codec: 'h264',
  bitrate: 2000 // kb/s
};
```

### Trim Video

```typescript
const options = {
  outputFormat: 'mp4',
  trim: {
    start: 10,  // seconds
    end: 30     // seconds
  }
};
```

### Frame Rate

```typescript
const options = {
  outputFormat: 'mp4',
  frameRate: 30 // fps
};
```

### Audio Track Selection

```typescript
const options = {
  outputFormat: 'mp4',
  audioTrack: 1 // Select second audio track (0-indexed)
};
```

### Subtitle Burn-in

```typescript
const options = {
  outputFormat: 'mp4',
  subtitleTrack: 0,
  burnSubtitles: true // Burn subtitles into video
};
```

## Progress Tracking

The converter provides detailed progress updates:

```typescript
const context = {
  signal: abortController.signal,
  emitProgress: (progress) => {
    console.log(`Stage: ${progress.stage}`);
    console.log(`Message: ${progress.message}`);
    console.log(`Percent: ${Math.round(progress.percent * 100)}%`);
  }
};
```

Progress stages:
- `load` - Loading FFmpeg
- `setup` - Preparing video
- `analyze` - Analyzing video
- `convert` - Converting video
- `finalize` - Finalizing output
- `complete` - Complete

## Cancellation

```typescript
const abortController = new AbortController();

// Start conversion
const promise = convertVideo(input, options, {
  signal: abortController.signal,
  emitProgress: () => {}
});

// Cancel conversion
abortController.abort();
```

## Video Metadata Extraction

```typescript
import { loadFFmpeg, extractVideoMetadata } from './lib/utils/ffmpeg';

const ffmpeg = await loadFFmpeg();
await ffmpeg.writeFile('input.mp4', videoBytes);

const metadata = await extractVideoMetadata(ffmpeg, 'input.mp4');
// {
//   duration: 120.5,
//   width: 1920,
//   height: 1080,
//   videoCodec: 'h264',
//   audioCodec: 'aac',
//   bitrate: 2500,
//   frameRate: 30
// }
```

## Thumbnail Extraction

```typescript
import { loadFFmpeg, extractThumbnail } from './lib/utils/ffmpeg';

const ffmpeg = await loadFFmpeg();
await ffmpeg.writeFile('input.mp4', videoBytes);

const thumbnailBytes = await extractThumbnail(
  ffmpeg,
  'input.mp4',
  'thumbnail.jpg',
  5 // timestamp in seconds
);
```

## UI Components

### VideoOptionsPanel

```tsx
import { VideoOptionsPanel } from './components/converter/VideoOptionsPanel';

function MyComponent() {
  const [options, setOptions] = useState({
    outputFormat: 'mp4'
  });

  return <VideoOptionsPanel options={options} onChange={setOptions} />;
}
```

### VideoPreview

```tsx
import { VideoPreview } from './components/converter/VideoPreview';

function MyComponent({ video, metadata, thumbnail }) {
  return (
    <VideoPreview
      video={video}
      metadata={metadata}
      thumbnail={thumbnail}
    />
  );
}
```

## Error Handling

```typescript
try {
  const output = await convertVideo(input, options, context);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Conversion was cancelled');
  } else if (error.name === 'UnsupportedVideoFormatError') {
    console.log('Unsupported format:', error.format);
  } else {
    console.error('Conversion failed:', error.message);
  }
}
```

## Performance Tips

1. **Resolution**: Lower resolution = faster conversion
2. **Bitrate**: Lower bitrate = faster encoding
3. **Codec**: H.264 is generally faster than VP9
4. **Trim**: Convert only needed portions of video
5. **Frame Rate**: Lower frame rate = faster processing

## Example: Complete Workflow

```typescript
import { convertVideo } from './lib/adapters/video-converter';
import { loadFFmpeg, extractVideoMetadata, extractThumbnail } from './lib/utils/ffmpeg';

async function convertWithPreview(videoFile: File) {
  // Read file
  const videoBytes = new Uint8Array(await videoFile.arrayBuffer());

  // Extract metadata
  const ffmpeg = await loadFFmpeg();
  await ffmpeg.writeFile('temp.mp4', videoBytes);
  const metadata = await extractVideoMetadata(ffmpeg, 'temp.mp4');

  // Extract thumbnail
  const thumbnail = await extractThumbnail(ffmpeg, 'temp.mp4', 'thumb.jpg', 1);

  // Convert video
  const abortController = new AbortController();
  const output = await convertVideo(
    {
      fileName: videoFile.name,
      mimeType: videoFile.type,
      data: videoBytes
    },
    {
      outputFormat: 'webm',
      codec: 'vp9',
      bitrate: 2000,
      resolution: { width: 1280, height: 720 },
      scaleMode: 'fit'
    },
    {
      signal: abortController.signal,
      emitProgress: (progress) => {
        console.log(`${Math.round(progress.percent * 100)}%: ${progress.message}`);
      }
    }
  );

  return {
    output,
    metadata,
    thumbnail
  };
}
```
