import type { ImageConvertOptions, ImageFormat } from '../../lib/types/conversion';

export interface OptionsPanelProps {
  options: ImageConvertOptions;
  onChange: (next: ImageConvertOptions) => void;
}

const outputFormats: ImageFormat[] = ['png', 'jpeg', 'webp', 'gif', 'tiff', 'ico', 'bmp'];

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section>
        <label>
          Output
          <select
            value={options.outputFormat}
            onChange={(e) => onChange({ ...options, outputFormat: e.target.value as ImageFormat })}
          >
            {outputFormats.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quality
          <input
            type="range"
            min={1}
            max={100}
            value={options.quality ?? 80}
            onChange={(e) => onChange({ ...options, quality: Number(e.target.value) })}
          />
        </label>

        <label>
          Background
          <input
            type="color"
            value={options.backgroundColor ?? '#ffffff'}
            onChange={(e) => onChange({ ...options, backgroundColor: e.target.value })}
          />
        </label>
      </section>

      <section>
        <h3>Resize</h3>
        <label>
          Width
          <input
            type="number"
            value={options.resize?.width ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                resize: {
                  ...(options.resize ?? {}),
                  width: e.target.value === '' ? undefined : Number(e.target.value)
                }
              })
            }
          />
        </label>
        <label>
          Height
          <input
            type="number"
            value={options.resize?.height ?? ''}
            onChange={(e) =>
              onChange({
                ...options,
                resize: {
                  ...(options.resize ?? {}),
                  height: e.target.value === '' ? undefined : Number(e.target.value)
                }
              })
            }
          />
        </label>
      </section>

      <section>
        <h3>Crop</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {(['x', 'y', 'width', 'height'] as const).map((key) => (
            <label key={key}>
              {key}
              <input
                type="number"
                value={options.crop?.[key] ?? ''}
                onChange={(e) => {
                  const current = options.crop ?? { x: 0, y: 0, width: 1, height: 1 };
                  const nextValue = e.target.value === '' ? current[key] : Number(e.target.value);
                  const nextCrop = { ...current, [key]: nextValue } as typeof current;
                  onChange({
                    ...options,
                    crop: nextCrop
                  });
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Rotate / Flip</h3>
        <label>
          Rotate
          <input
            type="number"
            value={options.rotate ?? 0}
            onChange={(e) => onChange({ ...options, rotate: Number(e.target.value) })}
          />
        </label>
        <label>
          Flip
          <input type="checkbox" checked={options.flip ?? false} onChange={(e) => onChange({ ...options, flip: e.target.checked })} />
        </label>
        <label>
          Flop
          <input type="checkbox" checked={options.flop ?? false} onChange={(e) => onChange({ ...options, flop: e.target.checked })} />
        </label>
      </section>

      <section>
        <h3>Filters</h3>
        <label>
          Brightness
          <input
            type="range"
            min={-100}
            max={100}
            value={options.filters?.brightness ?? 0}
            onChange={(e) =>
              onChange({
                ...options,
                filters: { ...(options.filters ?? {}), brightness: Number(e.target.value) }
              })
            }
          />
        </label>
        <label>
          Contrast
          <input
            type="range"
            min={-100}
            max={100}
            value={options.filters?.contrast ?? 0}
            onChange={(e) =>
              onChange({
                ...options,
                filters: { ...(options.filters ?? {}), contrast: Number(e.target.value) }
              })
            }
          />
        </label>
        <label>
          Saturation
          <input
            type="range"
            min={-100}
            max={100}
            value={options.filters?.saturation ?? 0}
            onChange={(e) =>
              onChange({
                ...options,
                filters: { ...(options.filters ?? {}), saturation: Number(e.target.value) }
              })
            }
          />
        </label>
        <label>
          Hue
          <input
            type="range"
            min={-180}
            max={180}
            value={options.filters?.hue ?? 0}
            onChange={(e) =>
              onChange({
                ...options,
                filters: { ...(options.filters ?? {}), hue: Number(e.target.value) }
              })
            }
          />
        </label>
      </section>
    </div>
  );
}
