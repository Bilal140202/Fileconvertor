import type { AudioConvertOptions, AudioFormat, AudioEQPreset } from '../../lib/types/conversion';

export interface AudioOptionsPanelProps {
  options: AudioConvertOptions;
  onChange: (next: AudioConvertOptions) => void;
}

const outputFormats: AudioFormat[] = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'opus'];
const eqPresets: AudioEQPreset[] = ['flat', 'bass_boost', 'treble_boost', 'vocal'];
const bitrateOptions = ['64k', '128k', '192k', '256k', '320k'];
const sampleRates = [8000, 16000, 22050, 44100, 48000, 96000];

export function AudioOptionsPanel({ options, onChange }: AudioOptionsPanelProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section>
        <label>
          Output Format
          <select
            value={options.outputFormat}
            onChange={(e) => onChange({ ...options, outputFormat: e.target.value as AudioFormat })}
          >
            {outputFormats.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label>
          Bitrate
          <select
            value={options.bitrate ?? '128k'}
            onChange={(e) => onChange({ ...options, bitrate: e.target.value })}
          >
            {bitrateOptions.map((br) => (
              <option key={br} value={br}>
                {br}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sample Rate
          <select
            value={options.sampleRate ?? 44100}
            onChange={(e) => onChange({ ...options, sampleRate: Number(e.target.value) })}
          >
            {sampleRates.map((sr) => (
              <option key={sr} value={sr}>
                {sr} Hz
              </option>
            ))}
          </select>
        </label>

        <label>
          Channels
          <select
            value={options.channels ?? 2}
            onChange={(e) => onChange({ ...options, channels: Number(e.target.value) })}
          >
            <option value={1}>Mono</option>
            <option value={2}>Stereo</option>
          </select>
        </label>
      </section>

      <section>
        <h3>Trim</h3>
        <label>
          Start (seconds)
          <input
            type="number"
            step={0.1}
            value={options.trim?.start ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                trim: {
                  start: e.target.value === '' ? 0 : Number(e.target.value),
                  end: options.trim?.end ?? 0
                }
              })
            }
          />
        </label>
        <label>
          End (seconds)
          <input
            type="number"
            step={0.1}
            value={options.trim?.end ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                trim: {
                  start: options.trim?.start ?? 0,
                  end: e.target.value === '' ? 0 : Number(e.target.value)
                }
              })
            }
          />
        </label>
      </section>

      <section>
        <h3>Effects</h3>
        <label>
          Speed
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={options.speed ?? 1}
            onChange={(e) => onChange({ ...options, speed: Number(e.target.value) })}
          />
          <span>{(options.speed ?? 1).toFixed(1)}x</span>
        </label>

        <label>
          Volume Normalization
          <input
            type="checkbox"
            checked={options.volumeNormalization ?? false}
            onChange={(e) => onChange({ ...options, volumeNormalization: e.target.checked })}
          />
        </label>

        <label>
          Fade In (seconds)
          <input
            type="number"
            step={0.1}
            value={options.fade?.in ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                fade: {
                  in: e.target.value === '' ? undefined : Number(e.target.value),
                  out: options.fade?.out
                }
              })
            }
          />
        </label>

        <label>
          Fade Out (seconds)
          <input
            type="number"
            step={0.1}
            value={options.fade?.out ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                fade: {
                  in: options.fade?.in,
                  out: e.target.value === '' ? undefined : Number(e.target.value)
                }
              })
            }
          />
        </label>

        <label>
          EQ Preset
          <select
            value={options.eqPreset ?? 'flat'}
            onChange={(e) => onChange({ ...options, eqPreset: e.target.value as AudioEQPreset })}
          >
            {eqPresets.map((preset) => (
              <option key={preset} value={preset}>
                {preset.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h3>Metadata</h3>
        <label>
          Title
          <input
            type="text"
            value={options.metadata?.title ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                metadata: { ...(options.metadata ?? {}), title: e.target.value }
              })
            }
          />
        </label>
        <label>
          Artist
          <input
            type="text"
            value={options.metadata?.artist ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                metadata: { ...(options.metadata ?? {}), artist: e.target.value }
              })
            }
          />
        </label>
        <label>
          Album
          <input
            type="text"
            value={options.metadata?.album ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                metadata: { ...(options.metadata ?? {}), album: e.target.value }
              })
            }
          />
        </label>
        <label>
          Year
          <input
            type="text"
            value={options.metadata?.year ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                metadata: { ...(options.metadata ?? {}), year: e.target.value }
              })
            }
          />
        </label>
        <label>
          Genre
          <input
            type="text"
            value={options.metadata?.genre ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                metadata: { ...(options.metadata ?? {}), genre: e.target.value }
              })
            }
          />
        </label>
      </section>
    </div>
  );
}
