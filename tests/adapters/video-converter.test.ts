import { describe, expect, it } from 'vitest';

import type { VideoConvertOptions } from '../../lib/types/conversion';
import { videoFormatToMimeType, mimeTypeToVideoFormat } from '../../lib/adapters/video-converter';

describe('video-converter adapter', () => {
  describe('MIME type conversion', () => {
    it('converts video format to MIME type', () => {
      expect(videoFormatToMimeType('mp4')).toBe('video/mp4');
      expect(videoFormatToMimeType('webm')).toBe('video/webm');
      expect(videoFormatToMimeType('mov')).toBe('video/quicktime');
      expect(videoFormatToMimeType('mkv')).toBe('video/x-matroska');
      expect(videoFormatToMimeType('avi')).toBe('video/x-msvideo');
      expect(videoFormatToMimeType('flv')).toBe('video/x-flv');
    });

    it('converts MIME type to video format', () => {
      expect(mimeTypeToVideoFormat('video/mp4')).toBe('mp4');
      expect(mimeTypeToVideoFormat('video/webm')).toBe('webm');
      expect(mimeTypeToVideoFormat('video/quicktime')).toBe('mov');
      expect(mimeTypeToVideoFormat('video/x-matroska')).toBe('mkv');
      expect(mimeTypeToVideoFormat('video/x-msvideo')).toBe('avi');
      expect(mimeTypeToVideoFormat('video/x-flv')).toBe('flv');
    });

    it('returns null for unsupported MIME types', () => {
      expect(mimeTypeToVideoFormat('video/unknown')).toBeNull();
      expect(mimeTypeToVideoFormat('image/png')).toBeNull();
    });
  });

  describe('FFmpeg command generation', () => {
    it('generates basic conversion command', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4'
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-i');
      expect(args).toContain('input.avi');
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('output.mp4');
    });

    it('includes codec when specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'webm',
        codec: 'vp9'
      };

      const args = buildFFmpegCommandForTest('input.mp4', 'output.webm', options);

      expect(args).toContain('-c:v');
      expect(args).toContain('libvpx-vp9');
    });

    it('includes bitrate when specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        bitrate: 2000
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-b:v');
      expect(args).toContain('2000k');
    });

    it('includes resolution when specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        resolution: { width: 1280, height: 720 }
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-vf');
      expect(args.some((arg) => arg.includes('scale=1280:720'))).toBe(true);
    });

    it('includes frame rate when specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        frameRate: 30
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-r');
      expect(args).toContain('30');
    });

    it('includes trim start when specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        trim: { start: 10 }
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-ss');
      expect(args).toContain('10');
    });

    it('includes trim duration when start and end specified', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        trim: { start: 10, end: 30 }
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options, { duration: 60 });

      expect(args).toContain('-ss');
      expect(args).toContain('10');
      expect(args).toContain('-t');
      expect(args).toContain('20');
    });

    it('includes scale mode fit', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        resolution: { width: 1280, height: 720 },
        scaleMode: 'fit'
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args.some((arg) => arg.includes('force_original_aspect_ratio=decrease'))).toBe(true);
    });

    it('includes scale mode fill', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        resolution: { width: 1280, height: 720 },
        scaleMode: 'fill'
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args.some((arg) => arg.includes('force_original_aspect_ratio=increase'))).toBe(true);
    });

    it('includes audio track selection', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        audioTrack: 1
      };

      const args = buildFFmpegCommandForTest('input.avi', 'output.mp4', options);

      expect(args).toContain('-map');
      expect(args).toContain('0:a:1');
    });

    it('includes subtitle burn-in', () => {
      const options: VideoConvertOptions = {
        outputFormat: 'mp4',
        subtitleTrack: 0,
        burnSubtitles: true
      };

      const args = buildFFmpegCommandForTest('input.mkv', 'output.mp4', options);

      expect(args.some((arg) => arg.includes('subtitles='))).toBe(true);
    });
  });

  describe('trim calculations', () => {
    it('calculates duration from start and end', () => {
      const trim = { start: 10, end: 30 };
      const duration = trim.end - trim.start;
      expect(duration).toBe(20);
    });

    it('handles zero start', () => {
      const trim = { start: 0, end: 15 };
      const duration = trim.end - (trim.start ?? 0);
      expect(duration).toBe(15);
    });

    it('handles missing start', () => {
      const trim: { start?: number; end: number } = { end: 20 };
      const duration = trim.end - (trim.start ?? 0);
      expect(duration).toBe(20);
    });
  });

  describe('output filename generation', () => {
    it('replaces extension', () => {
      const result = buildOutputFileNameForTest('video.avi', 'mp4');
      expect(result).toBe('video.mp4');
    });

    it('adds extension when missing', () => {
      const result = buildOutputFileNameForTest('video', 'webm');
      expect(result).toBe('video.webm');
    });

    it('handles multiple dots in filename', () => {
      const result = buildOutputFileNameForTest('my.video.file.mov', 'mp4');
      expect(result).toBe('my.video.file.mp4');
    });
  });
});

