import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export interface AudioPreviewProps {
  title: string;
  fileName: string;
  mimeType: string;
  data: Uint8Array;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    duration?: string;
    codec?: string;
    bitrate?: string;
  };
  onTrimChange?: (start: number, end: number) => void;
}

export function AudioPreview({
  title,
  fileName,
  mimeType,
  data,
  metadata,
  onTrimChange
}: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);

  const blob = useMemo(() => new Blob([data], { type: mimeType }), [data, mimeType]);
  const blobURL = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4a9eff',
      progressColor: '#1e40af',
      cursorColor: '#1e40af',
      height: 80,
      normalize: true,
      backend: 'WebAudio'
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      setTrimEnd(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('error', (err) => {
      setError(err instanceof Error ? err.message : String(err));
    });

    wavesurfer.load(blobURL);

    return () => {
      wavesurfer.destroy();
      URL.revokeObjectURL(blobURL);
    };
  }, [blobURL]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrimStartChange = (value: number) => {
    setTrimStart(value);
    if (onTrimChange && trimEnd !== null) {
      onTrimChange(value, trimEnd);
    }
  };

  const handleTrimEndChange = (value: number) => {
    setTrimEnd(value);
    if (onTrimChange) {
      onTrimChange(trimStart, value);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 'bold' }}>{fileName}</div>

      {error ? (
        <div style={{ color: 'red', fontSize: 12 }}>{error}</div>
      ) : (
        <>
          <div ref={containerRef} style={{ width: '100%' }} />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handlePlayPause} style={{ padding: '8px 16px' }}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <span style={{ fontSize: 12 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {onTrimChange && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 12 }}>
                Trim Start: {formatTime(trimStart)}
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimStart}
                  onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Trim End: {formatTime(trimEnd ?? duration)}
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimEnd ?? duration}
                  onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          )}

          {metadata && (
            <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px' }}>
              {metadata.title && (
                <>
                  <span style={{ opacity: 0.7 }}>Title:</span>
                  <span>{metadata.title}</span>
                </>
              )}
              {metadata.artist && (
                <>
                  <span style={{ opacity: 0.7 }}>Artist:</span>
                  <span>{metadata.artist}</span>
                </>
              )}
              {metadata.album && (
                <>
                  <span style={{ opacity: 0.7 }}>Album:</span>
                  <span>{metadata.album}</span>
                </>
              )}
              {metadata.codec && (
                <>
                  <span style={{ opacity: 0.7 }}>Codec:</span>
                  <span>{metadata.codec}</span>
                </>
              )}
              {metadata.bitrate && (
                <>
                  <span style={{ opacity: 0.7 }}>Bitrate:</span>
                  <span>{metadata.bitrate}</span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
