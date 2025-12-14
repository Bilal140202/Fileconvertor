'use client';

import type { ChangeEvent } from 'react';

import type { DocumentConversionOptions, DocumentFormat } from '@lib/adapters/document-converter';

export type OptionsPanelProps = {
  inputFormat?: DocumentFormat;
  outputFormat: DocumentFormat;
  value: Omit<DocumentConversionOptions, 'to' | 'from'>;
  onChange: (next: Omit<DocumentConversionOptions, 'to' | 'from'>) => void;
};

function updateNumber(
  e: ChangeEvent<HTMLInputElement>,
  current: number | undefined,
  onUpdate: (n: number | undefined) => void
) {
  const raw = e.target.value;
  if (raw.trim() === '') {
    onUpdate(undefined);
    return;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    onUpdate(current);
    return;
  }
  onUpdate(n);
}

export function OptionsPanel({ inputFormat, outputFormat, value, onChange }: OptionsPanelProps) {
  const showPdfControls = outputFormat === 'pdf' || inputFormat === 'pdf';
  const showSheetControls = inputFormat === 'xlsx' || outputFormat === 'xlsx' || outputFormat === 'csv';
  const showSlideControls = inputFormat === 'pptx' || outputFormat === 'pptx';

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {showPdfControls ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <h3>Pages</h3>
          <label style={{ display: 'grid', gap: 4 }}>
            Page range
            <input
              value={value.pageRange ?? ''}
              placeholder="e.g. 1-3,5"
              onChange={(e) => onChange({ ...value, pageRange: e.target.value || undefined })}
            />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            Paper size
            <select
              value={value.paperSize ?? 'A4'}
              onChange={(e) => onChange({ ...value, paperSize: e.target.value as any })}
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            Orientation
            <select
              value={value.orientation ?? 'portrait'}
              onChange={(e) => onChange({ ...value, orientation: e.target.value as any })}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>

          <details>
            <summary>Margins (points)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                Top
                <input
                  inputMode="numeric"
                  value={value.margins?.top ?? ''}
                  onChange={(e) =>
                    updateNumber(e, value.margins?.top, (top) =>
                      onChange({
                        ...value,
                        margins: { ...value.margins, top }
                      })
                    )
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Right
                <input
                  inputMode="numeric"
                  value={value.margins?.right ?? ''}
                  onChange={(e) =>
                    updateNumber(e, value.margins?.right, (right) =>
                      onChange({
                        ...value,
                        margins: { ...value.margins, right }
                      })
                    )
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Bottom
                <input
                  inputMode="numeric"
                  value={value.margins?.bottom ?? ''}
                  onChange={(e) =>
                    updateNumber(e, value.margins?.bottom, (bottom) =>
                      onChange({
                        ...value,
                        margins: { ...value.margins, bottom }
                      })
                    )
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Left
                <input
                  inputMode="numeric"
                  value={value.margins?.left ?? ''}
                  onChange={(e) =>
                    updateNumber(e, value.margins?.left, (left) =>
                      onChange({
                        ...value,
                        margins: { ...value.margins, left }
                      })
                    )
                  }
                />
              </label>
            </div>
          </details>
        </div>
      ) : null}

      {showSheetControls ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <h3>Sheets</h3>
          <label style={{ display: 'grid', gap: 4 }}>
            Sheet range
            <input
              value={value.sheetRange ?? ''}
              placeholder="e.g. 1,3"
              onChange={(e) => onChange({ ...value, sheetRange: e.target.value || undefined })}
            />
          </label>
        </div>
      ) : null}

      {showSlideControls ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <h3>Slides</h3>
          <label style={{ display: 'grid', gap: 4 }}>
            Slide range
            <input
              value={value.slideRange ?? ''}
              placeholder="e.g. 1-5"
              onChange={(e) => onChange({ ...value, slideRange: e.target.value || undefined })}
            />
          </label>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 8 }}>
        <h3>Security + watermarks</h3>
        <label style={{ display: 'grid', gap: 4 }}>
          Password (not supported in this build)
          <input
            type="password"
            value={value.password ?? ''}
            onChange={(e) => onChange({ ...value, password: e.target.value || undefined })}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          Watermark text
          <input
            value={value.watermarkText ?? ''}
            onChange={(e) => onChange({ ...value, watermarkText: e.target.value || undefined })}
          />
        </label>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={Boolean(value.merge)}
          onChange={(e) => onChange({ ...value, merge: e.target.checked })}
        />
        Merge multiple inputs
      </label>
    </section>
  );
}