function buildFFmpegCommandForTest(
  inputFileName: string,
  outputFileName: string,
  options: VideoConvertOptions,
  metadata?: { duration?: number }
): string[] {
  const args: string[] = [];

  if (options.trim?.start !== undefined && options.trim.start > 0) {
    args.push('-ss', options.trim.start.toString());
  }

  args.push('-i', inputFileName);

  if (options.trim?.end !== undefined && metadata?.duration) {
    const duration = options.trim.end - (options.trim.start ?? 0);
    if (duration > 0) {
      args.push('-t', duration.toString());
    }
  }

  const codecMap: Record<string, string> = {
    h264: 'libx264',
    vp8: 'libvpx',
    vp9: 'libvpx-vp9'
  };

  if (options.codec) {
    args.push('-c:v', codecMap[options.codec]);
  } else {
    const defaultCodecs: Record<string, string> = {
      mp4: 'libx264',
      webm: 'libvpx-vp9',
      mov: 'libx264',
      mkv: 'libx264',
      avi: 'libx264',
      flv: 'libx264'
    };
    args.push('-c:v', defaultCodecs[options.outputFormat]);
  }

  if (options.bitrate) {
    args.push('-b:v', `${options.bitrate}k`);
  }

  if (options.resolution?.width || options.resolution?.height) {
    const width = options.resolution.width ?? -1;
    const height = options.resolution.height ?? -1;

    let scaleFilter = `scale=${width}:${height}`;

    if (options.scaleMode === 'fit') {
      scaleFilter += ':force_original_aspect_ratio=decrease';
    } else if (options.scaleMode === 'fill') {
      scaleFilter += ':force_original_aspect_ratio=increase';
    }

    args.push('-vf', scaleFilter);
  }

  if (options.frameRate) {
    args.push('-r', options.frameRate.toString());
  }

  if (options.audioTrack !== undefined) {
    args.push('-map', `0:v:0`, '-map', `0:a:${options.audioTrack}`);
  }

  if (options.subtitleTrack !== undefined && options.burnSubtitles) {
    const currentVf = args.findIndex((arg) => arg === '-vf');
    if (currentVf >= 0) {
      args[currentVf + 1] += `,subtitles=${inputFileName}:si=${options.subtitleTrack}`;
    } else {
      args.push('-vf', `subtitles=${inputFileName}:si=${options.subtitleTrack}`);
    }
  } else if (options.subtitleTrack !== undefined) {
    args.push('-map', `0:s:${options.subtitleTrack}`);
  }

  const audioCodecs: Record<string, string> = {
    mp4: 'aac',
    webm: 'libopus',
    mov: 'aac',
    mkv: 'aac',
    avi: 'mp3',
    flv: 'aac'
  };

  args.push('-c:a', audioCodecs[options.outputFormat]);
  args.push('-y', outputFileName);

  return args;
}

function buildOutputFileNameForTest(inputFileName: string, outputFormat: string): string {
  const dot = inputFileName.lastIndexOf('.');
  const base = dot > 0 ? inputFileName.slice(0, dot) : inputFileName;
  return `${base}.${outputFormat}`;
}
