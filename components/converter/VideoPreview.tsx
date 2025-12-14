import { useEffect, useState } from 'react';
import type { ConversionOutput } from '../../lib/types/conversion';

export interface VideoPreviewProps {
  video?: ConversionOutput;
  thumbnail?: Uint8Array;
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    videoCodec?: string;
    audioCodec?: string;
    bitrate?: number;
    frameRate?: number;
    size?: number;
  };
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoPreview({ video, thumbnail, metadata }: VideoPreviewProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (video) {
      const blob = new Blob([video.data as BlobPart], { type: video.mimeType });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setVideoUrl(null);
      };
    }
  }, [video]);

  useEffect(() => {
    if (thumbnail) {
      const blob = new Blob([thumbnail as BlobPart], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setThumbnailUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setThumbnailUrl(null);
      };
    }
  }, [thumbnail]);

  if (!video && !thumbnail && !metadata) {
    return null;
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 4 }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Video Preview</h3>

      {thumbnailUrl && (
        <div style={{ marginBottom: 12 }}>
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
          />
        </div>
      )}

      {videoUrl && (
        <div style={{ marginBottom: 12 }}>
          <video
            src={videoUrl}
            controls
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
          />
        </div>
      )}

      {metadata && (
        <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
            {metadata.duration !== undefined && (
              <>
                <span style={{ fontWeight: 'bold' }}>Duration:</span>
                <span>{formatDuration(metadata.duration)}</span>
              </>
            )}

            {metadata.width !== undefined && metadata.height !== undefined && (
              <>
                <span style={{ fontWeight: 'bold' }}>Resolution:</span>
                <span>
                  {metadata.width}×{metadata.height}
                </span>
              </>
            )}

            {metadata.videoCodec && (
              <>
                <span style={{ fontWeight: 'bold' }}>Video Codec:</span>
                <span>{metadata.videoCodec}</span>
              </>
            )}

            {metadata.audioCodec && (
              <>
                <span style={{ fontWeight: 'bold' }}>Audio Codec:</span>
                <span>{metadata.audioCodec}</span>
              </>
            )}

            {metadata.bitrate !== undefined && (
              <>
                <span style={{ fontWeight: 'bold' }}>Bitrate:</span>
                <span>{metadata.bitrate} kb/s</span>
              </>
            )}

            {metadata.frameRate !== undefined && (
              <>
                <span style={{ fontWeight: 'bold' }}>Frame Rate:</span>
                <span>{metadata.frameRate} fps</span>
              </>
            )}

            {metadata.size !== undefined && (
              <>
                <span style={{ fontWeight: 'bold' }}>Size:</span>
                <span>{formatSize(metadata.size)}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
