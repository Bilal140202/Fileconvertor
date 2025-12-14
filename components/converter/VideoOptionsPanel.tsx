import type { VideoConvertOptions, VideoFormat, VideoCodec } from '../../lib/types/conversion';

export interface VideoOptionsPanelProps {
  options: VideoConvertOptions;
  onChange: (next: VideoConvertOptions) => void;
}

const outputFormats: VideoFormat[] = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv'];
const codecs: VideoCodec[] = ['h264', 'vp8', 'vp9'];

const resolutionPresets = [
  { label: '480p', width: 854, height: 480 },
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '1440p', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 }
];

export function VideoOptionsPanel({ options, onChange }: VideoOptionsPanelProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section>
        <h3>Output Settings</h3>
        <label>
          Format
          <select
            value={options.outputFormat}
            onChange={(e) => onChange({ ...options, outputFormat: e.target.value as VideoFormat })}
          >
            {outputFormats.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label>
          Codec
          <select
            value={options.codec ?? ''}
            onChange={(e) => onChange({ ...options, codec: e.target.value ? (e.target.value as VideoCodec) : undefined })}
          >
            <option value="">Auto</option>
            {codecs.map((codec) => (
              <option key={codec} value={codec}>
                {codec.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label>
          Bitrate (kb/s)
          <input
            type="number"
            min={100}
            max={50000}
            step={100}
            value={options.bitrate ?? ''}
            placeholder="Auto"
            onChange={(e) => onChange({ ...options, bitrate: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>

        <label>
          Frame Rate (fps)
          <input
            type="number"
            min={1}
            max={120}
            value={options.frameRate ?? ''}
            placeholder="Original"
            onChange={(e) => onChange({ ...options, frameRate: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
      </section>

      <section>
        <h3>Resolution</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {resolutionPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() =>
                onChange({
                  ...options,
                  resolution: { width: preset.width, height: preset.height }
                })
              }
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                background:
                  options.resolution?.width === preset.width && options.resolution?.height === preset.height
                    ? '#007bff'
                    : '#fff',
                color:
                  options.resolution?.width === preset.width && options.resolution?.height === preset.height
                    ? '#fff'
                    : '#000',
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>
            Width
            <input
              type="number"
              value={options.resolution?.width ?? ''}
              placeholder="Original"
              onChange={(e) =>
                onChange({
                  ...options,
                  resolution: {
                    ...(options.resolution ?? {}),
                    width: e.target.value ? Number(e.target.value) : undefined
                  }
                })
              }
            />
          </label>
          <label>
            Height
            <input
              type="number"
              value={options.resolution?.height ?? ''}
              placeholder="Original"
              onChange={(e) =>
                onChange({
                  ...options,
                  resolution: {
                    ...(options.resolution ?? {}),
                    height: e.target.value ? Number(e.target.value) : undefined
                  }
                })
              }
            />
          </label>
        </div>

        <label>
          Scale Mode
          <select
            value={options.scaleMode ?? 'fit'}
            onChange={(e) => onChange({ ...options, scaleMode: e.target.value as 'fit' | 'fill' | 'stretch' })}
          >
            <option value="fit">Fit (maintain aspect ratio)</option>
            <option value="fill">Fill (crop to fit)</option>
            <option value="stretch">Stretch (ignore aspect ratio)</option>
          </select>
        </label>
      </section>

      <section>
        <h3>Trim</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>
            Start (seconds)
            <input
              type="number"
              min={0}
              step={0.1}
              value={options.trim?.start ?? ''}
              placeholder="0"
              onChange={(e) =>
                onChange({
                  ...options,
                  trim: {
                    ...(options.trim ?? {}),
                    start: e.target.value ? Number(e.target.value) : undefined
                  }
                })
              }
            />
          </label>
          <label>
            End (seconds)
            <input
              type="number"
              min={0}
              step={0.1}
              value={options.trim?.end ?? ''}
              placeholder="End of video"
              onChange={(e) =>
                onChange({
                  ...options,
                  trim: {
                    ...(options.trim ?? {}),
                    end: e.target.value ? Number(e.target.value) : undefined
                  }
                })
              }
            />
          </label>
        </div>
      </section>

      <section>
        <h3>Audio & Subtitles</h3>
        <label>
          Audio Track
          <input
            type="number"
            min={0}
            value={options.audioTrack ?? ''}
            placeholder="Default"
            onChange={(e) => onChange({ ...options, audioTrack: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>

        <label>
          Subtitle Track
          <input
            type="number"
            min={0}
            value={options.subtitleTrack ?? ''}
            placeholder="None"
            onChange={(e) => onChange({ ...options, subtitleTrack: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>

        {options.subtitleTrack !== undefined && (
          <label>
            Burn Subtitles
            <input
              type="checkbox"
              checked={options.burnSubtitles ?? false}
              onChange={(e) => onChange({ ...options, burnSubtitles: e.target.checked })}
            />
          </label>
        )}
      </section>
    </div>
  );
}
